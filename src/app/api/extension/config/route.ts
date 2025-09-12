
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// This is a simplified representation of the chrome.proxy object structure
interface ProxyConfig {
    protocol?: 'http' | 'https' | 'socks4' | 'socks5';
    host?: string;
    port?: number;
}

interface ExtensionConfig {
    user: {
        name: string;
        ou: string;
    },
    proxy: ProxyConfig;
    bypassList: string[];
    panelAddress: string;
    guideContent?: string;
}

const SETTINGS_KEY = 'extensionCustomization';


// In a real production app, this endpoint MUST be protected by authentication.
// This is to ensure that only authorized users/extensions can fetch configurations.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const db = await getDb();

    // 1. Find the user by their extension ID
    const user = await db.get('SELECT * FROM users WHERE userId = ?', userId);

    if (!user) {
      // Before saying user not found, check if a request exists for them.
      const existingRequest = await db.get('SELECT * FROM requests WHERE userId = ?', userId);
      if (existingRequest) {
          // If a request exists (pending or rejected), return a specific status.
          return NextResponse.json({ error: 'User registration not approved', status: existingRequest.status }, { status: 403 });
      }
      return NextResponse.json({ error: 'User not found or not registered' }, { status: 404 });
    }

    // 2. Determine the routing rule to apply
    let routingRule;
    let effectiveProxyName = '';
    let domainsToProxy: string[] = [];
    let domainsToBypass: string[] = [];

    if (user.customConfigEnabled && user.customProxyConfig) {
      const customConfig = JSON.parse(user.customProxyConfig);
      effectiveProxyName = customConfig.proxy;
      routingRule = {
        mode: customConfig.mode,
        domains: customConfig.domains || [],
        bypassDomains: customConfig.bypassDomains || []
      };
    } else {
      // Find the rule for the user's OU
      routingRule = await db.get('SELECT * FROM routing_rules WHERE ou = ?', user.ou);
      if (routingRule) {
        effectiveProxyName = routingRule.proxy;
      }
    }
    
    if (!routingRule) {
        // Fallback: If no rule is found, block or use a default direct connection
        return NextResponse.json({
            user: { name: user.name, ou: user.ou },
            proxy: {}, // Empty proxy config means direct connection
            bypassList: ["<local>"],
            panelAddress: request.nextUrl.origin
        });
    }

    // 3. Parse domains from the rule
    if (routingRule.mode === 'directExcept' && routingRule.domains) {
        domainsToProxy = typeof routingRule.domains === 'string' ? JSON.parse(routingRule.domains) : routingRule.domains;
    } else if (routingRule.mode === 'proxyAll' && routingRule.bypassDomains) {
        domainsToBypass = typeof routingRule.bypassDomains === 'string' ? JSON.parse(routingRule.bypassDomains) : routingRule.bypassDomains;
    }

    // 4. Fetch the details of the proxy to be used
    let proxyDetails;
    try {
        // Check if the proxy name is a JSON object (custom proxy)
        const customProxy = JSON.parse(effectiveProxyName);
        proxyDetails = {
            protocol: customProxy.protocol,
            ip: customProxy.address,
            port: customProxy.port,
            username: customProxy.username,
            password: customProxy.password,
        };
    } catch (e) {
        // If not JSON, it's a proxy name from the database
        proxyDetails = await db.get('SELECT * FROM proxies WHERE name = ?', effectiveProxyName);
    }
    

    if (!proxyDetails) {
      return NextResponse.json({ error: `Proxy configuration '${effectiveProxyName}' not found` }, { status: 404 });
    }
    
    // 5. Fetch the guide content from settings
    const settingsResult = await db.get('SELECT value FROM settings WHERE key = ?', SETTINGS_KEY);
    let guideContent = '';
    if (settingsResult) {
        const settings = JSON.parse(settingsResult.value);
        guideContent = settings.guideContent || '';
    }


    // 6. Construct the final configuration object for the extension
    const finalConfig: ExtensionConfig = {
      user: {
        name: user.name,
        ou: user.ou,
      },
      proxy: {
        protocol: proxyDetails.protocol,
        host: proxyDetails.ip,
        port: parseInt(proxyDetails.port, 10),
      },
      // Note: The logic for PAC scripts can be complex.
      // For 'fixed_servers' mode, the bypassList is the primary control.
      // We are simplifying here: for directExcept, we would ideally need a PAC script.
      // For now, we'll proxy everything and just use the bypass list for proxyAll mode.
      bypassList: routingRule.mode === 'proxyAll' ? domainsToBypass.concat(["<local>"]) : ["<local>"],
      panelAddress: request.nextUrl.origin,
      guideContent: guideContent
    };

    return NextResponse.json(finalConfig);

  } catch (error: any) {
    console.error('API Error fetching extension config:', error);
    return NextResponse.json({ error: 'Failed to retrieve configuration from server.', details: error.message }, { status: 500 });
  }
}
