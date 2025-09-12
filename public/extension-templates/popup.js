
'use strict';

const views = {
    register: document.getElementById('register-view'),
    pending: document.getElementById('pending-view'),
    connected: document.getElementById('connected-view'),
    error: document.getElementById('error-view'),
    guide: document.getElementById('guide-view'),
};

const elements = {
    header: document.getElementById('header'),
    headerName: document.getElementById('header-name'),
    headerLogo: document.getElementById('header-logo'),
    mainContent: document.getElementById('main-content'),
    footer: document.getElementById('footer'),
    // Register view
    registerNameInput: document.getElementById('register-name'),
    registerUserId: document.getElementById('register-userid'),
    registerButton: document.getElementById('register-button'),
    // Connected view
    powerButton: document.getElementById('power-button'),
    connectionStatusText: document.getElementById('connection-status-text'),
    infoUserName: document.getElementById('info-user-name'),
    infoOu: document.getElementById('info-ou'),
    infoUserId: document.getElementById('info-user-id'),
    // Error view
    errorPanelAddress: document.getElementById('error-panel-address'),
    errorRetryButton: document.getElementById('error-retry-button'),
    // Guide view
    guideButton: document.getElementById('guide-button'),
    guideContentArea: document.getElementById('guide-content-area'),
    backToMainButton: document.getElementById('back-to-main-button'),
    // Footer
    syncTime: document.getElementById('footer-sync-time'),
    refreshButton: document.getElementById('refresh-button'),
    refreshIcon: document.getElementById('refresh-icon'),
};

const setView = (viewName) => {
    Object.values(views).forEach(view => view.classList.add('hidden'));
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
    }
    // Show/hide footer based on view
    const showFooter = ['connected', 'error', 'pending'].includes(viewName);
    elements.footer.classList.toggle('hidden', !showFooter);
    if(viewName === 'guide') {
         elements.header.classList.add('hidden');
         elements.footer.classList.add('hidden');
    } else {
        elements.header.classList.remove('hidden');
    }
};

const updateSyncTime = () => {
    chrome.storage.local.get('lastSync', ({ lastSync }) => {
        if (lastSync) {
            const diff = Math.round((Date.now() - lastSync) / 60000);
            elements.syncTime.textContent = `Last sync: ${diff} min ago`;
        } else {
            elements.syncTime.textContent = 'Last sync: never';
        }
    });
};

const generateUserId = async () => {
    const { idPrefix = 'USR-EXP-', idDigits = 4 } = await chrome.storage.local.get(['idPrefix', 'idDigits']);
    const randomPart = Math.random().toString(36).substring(2, 2 + idDigits).toUpperCase();
    return `${idPrefix}${randomPart}`;
};

const checkStatus = async () => {
    elements.refreshIcon.classList.add('animate-spin');
    try {
        const { panelAddress, userId } = await chrome.storage.local.get(['panelAddress', 'userId']);
        if (!panelAddress || !userId) {
            throw new Error('Initial setup required.');
        }

        const response = await fetch(`${panelAddress}/api/extension/config?userId=${userId}`);

        if (response.status === 200) {
            const config = await response.json();
            await chrome.storage.local.set({ status: 'connected', userConfig: config, lastSync: Date.now() });
            updateConnectedView(config);
            setView('connected');
        } else if (response.status === 403) {
            const errorData = await response.json();
            if (errorData.status === 'Pending' || errorData.status === 'Rejected') {
                await chrome.storage.local.set({ status: 'pending', lastSync: Date.now() });
                setView('pending');
            } else {
                 throw new Error('Registration not approved.');
            }
        } else if (response.status === 404) {
            // User ID not found on server, reset to register
            await chrome.storage.local.remove(['status', 'userConfig']);
            const newUserId = await generateUserId();
            await chrome.storage.local.set({ userId: newUserId });
            elements.registerUserId.textContent = newUserId;
            setView('register');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }
    } catch (error) {
        console.error('Status check failed:', error);
        const { panelAddress } = await chrome.storage.local.get('panelAddress');
        elements.errorPanelAddress.value = panelAddress || '';
        setView('error');
    } finally {
        updateSyncTime();
        elements.refreshIcon.classList.remove('animate-spin');
    }
};

