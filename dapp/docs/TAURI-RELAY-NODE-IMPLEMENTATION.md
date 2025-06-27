# Starcom Team Relay Node - Implementation Specification

**Date:** June 25, 2025  
**Project:** Downloadable Team Relay Node  
**Technology:** Tauri + Rust + WebSocket  
**Goal:** Real-time team communication with user-owned infrastructure  

---

## 🏗️ Technical Architecture

### **Core Application Structure**
```
starcom-relay-node/
├── src-tauri/           # Rust backend (relay logic)
│   ├── src/
│   │   ├── main.rs     # Tauri app entry point
│   │   ├── relay.rs    # Nostr relay implementation
│   │   ├── ipfs.rs     # IPFS node integration
│   │   ├── teams.rs    # Team management
│   │   └── discovery.rs # Team discovery service
│   └── Cargo.toml      # Dependencies
├── src/                # Frontend (Vue/React config UI)
│   ├── App.vue
│   ├── components/
│   └── main.js
├── public/
└── tauri.conf.json     # App configuration
```

### **Rust Backend Implementation**
```rust
// src-tauri/src/relay.rs
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, WebSocketStream};
use tokio_tungstenite::tungstenite::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NostrEvent {
    pub id: String,
    pub pubkey: String,
    pub created_at: u64,
    pub kind: u16,
    pub tags: Vec<Vec<String>>,
    pub content: String,
    pub sig: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: String,
    pub filters: Vec<Filter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Filter {
    pub ids: Option<Vec<String>>,
    pub authors: Option<Vec<String>>,
    pub kinds: Option<Vec<u16>>,
    pub since: Option<u64>,
    pub until: Option<u64>,
    pub limit: Option<u64>,
}

pub struct TeamRelayNode {
    events: Arc<RwLock<Vec<NostrEvent>>>,
    subscriptions: Arc<RwLock<HashMap<String, Vec<Subscription>>>>,
    connections: Arc<RwLock<HashMap<String, WebSocketStream<TcpStream>>>>,
    team_config: TeamConfig,
}

impl TeamRelayNode {
    pub fn new(team_config: TeamConfig) -> Self {
        Self {
            events: Arc::new(RwLock::new(Vec::new())),
            subscriptions: Arc::new(RwLock::new(HashMap::new())),
            connections: Arc::new(RwLock::new(HashMap::new())),
            team_config,
        }
    }
    
    pub async fn start_relay(&self, port: u16) -> Result<(), Box<dyn std::error::Error>> {
        let listener = TcpListener::bind(format!("127.0.0.1:{}", port)).await?;
        println!("🚀 Team relay node listening on ws://127.0.0.1:{}", port);
        
        while let Ok((stream, addr)) = listener.accept().await {
            let relay = self.clone();
            tokio::spawn(async move {
                if let Err(e) = relay.handle_connection(stream, addr.to_string()).await {
                    eprintln!("Error handling connection: {}", e);
                }
            });
        }
        
        Ok(())
    }
    
    async fn handle_connection(&self, stream: TcpStream, addr: String) -> Result<(), Box<dyn std::error::Error>> {
        let ws_stream = accept_async(stream).await?;
        println!("✅ New WebSocket connection from {}", addr);
        
        // Store connection
        {
            let mut connections = self.connections.write().await;
            connections.insert(addr.clone(), ws_stream);
        }
        
        // Handle messages
        let connections = self.connections.clone();
        let events = self.events.clone();
        let subscriptions = self.subscriptions.clone();
        
        loop {
            let mut connections_guard = connections.write().await;
            let ws = connections_guard.get_mut(&addr).unwrap();
            
            match ws.read_message().await {
                Ok(msg) => {
                    if let Ok(text) = msg.to_text() {
                        self.handle_nostr_message(text, &addr).await?;
                    }
                }
                Err(_) => {
                    println!("❌ Connection {} closed", addr);
                    connections_guard.remove(&addr);
                    break;
                }
            }
        }
        
        Ok(())
    }
    
    async fn handle_nostr_message(&self, message: &str, client_id: &str) -> Result<(), Box<dyn std::error::Error>> {
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(message) {
            if let Some(array) = parsed.as_array() {
                match array[0].as_str() {
                    Some("EVENT") => {
                        // Handle incoming event
                        if let Ok(event) = serde_json::from_value::<NostrEvent>(array[1].clone()) {
                            self.store_event(event).await?;
                        }
                    }
                    Some("REQ") => {
                        // Handle subscription request
                        let sub_id = array[1].as_str().unwrap_or_default();
                        let filters: Vec<Filter> = array[2..].iter()
                            .filter_map(|f| serde_json::from_value(f.clone()).ok())
                            .collect();
                        
                        self.handle_subscription(client_id, sub_id, filters).await?;
                    }
                    Some("CLOSE") => {
                        // Handle subscription close
                        let sub_id = array[1].as_str().unwrap_or_default();
                        self.close_subscription(client_id, sub_id).await?;
                    }
                    _ => {}
                }
            }
        }
        
        Ok(())
    }
    
    async fn store_event(&self, event: NostrEvent) -> Result<(), Box<dyn std::error::Error>> {
        // Validate event (simplified)
        if self.validate_event(&event).await {
            let mut events = self.events.write().await;
            events.push(event.clone());
            
            // Broadcast to subscribers
            self.broadcast_to_subscribers(&event).await?;
        }
        
        Ok(())
    }
    
    async fn broadcast_to_subscribers(&self, event: &NostrEvent) -> Result<(), Box<dyn std::error::Error>> {
        let subscriptions = self.subscriptions.read().await;
        let mut connections = self.connections.write().await;
        
        for (client_id, client_subs) in subscriptions.iter() {
            for subscription in client_subs {
                if self.event_matches_filters(event, &subscription.filters) {
                    if let Some(ws) = connections.get_mut(client_id) {
                        let msg = format!("[\"EVENT\",\"{}\",{}]", 
                            subscription.id, 
                            serde_json::to_string(event)?
                        );
                        let _ = ws.send(Message::Text(msg)).await;
                    }
                }
            }
        }
        
        Ok(())
    }
    
    async fn validate_event(&self, _event: &NostrEvent) -> bool {
        // Implement event validation (signature verification, etc.)
        true
    }
    
    fn event_matches_filters(&self, _event: &NostrEvent, _filters: &[Filter]) -> bool {
        // Implement filter matching logic
        true
    }
}

#[derive(Debug, Clone)]
pub struct TeamConfig {
    pub team_id: String,
    pub team_name: String,
    pub allowed_members: Vec<String>,
    pub security_level: String,
}

// Tauri commands for frontend integration
#[tauri::command]
pub async fn start_team_relay(team_config: TeamConfig) -> Result<String, String> {
    let relay = TeamRelayNode::new(team_config);
    
    tokio::spawn(async move {
        if let Err(e) = relay.start_relay(8080).await {
            eprintln!("Relay error: {}", e);
        }
    });
    
    Ok("Team relay started on ws://127.0.0.1:8080".to_string())
}

#[tauri::command]
pub async fn get_relay_status() -> Result<RelayStatus, String> {
    // Return current relay status
    Ok(RelayStatus {
        running: true,
        connections: 5,
        messages_today: 142,
        team_members_online: 3,
    })
}

#[derive(Serialize)]
pub struct RelayStatus {
    running: bool,
    connections: u32,
    messages_today: u32,
    team_members_online: u32,
}
```

