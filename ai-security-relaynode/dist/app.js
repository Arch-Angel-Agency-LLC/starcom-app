// Tauri API imports
const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;

// Application state
let serviceStatus = {
    nostr: { status: 'offline', connections: 0, events: 0 },
    ipfs: { status: 'offline', peers: 0, storage: 0, peerId: 'Generating...' }
};

// DOM elements
const elements = {
    nostrStatus: document.getElementById('nostr-status'),
    nostrStatusText: document.getElementById('nostr-status-text'),
    nostrConnections: document.getElementById('nostr-connections'),
    nostrEvents: document.getElementById('nostr-events'),
    
    ipfsStatus: document.getElementById('ipfs-status'),
    ipfsStatusText: document.getElementById('ipfs-status-text'),
    ipfsPeerId: document.getElementById('ipfs-peer-id'),
    ipfsPeers: document.getElementById('ipfs-peers'),
    ipfsStorage: document.getElementById('ipfs-storage'),
    
    logsContainer: document.getElementById('logs-container'),
    
    startServicesBtn: document.getElementById('start-services'),
    stopServicesBtn: document.getElementById('stop-services'),
    saveConfigBtn: document.getElementById('save-config'),
    viewLogsBtn: document.getElementById('view-logs'),
    
    teamName: document.getElementById('team-name'),
    teamKey: document.getElementById('team-key'),
    relayUrl: document.getElementById('relay-url')
};

// Initialize the application
async function initApp() {
    addLog('info', 'AI Security RelayNode UI initialized');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial configuration
    await loadConfiguration();
    
    // Start polling for service status
    startStatusPolling();
    
    addLog('info', 'Ready for service management');
}

// Set up event listeners
function setupEventListeners() {
    elements.startServicesBtn.addEventListener('click', startServices);
    elements.stopServicesBtn.addEventListener('click', stopServices);
    elements.saveConfigBtn.addEventListener('click', saveConfiguration);
    elements.viewLogsBtn.addEventListener('click', toggleLogs);
    
    // Listen for backend events
    listen('service-status-update', (event) => {
        updateServiceStatus(event.payload);
    });
    
    listen('log-message', (event) => {
        addLog(event.payload.level, event.payload.message);
    });
}

// Start services
async function startServices() {
    try {
        addLog('info', 'Starting services...');
        elements.startServicesBtn.disabled = true;
        elements.startServicesBtn.textContent = 'Starting...';
        
        // Update status to starting
        updateStatusIndicator('nostr', 'starting');
        updateStatusIndicator('ipfs', 'starting');
        
        await invoke('start_services');
        
        addLog('info', 'Services started successfully');
        elements.startServicesBtn.textContent = 'Start Services';
    } catch (error) {
        addLog('error', `Failed to start services: ${error}`);
        elements.startServicesBtn.textContent = 'Start Services';
        updateStatusIndicator('nostr', 'offline');
        updateStatusIndicator('ipfs', 'offline');
    } finally {
        elements.startServicesBtn.disabled = false;
    }
}

// Stop services
async function stopServices() {
    try {
        addLog('info', 'Stopping services...');
        elements.stopServicesBtn.disabled = true;
        elements.stopServicesBtn.textContent = 'Stopping...';
        
        await invoke('stop_services');
        
        // Update status to offline
        updateStatusIndicator('nostr', 'offline');
        updateStatusIndicator('ipfs', 'offline');
        
        // Reset metrics
        serviceStatus.nostr = { status: 'offline', connections: 0, events: 0 };
        serviceStatus.ipfs = { status: 'offline', peers: 0, storage: 0, peerId: 'Offline' };
        updateUI();
        
        addLog('info', 'Services stopped successfully');
        elements.stopServicesBtn.textContent = 'Stop Services';
    } catch (error) {
        addLog('error', `Failed to stop services: ${error}`);
        elements.stopServicesBtn.textContent = 'Stop Services';
    } finally {
        elements.stopServicesBtn.disabled = false;
    }
}