const updateConnectedView = (config) => {
    if (!config) return;
    elements.infoUserName.textContent = config.user.name;
    elements.infoOu.textContent = config.user.ou;
    elements.infoUserId.textContent = config.user.userId;
    // Update guide content
    elements.guideContentArea.innerHTML = config.guideContent || '<p>No guide content available.</p>';
    const guideAlignment = config.guideContentAlignment || 'ltr';
    elements.guideContentArea.setAttribute('dir', guideAlignment);

};

const registerUser = async () => {
    const name = elements.registerNameInput.value.trim();
    if (!name) {
        alert('Please enter your name.');
        return;
    }

    try {
        const { panelAddress, userId } = await chrome.storage.local.get(['panelAddress', 'userId']);
        const response = await fetch(`${panelAddress}/api/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userName: name }),
        });

        if (response.ok || response.status === 409) { // 409 means request already exists
            await chrome.storage.local.set({ status: 'pending', lastSync: Date.now() });
            setView('pending');
            updateSyncTime();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        const { panelAddress } = await chrome.storage.local.get('panelAddress');
        elements.errorPanelAddress.value = panelAddress || '';
        setView('error');
    }
};

const savePanelAddressAndRetry = async () => {
    const newAddress = elements.errorPanelAddress.value.trim();
    if (!newAddress) {
        alert('Please enter a panel address.');
        return;
    }
    await chrome.storage.local.set({ panelAddress: newAddress });
    await checkStatus();
};

const togglePower = async () => {
    const { isEnabled = true } = await chrome.storage.local.get('isEnabled');
    const newIsEnabled = !isEnabled;
    await chrome.storage.local.set({ isEnabled: newIsEnabled });

    if (newIsEnabled) {
        elements.powerButton.classList.remove('power-button-disabled');
        elements.powerButton.classList.add('power-button-connected');
        elements.connectionStatusText.textContent = 'Connected';
    } else {
        elements.powerButton.classList.remove('power-button-connected');
        elements.powerButton.classList.add('power-button-disabled');
        elements.connectionStatusText.textContent = 'Disconnected';
    }
     // Send message to background script to update proxy settings
    chrome.runtime.sendMessage({ action: 'toggleProxy', isEnabled: newIsEnabled });
};


const init = async () => {
    // 1. Set default panel address if not present
    let { panelAddress } = await chrome.storage.local.get('panelAddress');
    if (!panelAddress) {
        // This is a placeholder. In a real scenario, this would be set during build.
        // For the preview, it uses the current window location.
        const defaultAddress = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        await chrome.storage.local.set({ panelAddress: defaultAddress });
    }

    // 2. Load global settings from storage
    const { extensionName, companyLogo, isEnabled = true } = await chrome.storage.local.get(['extensionName', 'companyLogo', 'isEnabled']);
    if (extensionName) {
        elements.headerName.textContent = extensionName;
    }
    if (companyLogo) {
        elements.headerLogo.src = companyLogo;
    } else {
        elements.headerLogo.src = 'icons/icon128.png';
    }
    
    // Set initial power button state
     if (isEnabled) {
        elements.powerButton.classList.remove('power-button-disabled');
        elements.powerButton.classList.add('power-button-connected');
        elements.connectionStatusText.textContent = 'Connected';
    } else {
        elements.powerButton.classList.remove('power-button-connected');
        elements.powerButton.classList.add('power-button-disabled');
        elements.connectionStatusText.textContent = 'Disconnected';
    }


    // 3. Determine initial view
    const { status, userId, userConfig } = await chrome.storage.local.get(['status', 'userId', 'userConfig']);
    
    if (status === 'connected') {
        updateConnectedView(userConfig);
        setView('connected');
        checkStatus(); // Refresh in background
    } else if (status === 'pending') {
        setView('pending');
        checkStatus(); // Refresh in background
    } else {
        // Default to register view
        const newUserId = await generateUserId();
        await chrome.storage.local.set({ userId: newUserId });
        elements.registerUserId.textContent = newUserId;
        setView('register');
    }

    // 4. Add event listeners
    elements.registerButton.addEventListener('click', registerUser);
    elements.errorRetryButton.addEventListener('click', savePanelAddressAndRetry);
    elements.refreshButton.addEventListener('click', checkStatus);
    elements.powerButton.addEventListener('click', togglePower);
    elements.guideButton.addEventListener('click', () => setView('guide'));
    elements.backToMainButton.addEventListener('click', async () => {
         const { status } = await chrome.storage.local.get('status');
         setView(status || 'register');
    });

    updateSyncTime();
};

document.addEventListener('DOMContentLoaded', init);

    