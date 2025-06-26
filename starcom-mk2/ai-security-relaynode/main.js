// Tauri API imports
const { invoke } = window.__TAURI__.tauri;

// Global state
let servicesRunning = false;

// Utility functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Service control functions
async function startServices() {
    if (servicesRunning) {
        showNotification('Services are already running', 'info');
        return;
    }

    showLoading();
    try {
        await invoke('start_services');
        servicesRunning = true;
        showNotification('Services started successfully!', 'success');
        
        // Start periodic status updates
        startStatusUpdates();
    } catch (error) {
        console.error('Failed to start services:', error);
        showNotification(`Failed to start services: ${error}`, 'error');
    } finally {
        hideLoading();
    }
}

async function stopServices() {
    if (!servicesRunning) {
        showNotification('Services are not running', 'info');
        return;
    }

    showLoading();
    try {
        await invoke('stop_services');
        servicesRunning = false;
        showNotification('Services stopped successfully!', 'success');
        
        // Stop status updates and reset UI
        stopStatusUpdates();
        resetStatusUI();
    } catch (error) {
        console.error('Failed to stop services:', error);
        showNotification(`Failed to stop services: ${error}`, 'error');
    } finally {
        hideLoading();
    }
}

async function refreshStatus() {
    try {
        const status = await invoke('get_service_status');
        updateStatusUI(status);
    } catch (error) {
        console.error('Failed to get service status:', error);
        showNotification(`Failed to refresh status: ${error}`, 'error');
    }
}

// Configuration functions
async function saveConfiguration() {
    const teamName = document.getElementById('teamName').value;
    
    if (!teamName.trim()) {
        showNotification('Please enter a team name', 'error');
        return;
    }

    showLoading();
    try {
        await invoke('save_configuration', {
            config: {
                team_name: teamName,
                team_key: null,
                relay_url: null
            }
        });
        showNotification('Configuration saved successfully!', 'success');
    } catch (error) {
        console.error('Failed to save configuration:', error);
        showNotification(`Failed to save configuration: ${error}`, 'error');
    } finally {
        hideLoading();
    }
}

async function loadConfiguration() {
    showLoading();
    try {
        const config = await invoke('load_configuration');
        
        // Update UI with loaded configuration
        if (config.team_name) {
            document.getElementById('teamName').value = config.team_name;
        }
        if (config.relay_url) {
            document.getElementById('relayUrl').value = config.relay_url;
        }
        
        showNotification('Configuration loaded successfully!', 'success');
    } catch (error) {
        console.error('Failed to load configuration:', error);
        showNotification(`Failed to load configuration: ${error}`, 'error');
    } finally {
        hideLoading();
    }
}

// Status update functions
let statusUpdateInterval;

function startStatusUpdates() {
    // Update immediately
    refreshStatus();
    
    // Then update every 5 seconds
    statusUpdateInterval = setInterval(refreshStatus, 5000);
}

function stopStatusUpdates() {
    if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        statusUpdateInterval = null;
    }
}

function updateStatusUI(status) {
    // Update Nostr relay status
    const nostrStatus = status.nostr;
    if (nostrStatus) {
        const statusIndicator = document.getElementById('nostrStatus');
        const statusText = document.getElementById('nostrStatusText');
        const connections = document.getElementById('nostrConnections');
        const events = document.getElementById('nostrEvents');

        statusIndicator.className = `status-indicator ${getStatusClass(nostrStatus.status)}`;
        statusText.textContent = nostrStatus.status;
        connections.textContent = nostrStatus.connections || 0;
        events.textContent = nostrStatus.events || 0;
    }

    // Update IPFS node status
    const ipfsStatus = status.ipfs;
    if (ipfsStatus) {
        const statusIndicator = document.getElementById('ipfsStatus');
        const statusText = document.getElementById('ipfsStatusText');
        const peers = document.getElementById('ipfsPeers');
        const storage = document.getElementById('ipfsStorage');
        const peerId = document.getElementById('ipfsPeerId');

        statusIndicator.className = `status-indicator ${getStatusClass(ipfsStatus.status)}`;
        statusText.textContent = ipfsStatus.status;
        peers.textContent = ipfsStatus.peers || 0;
        storage.textContent = `${ipfsStatus.storage || 0} MB`;
        peerId.textContent = ipfsStatus.peerId || 'Not Available';
    }
}

function resetStatusUI() {
    // Reset Nostr status
    document.getElementById('nostrStatus').className = 'status-indicator status-offline';
    document.getElementById('nostrStatusText').textContent = 'Offline';
    document.getElementById('nostrConnections').textContent = '0';
    document.getElementById('nostrEvents').textContent = '0';

    // Reset IPFS status
    document.getElementById('ipfsStatus').className = 'status-indicator status-offline';
    document.getElementById('ipfsStatusText').textContent = 'Offline';
    document.getElementById('ipfsPeers').textContent = '0';
    document.getElementById('ipfsStorage').textContent = '0 MB';
    document.getElementById('ipfsPeerId').textContent = 'Not Available';
}

function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'online':
        case 'running':
        case 'active':
            return 'status-online';
        case 'starting':
        case 'pending':
            return 'status-pending';
        default:
            return 'status-offline';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('AI Security RelayNode Frontend Initialized');
    
    // Load configuration on startup
    try {
        await loadConfiguration();
    } catch (error) {
        console.log('No configuration found, using defaults');
    }
    
    // Initial status check
    await refreshStatus();
    
    showNotification('AI Security RelayNode ready!', 'success');
});

// Handle window close event
window.addEventListener('beforeunload', async () => {
    if (servicesRunning) {
        try {
            await invoke('stop_services');
        } catch (error) {
            console.error('Failed to stop services on exit:', error);
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                if (event.shiftKey) {
                    stopServices();
                } else {
                    startServices();
                }
                break;
            case 'r':
                event.preventDefault();
                refreshStatus();
                break;
        }
    }
});