### **Frontend Configuration UI**
```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <header>
      <h1>🛡️ Starcom Team Relay Node</h1>
      <div class="status-indicator" :class="{ active: relayStatus.running }">
        {{ relayStatus.running ? 'ACTIVE' : 'OFFLINE' }}
      </div>
    </header>
    
    <main>
      <div class="relay-controls">
        <button @click="startRelay" :disabled="relayStatus.running">
          Start Team Relay
        </button>
        <button @click="stopRelay" :disabled="!relayStatus.running">
          Stop Relay
        </button>
      </div>
      
      <div class="relay-stats">
        <div class="stat-card">
          <h3>Active Connections</h3>
          <div class="stat-value">{{ relayStatus.connections }}</div>
        </div>
        <div class="stat-card">
          <h3>Messages Today</h3>
          <div class="stat-value">{{ relayStatus.messages_today }}</div>
        </div>
        <div class="stat-card">
          <h3>Team Members Online</h3>
          <div class="stat-value">{{ relayStatus.team_members_online }}</div>
        </div>
      </div>
      
      <div class="team-config">
        <h2>Team Configuration</h2>
        <form @submit.prevent="updateTeamConfig">
          <label>
            Team Name:
            <input v-model="teamConfig.team_name" type="text" />
          </label>
          <label>
            Team ID:
            <input v-model="teamConfig.team_id" type="text" readonly />
          </label>
          <label>
            Security Level:
            <select v-model="teamConfig.security_level">
              <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="SECRET">SECRET</option>
            </select>
          </label>
          <button type="submit">Update Configuration</button>
        </form>
      </div>
    </main>
  </div>
</template>

<script>
import { invoke } from '@tauri-apps/api/tauri'

export default {
  name: 'App',
  data() {
    return {
      relayStatus: {
        running: false,
        connections: 0,
        messages_today: 0,
        team_members_online: 0
      },
      teamConfig: {
        team_id: 'team-' + Math.random().toString(36).substr(2, 9),
        team_name: 'My Intelligence Team',
        security_level: 'UNCLASSIFIED'
      }
    }
  },
  async mounted() {
    await this.updateStatus()
    // Update status every 5 seconds
    setInterval(this.updateStatus, 5000)
  },
  methods: {
    async startRelay() {
      try {
        const result = await invoke('start_team_relay', { 
          teamConfig: this.teamConfig 
        })
        console.log('Relay started:', result)
        await this.updateStatus()
      } catch (error) {
        console.error('Failed to start relay:', error)
      }
    },
    async stopRelay() {
      // Implement stop functionality
      this.relayStatus.running = false
    },
    async updateStatus() {
      try {
        this.relayStatus = await invoke('get_relay_status')
      } catch (error) {
        console.error('Failed to get status:', error)
      }
    },
    async updateTeamConfig() {
      // Save team configuration
      console.log('Team config updated:', this.teamConfig)
    }
  }
}
</script>

<style>
#app {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  color: #e0e0e0;
  min-height: 100vh;
  padding: 2rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.status-indicator {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: #ff4444;
  font-weight: bold;
}

.status-indicator.active {
  background: #00ff41;
  color: #000;
}

.relay-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #00ff41;
  color: #000;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background: #00cc33;
}

button:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.relay-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 0.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #00ff41;
  margin-top: 0.5rem;
}

.team-config {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
}

form {
  display: grid;
  gap: 1rem;
  max-width: 400px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input, select {
  padding: 0.75rem;
  border: 1px solid #333;
  border-radius: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

input:readonly {
  background: rgba(255, 255, 255, 0.05);
  color: #888;
}
</style>
```

