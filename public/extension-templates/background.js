let proxyConfig = null;
let isProxyEnabled = false;

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_CONFIG') {
        proxyConfig = message.config;
        if (isProxyEnabled) {
            applyProxyConfig();
        }
    } else if (message.type === 'TOGGLE_PROXY') {
        isProxyEnabled = message.enabled;
        if (isProxyEnabled && proxyConfig) {
            applyProxyConfig();
        } else {
            clearProxyConfig();
        }
    }
});

// Apply proxy configuration
function applyProxyConfig() {
    if (!proxyConfig) return;

    chrome.proxy.settings.set({
        value: {
            mode: "fixed_servers",
            rules: {
                singleProxy: {
                    scheme: proxyConfig.scheme,
                    host: proxyConfig.host,
                    port: parseInt(proxyConfig.port)
                },
                bypassList: proxyConfig.bypassList || []
            }
        },
        scope: "regular"
    });
}

// Clear proxy configuration
function clearProxyConfig() {
    chrome.proxy.settings.set({
        value: { mode: "direct" },
        scope: "regular"
    });
}

// Check stored state on startup
chrome.storage.local.get(['connectionStatus'], (result) => {
    isProxyEnabled = result.connectionStatus === 'connected';
    if (isProxyEnabled) {
        applyProxyConfig();
    }
});
