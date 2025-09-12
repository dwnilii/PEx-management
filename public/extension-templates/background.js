
'use strict';

// This variable will be replaced by the build process
const panelAddress = '__PEX_PANEL_ADDRESS__';

// Function to clear any existing proxy settings
function clearProxy() {
  chrome.proxy.settings.clear({ scope: 'regular' }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error clearing proxy:', chrome.runtime.lastError);
    } else {
      console.log('Proxy settings cleared.');
    }
  });
}

// Function to set the proxy
function setProxy(config) {
  if (!config || !config.proxy || !config.proxy.host) {
    console.log("Received invalid or empty config. Clearing proxy.");
    clearProxy();
    return;
  }

  const proxyConfig = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: config.proxy.protocol || 'http',
        host: config.proxy.host,
        port: parseInt(config.proxy.port, 10),
      },
      bypassList: config.bypassList || ['<local>'],
    },
  };

  chrome.proxy.settings.set({ value: proxyConfig, scope: 'regular' }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error setting proxy:', chrome.runtime.lastError, 'with config:', proxyConfig);
    } else {
      console.log('Proxy set successfully:', proxyConfig);
    }
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateProxy') {
    setProxy(request.config);
  }
  return true;
});

// Clear proxy settings when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  clearProxy();
});

// Clear proxy settings when the browser is closed
chrome.windows.onRemoved.addListener(() => {
    clearProxy();
});

// This makes the panelAddress accessible to the popup script
self.panelAddress = panelAddress;