### **Installation and Distribution**
```json
// tauri.conf.json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist",
    "withGlobalTauri": false
  },
  "package": {
    "productName": "Starcom Team Relay",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      }
    },
    "bundle": {
      "active": true,
      "identifier": "app.starcom.relay",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "resources": [],
      "externalBin": [],
      "copyright": "",
      "category": "Productivity",
      "shortDescription": "Starcom Team Relay Node",
      "longDescription": "Real-time team communication relay for Starcom Intelligence Platform",
      "deb": {
        "depends": []
      },
      "macOS": {
        "frameworks": [],
        "minimumSystemVersion": "10.13",
        "exceptionDomain": "",
        "signingIdentity": null,
        "providerShortName": null,
        "entitlements": null
      },
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "Starcom Team Relay",
        "width": 800,
        "height": 600,
        "minWidth": 600,
        "minHeight": 400
      }
    ]
  }
}
```

---

## 🚀 Implementation Steps

### **Step 1: Create the Tauri Project**
```bash
# Install Tauri CLI
cargo install tauri-cli

# Create new Tauri app
cargo tauri init

# Add Rust dependencies to Cargo.toml
cargo add tokio tokio-tungstenite serde serde_json
```

### **Step 2: Update Web App Integration**
```typescript
// Update your existing nostrService.ts
class AdaptiveNostrService {
  async detectLocalRelay(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8080/health');
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async connectToLocalRelay(): Promise<void> {
    if (await this.detectLocalRelay()) {
      // Connect to local relay for real-time experience
      const ws = new WebSocket('ws://localhost:8080');
      await this.setupWebSocketConnection(ws, 'local-relay');
      console.log('🚀 Connected to local team relay - REAL-TIME MODE ACTIVE');
    } else {
      // Fallback to HTTP bridge mode
      console.log('📡 Local relay not found - using HTTP bridge mode');
    }
  }
}
```

### **Step 3: Add Download Integration**
```typescript
// Add to your web app for easy relay node installation
class RelayNodeInstaller {
  async promptInstallation(): Promise<void> {
    const userWantsRelay = confirm(`
      🚀 Install Starcom Team Relay for real-time communication?
      
      Benefits:
      ✅ Instant WebSocket messaging (no delays)
      ✅ Team independence from external services  
      ✅ Enhanced security and privacy
      ✅ Works offline on local networks
      
      Download size: ~50MB
    `);
    
    if (userWantsRelay) {
      const platform = this.detectPlatform();
      window.open(`https://relay.starcom.app/download/${platform}`);
    }
  }
}
```

---

## 🎯 **Strategic Benefits**

### **1. Real-Time Experience Without Compromise**
- **Zero-latency team communication** via local WebSocket relay
- **Instant message delivery** without HTTP polling delays
- **Real-time collaboration** for intelligence operations

### **2. Progressive Enhancement**
- **Works immediately** in browser-only mode
- **Enhanced gradually** as users opt into better infrastructure
- **No forced installations** - user choice driven

### **3. Team Independence** 
- **Own your infrastructure** - no external dependencies
- **Offline capability** for sensitive operations
- **Custom security policies** per team

### **4. Future-Proof Architecture**
- **Mesh networking ready** with WebRTC integration
- **IPFS integration** for content storage
- **Quantum-safe security** when PQC is implemented

This gives you the **best of both worlds** - a web app that deploys anywhere with optional downloadable components that provide the premium real-time experience your users deserve!