// Save configuration
async function saveConfiguration() {
    try {
        const config = {
            team_name: elements.teamName.value,
            team_key: elements.teamKey.value,
            relay_url: elements.relayUrl.value
        };
        
        await invoke('save_configuration', { config });
        addLog('info', 'Configuration saved successfully');
    } catch (error) {
        addLog('error', `Failed to save configuration: ${error}`);
    }
}

// Load configuration
async function loadConfiguration() {
    try {
        const config = await invoke('load_configuration');
        
        if (config.team_name) elements.teamName.value = config.team_name;
        if (config.team_key) elements.teamKey.value = config.team_key;
        if (config.relay_url) elements.relayUrl.value = config.relay_url;
        
        addLog('info', 'Configuration loaded');
    } catch (error) {
        addLog('warning', 'Using default configuration');
    }
}

// Update service status
function updateServiceStatus(status) {
    if (status.service === 'nostr') {
        serviceStatus.nostr = status;
        updateStatusIndicator('nostr', status.status);
    } else if (status.service === 'ipfs') {
        serviceStatus.ipfs = status;
        updateStatusIndicator('ipfs', status.status);
    }
    
    updateUI();
}

// Update status indicator
function updateStatusIndicator(service, status) {
    const indicator = elements[`${service}Status`];
    const statusText = elements[`${service}StatusText`];
    
    // Remove all status classes
    indicator.classList.remove('online', 'offline', 'starting');
    
    // Add appropriate class
    indicator.classList.add(status);
    
    // Update status text
    const statusMap = {
        online: 'Online',
        offline: 'Offline',
        starting: 'Starting...'
    };
    
    statusText.textContent = statusMap[status] || status;
}

// Update UI with current service status
function updateUI() {
    // Update Nostr metrics
    elements.nostrConnections.textContent = serviceStatus.nostr.connections || 0;
    elements.nostrEvents.textContent = serviceStatus.nostr.events || 0;
    
    // Update IPFS metrics
    elements.ipfsPeerId.textContent = serviceStatus.ipfs.peerId || 'Offline';
    elements.ipfsPeers.textContent = serviceStatus.ipfs.peers || 0;
    elements.ipfsStorage.textContent = `${serviceStatus.ipfs.storage || 0} MB`;
}

// Start polling for service status
function startStatusPolling() {
    // Poll every 2 seconds
    setInterval(async () => {
        try {
            const status = await invoke('get_service_status');
            if (status.nostr) updateServiceStatus({ service: 'nostr', ...status.nostr });
            if (status.ipfs) updateServiceStatus({ service: 'ipfs', ...status.ipfs });
        } catch (error) {
            // Silently handle polling errors
        }
    }, 2000);
}

// Add log entry
function addLog(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${level}`;
    logEntry.textContent = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    elements.logsContainer.appendChild(logEntry);
    elements.logsContainer.scrollTop = elements.logsContainer.scrollHeight;
    
    // Keep only last 100 log entries
    const entries = elements.logsContainer.children;
    if (entries.length > 100) {
        elements.logsContainer.removeChild(entries[0]);
    }
}

// Toggle logs visibility
function toggleLogs() {
    const logsContainer = elements.logsContainer;
    if (logsContainer.style.display === 'none') {
        logsContainer.style.display = 'block';
        elements.viewLogsBtn.textContent = 'Hide Logs';
    } else {
        logsContainer.style.display = 'none';
        elements.viewLogsBtn.textContent = 'View Logs';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Add some demo data for testing
setTimeout(() => {
    updateServiceStatus({
        service: 'nostr',
        status: 'online',
        connections: 3,
        events: 47
    });
    
    updateServiceStatus({
        service: 'ipfs',
        status: 'online',
        peers: 12,
        storage: 256,
        peerId: '12D3KooWABC123...'
    });
}, 3000);
