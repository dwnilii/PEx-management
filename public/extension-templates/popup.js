document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const views = {
        register: document.getElementById('register-view'),
        pending: document.getElementById('pending-view'),
        connected: document.getElementById('connected-view'),
        error: document.getElementById('error-view'),
    };
    const header = {
        logo: document.getElementById('header-logo'),
        name: document.getElementById('header-name'),
    };
    const footer = {
        element: document.getElementById('footer'),
        lastSync: document.querySelector('#footer span'),
        refreshButton: document.getElementById('refresh-button'),
        refreshSpinner: document.getElementById('refresh-spinner'),
    };
    const register = {
        nameInput: document.getElementById('register-name-input'),
        userIdDisplay: document.getElementById('register-user-id'),
        registerButton: document.getElementById('register-button'),
    };
    const connected = {
        powerButton: document.getElementById('power-button'),
        statusText: document.getElementById('connection-status-text'),
        userName: document.getElementById('connected-user-name'),
        userOu: document.getElementById('connected-user-ou'),
        userId: document.getElementById('connected-user-id'),
    };
    const error = {
        addressInput: document.getElementById('error-panel-address'),
        retryButton: document.getElementById('error-retry-button'),
    };

    // --- State ---
    let state = {
        userId: null,
        userName: null,
        panelAddress: null,
        status: 'unknown', // unknown, register, pending, connected, error
        ou: null,
        proxyConfig: {},
        lastSync: null,
        isConnected: true, // For the power button toggle
    };

    // --- Functions ---
    
    // Switch between different UI views
    const showView = (viewName) => {
        Object.values(views).forEach(view => view.style.display = 'none');
        if (views[viewName]) {
            views[viewName].style.display = 'flex';
        }
        // Show/hide footer based on view
        footer.element.style.display = (viewName === 'connected' || viewName === 'error') ? 'flex' : 'none';
    };

    // Generate a unique ID for new users
    const generateUserId = (prefix, length) => {
        const randomPart = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
        return `${prefix}${randomPart}`;
    };

    // Update UI elements with current state
    const updateUI = () => {
        // Update header from settings
        chrome.storage.local.get(['extensionName', 'companyLogo'], (result) => {
            if (result.extensionName) {
                header.name.textContent = result.extensionName;
            }
            if (result.companyLogo) {
                header.logo.src = result.companyLogo;
            }
        });
        
        switch (state.status) {
            case 'register':
                showView('register');
                if (!state.userId) {
                    chrome.storage.local.get(['idPrefix', 'idDigits'], (settings) => {
                       state.userId = generateUserId(settings.idPrefix || 'USR-EXP-', settings.idDigits || 4);
                       chrome.storage.local.set({ userId: state.userId });
                       register.userIdDisplay.textContent = state.userId;
                    });
                } else {
                    register.userIdDisplay.textContent = state.userId;
                }
                break;
            case 'pending':
                showView('pending');
                break;
            case 'connected':
                showView('connected');
                connected.userName.textContent = state.userName || 'N/A';
                connected.userOu.textContent = state.ou || 'N/A';
                connected.userId.textContent = state.userId || 'N/A';
                updatePowerButton();
                break;
            case 'error':
                showView('error');
                error.addressInput.value = state.panelAddress || '';
                break;
            default:
                showView('pending'); // Default to a loading-like state
                break;
        }

        // Update footer
        if (state.lastSync) {
            const minutesAgo = Math.round((new Date() - new Date(state.lastSync)) / 60000);
            footer.lastSync.textContent = `Last sync: ${minutesAgo} min ago`;
        } else {
            footer.lastSync.textContent = 'Last sync: never';
        }
    };
    
    const updatePowerButton = () => {
        if(state.isConnected) {
            connected.powerButton.className = 'power-button-connected';
            connected.statusText.textContent = 'Connected';
        } else {
            connected.powerButton.className = 'power-button-disconnected';
            connected.statusText.textContent = 'Disconnected';
        }
    };

    // Fetches config from the panel and updates state
    const checkStatus = async (showSpinner = false) => {
        if (showSpinner) footer.refreshSpinner.classList.add('spinner');
        try {
            const response = await fetch(`${state.panelAddress}/api/extension/config?userId=${state.userId}`);
            
            const data = await response.json();

            if (response.ok) {
                state.status = 'connected';
                state.userName = data.user.name;
                state.ou = data.user.ou;
                state.proxyConfig = data; // Store the whole config
                state.lastSync = new Date().toISOString();
                
                // Save important info to storage
                chrome.storage.local.set({ 
                    status: 'connected', 
                    userName: data.user.name, 
                    ou: data.user.ou,
                    lastSync: state.lastSync 
                });

                // Send config to background script
                chrome.runtime.sendMessage({ type: "SET_CONFIG", config: data });

            } else if (response.status === 403) { // Pending approval
                state.status = 'pending';
                chrome.storage.local.set({ status: 'pending' });
            } else if (response.status === 404) { // User not found
                state.status = 'register';
                chrome.storage.local.set({ status: 'register' });
            } else { // Other server-side errors
                throw new Error(data.error || `Server responded with status ${response.status}`);
            }
        } catch (err) {
            console.error('Check status failed:', err);
            state.status = 'error';
            // Do not update storage on error, so we can retry with old settings
        } finally {
            if (showSpinner) footer.refreshSpinner.classList.remove('spinner');
            updateUI();
        }
    };

    // Registers the user with the panel
    const registerUser = async () => {
        const userName = register.nameInput.value;
        if (!userName) {
            alert('Please enter your name.');
            return;
        }

        register.registerButton.disabled = true;
        register.registerButton.textContent = 'Registering...';

        try {
            const response = await fetch(`${state.panelAddress}/api/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: state.userId, userName: userName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // If user/request already exists, just move to pending
                if (response.status === 409) {
                     console.log('User/request already exists, moving to pending.');
                } else {
                    throw new Error(errorData.error || 'Failed to register.');
                }
            }
            
            // On successful registration or conflict, move to pending
            state.status = 'pending';
            state.userName = userName;
            chrome.storage.local.set({ status: 'pending', userName: userName });

        } catch (err) {
            console.error('Registration failed:', err);
            state.status = 'error'; // Go to error view on failure
        } finally {
            register.registerButton.disabled = false;
            register.registerButton.textContent = 'Register';
            updateUI();
        }
    };
    
    const handlePowerToggle = () => {
        state.isConnected = !state.isConnected;
        updatePowerButton();
        if (state.isConnected) {
            // Re-apply the original config
            chrome.runtime.sendMessage({ type: "SET_CONFIG", config: state.proxyConfig });
        } else {
            // Clear the proxy
            chrome.runtime.sendMessage({ type: "CLEAR_PROXY" });
        }
    }


    // --- Event Listeners ---
    register.registerButton.addEventListener('click', registerUser);
    footer.refreshButton.addEventListener('click', () => checkStatus(true));
    connected.powerButton.addEventListener('click', handlePowerToggle);

    error.retryButton.addEventListener('click', () => {
        const newAddress = error.addressInput.value.trim();
        if (newAddress) {
            state.panelAddress = newAddress;
            chrome.storage.local.set({ panelAddress: newAddress }, () => {
                checkStatus(true); // Retry connection with new address
            });
        }
    });

    // --- Initialization ---
    const init = () => {
        // Get all necessary data from storage
        chrome.storage.local.get(['userId', 'userName', 'panelAddress', 'status', 'ou', 'lastSync'], (result) => {
            state.userId = result.userId || null;
            state.userName = result.userName || null;
            state.panelAddress = result.panelAddress || null;
            state.status = result.status || 'register'; // Default to register if no status
            state.ou = result.ou || null;
            state.lastSync = result.lastSync || null;

            // If panel address isn't set, we can't do anything, go to error view
            if (!state.panelAddress) {
                state.status = 'error';
                updateUI();
                return;
            }
            
            // If we have a user ID, check their status
            if (state.userId) {
                checkStatus();
            } else {
                 // Otherwise, go to register view
                state.status = 'register';
                updateUI();
            }
        });
    };

    init();
});

    