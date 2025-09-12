// Constants
const API_ENDPOINT = ''; // Will be set during installation
const STORAGE_KEYS = {
    USER_ID: 'userId',
    USER_NAME: 'userName',
    USER_OU: 'userOu',
    REGISTRATION_STATUS: 'registrationStatus',
    CONNECTION_STATUS: 'connectionStatus',
    LAST_SYNC: 'lastSync'
};

// DOM Elements
const views = {
    register: document.getElementById('register-view'),
    pending: document.getElementById('pending-view'),
    connected: document.getElementById('connected-view'),
    error: document.getElementById('error-view')
};

const elements = {
    title: document.querySelector('.title'),
    userName: document.getElementById('user-name'),
    userId: document.getElementById('user-id'),
    registerBtn: document.getElementById('register-btn'),
    powerBtn: document.getElementById('power-btn'),
    retryBtn: document.getElementById('retry-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    connectionStatus: document.getElementById('connection-status'),
    infoUser: document.getElementById('info-user'),
    infoOu: document.getElementById('info-ou'),
    infoId: document.getElementById('info-id'),
    lastSync: document.getElementById('last-sync')
};

// State Management
let currentState = {
    userId: null,
    userName: null,
    userOu: null,
    registrationStatus: 'unregistered', // unregistered, pending, approved
    connectionStatus: 'disconnected', // connected, disconnected
    lastSync: null
};

// Helper Functions
function showView(viewName) {
    Object.keys(views).forEach(key => {
        views[key].classList.toggle('hidden', key !== viewName);
    });
}

function generateUserId() {
    const prefix = 'USR-EXP-';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function updateUI() {
    // Update connection status UI
    elements.powerBtn?.classList.toggle('connected', currentState.connectionStatus === 'connected');
    elements.powerBtn?.classList.toggle('disconnected', currentState.connectionStatus === 'disconnected');
    if (elements.connectionStatus) {
        elements.connectionStatus.textContent = currentState.connectionStatus === 'connected' ? 'Connected' : 'Disconnected';
    }

    // Update info panel
    if (elements.infoUser) elements.infoUser.textContent = currentState.userName || '';
    if (elements.infoOu) elements.infoOu.textContent = currentState.userOu || '';
    if (elements.infoId) elements.infoId.textContent = currentState.userId || '';

    // Update last sync
    if (currentState.lastSync) {
        const timeAgo = Math.floor((Date.now() - currentState.lastSync) / 60000);
        elements.lastSync.textContent = `Last sync: ${timeAgo} min ago`;
    }

    // Show appropriate view
    if (currentState.registrationStatus === 'unregistered') {
        showView('register');
    } else if (currentState.registrationStatus === 'pending') {
        showView('pending');
    } else if (currentState.registrationStatus === 'approved') {
        showView('connected');
    }
}

// API Functions
async function register(userName, userId) {
    try {
        const response = await fetch(`${API_ENDPOINT}/api/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: userName,
                deviceId: userId
            })
        });

        if (!response.ok) throw new Error('Registration failed');

        currentState.registrationStatus = 'pending';
        currentState.userName = userName;
        currentState.userId = userId;
        
        await chrome.storage.local.set({
            [STORAGE_KEYS.REGISTRATION_STATUS]: 'pending',
            [STORAGE_KEYS.USER_NAME]: userName,
            [STORAGE_KEYS.USER_ID]: userId
        });

        updateUI();
    } catch (error) {
        console.error('Registration error:', error);
        showView('error');
    }
}

async function checkStatus() {
    try {
        const response = await fetch(`${API_ENDPOINT}/api/requests/${currentState.userId}`);
        const data = await response.json();

        if (data.status === 'approved') {
            currentState.registrationStatus = 'approved';
            currentState.userOu = data.ou;
            currentState.lastSync = Date.now();

            await chrome.storage.local.set({
                [STORAGE_KEYS.REGISTRATION_STATUS]: 'approved',
                [STORAGE_KEYS.USER_OU]: data.ou,
                [STORAGE_KEYS.LAST_SYNC]: Date.now()
            });

            // Get proxy configuration
            const configResponse = await fetch(`${API_ENDPOINT}/api/extension/config`);
            const config = await configResponse.json();

            // Send config to background script
            chrome.runtime.sendMessage({
                type: 'UPDATE_CONFIG',
                config: config
            });

            updateUI();
        }
    } catch (error) {
        console.error('Status check error:', error);
        showView('error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Set extension name
    const manifest = chrome.runtime.getManifest();
    elements.title.textContent = manifest.name;

    // Generate or retrieve user ID
    const stored = await chrome.storage.local.get(null);
    currentState = {
        ...currentState,
        userId: stored[STORAGE_KEYS.USER_ID] || generateUserId(),
        userName: stored[STORAGE_KEYS.USER_NAME],
        userOu: stored[STORAGE_KEYS.USER_OU],
        registrationStatus: stored[STORAGE_KEYS.REGISTRATION_STATUS] || 'unregistered',
        connectionStatus: stored[STORAGE_KEYS.CONNECTION_STATUS] || 'disconnected',
        lastSync: stored[STORAGE_KEYS.LAST_SYNC]
    };

    // Update UI with stored values
    elements.userId.textContent = currentState.userId;
    updateUI();

    // If approved, start status polling
    if (currentState.registrationStatus === 'approved') {
        setInterval(checkStatus, 30000); // Check every 30 seconds
    }
});

elements.registerBtn?.addEventListener('click', () => {
    const userName = elements.userName?.value.trim();
    if (userName) {
        register(userName, currentState.userId);
    }
});

elements.powerBtn?.addEventListener('click', () => {
    const newStatus = currentState.connectionStatus === 'connected' ? 'disconnected' : 'connected';
    currentState.connectionStatus = newStatus;
    chrome.storage.local.set({ [STORAGE_KEYS.CONNECTION_STATUS]: newStatus });
    
    // Notify background script
    chrome.runtime.sendMessage({
        type: 'TOGGLE_PROXY',
        enabled: newStatus === 'connected'
    });
    
    updateUI();
});

elements.retryBtn?.addEventListener('click', () => {
    checkStatus();
});

elements.refreshBtn?.addEventListener('click', () => {
    checkStatus();
});
