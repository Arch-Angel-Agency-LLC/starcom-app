# Decentralized Nostr MeshNet RelayNode Instruction Manual

Here's a detailed instruction manual for setting up and managing a Decentralized Nostr MeshNet RelayNode.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setting Up the Environment](#setting-up-the-environment)
   - [Node.js and npm](#nodejs-and-npm)
   - [Docker (Optional)](#docker-optional)
4. [Creating the RelayNode](#creating-the-relaynode)
   - [Project Initialization](#project-initialization)
   - [Installing Dependencies](#installing-dependencies)
5. [Configuring the RelayNode](#configuring-the-relaynode)
   - [Configuration File](#configuration-file)
6. [Implementing the RelayNode](#implementing-the-relaynode)
7. [Connecting Nodes in the MeshNet](#connecting-nodes-in-the-meshnet)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
   - [Health Checks](#health-checks)
   - [Logging](#logging)
9. [Security Considerations](#security-considerations)
10. [Best Practices](#best-practices)
11. [Further Reading and Resources](#further-reading-and-resources)

## Overview

This manual provides comprehensive instructions for setting up and managing a Decentralized Nostr MeshNet RelayNode. It covers the prerequisites, environment setup, creating and configuring the RelayNode, connecting nodes in the MeshNet, monitoring, maintenance, and best practices.

## Prerequisites

Ensure you have the following prerequisites installed on your system:

- Node.js and npm (https://nodejs.org/)
- Basic understanding of Nostr protocol and RelayNodes
- Docker (optional, but recommended for containerization)

## Setting Up the Environment

### Node.js and npm

1. **Install Node.js and npm**:
   ```sh
   sudo apt-get install nodejs npm
   ```

2. **Verify Installation**:
   ```sh
   node -v
   npm -v
   ```

### Docker (Optional)

1. **Install Docker**:
   ```sh
   sudo apt-get install docker.io
   ```

2. **Start Docker**:
   ```sh
   sudo systemctl start docker
   ```

3. **Enable Docker on Boot**:
   ```sh
   sudo systemctl enable docker
   ```

## Creating the RelayNode

### Project Initialization

1. **Create a new directory for the RelayNode**:
   ```sh
   mkdir nostr-relay
   cd nostr-relay
   ```

2. **Initialize a new Node.js project**:
   ```sh
   npm init -y
   ```

### Installing Dependencies

1. **Install necessary libraries and dependencies**:
   ```sh
   npm install nostr-tools sqlite3 express rate-limit
   ```

## Configuring the RelayNode

### Configuration File

1. **Create a configuration file (config.json)**:
   ```json
   {
     "port": 8008,
     "database": {
       "type": "sqlite",
       "filename": "data/nostr.db"
     },
     "rateLimit": {
       "windowMs": 60000,
       "max": 100
     },
     "relayInfo": {
       "name": "Nostr RelayNode",
       "description": "A decentralized Nostr RelayNode",
       "pubkey": "your-public-key-here"
     }
   }
   ```

## Implementing the RelayNode

1. **Create the main server file (server.js)**:
   ```js
   const http = require('http');
   const { relayInit } = require('nostr-tools');
   const sqlite3 = require('sqlite3');
   const express = require('express');
   const rateLimit = require('express-rate-limit');

   const app = express();
   const server = http.createServer(app);
   const port = 8008;

   // Rate limiting
   const limiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use(limiter);

   // Initialize SQLite database
   const db = new sqlite3.Database('./data/nostr.db', (err) => {
     if (err) {
       console.error('Could not connect to database', err);
     } else {
       console.log('Connected to database');
     }
   });

   // Initialize Nostr relay
   const relay = relayInit({
     database: db,
     relayInfo: {
       name: "Nostr RelayNode",
       description: "A decentralized Nostr RelayNode",
       pubkey: "your-public-key-here"
     }
   });

   app.use('/nostr', relay);

   server.listen(port, () => {
     console.log(`Nostr RelayNode running at http://localhost:${port}`);
   });
   ```

2. **Start the RelayNode**:
   ```sh
   node server.js
   ```

## Connecting Nodes in the MeshNet

1. **Initialize RelayNode Bots**: Use the Bot initialization instructions from earlier.
2. **Connect RelayNodes**: Configure each RelayNode to connect to multiple other nodes for redundancy and resilience.

### Example Connection Code

```js
const relay1 = relayInit('wss://relay1.example.com');
const relay2 = relayInit('wss://relay2.example.com');

relay1.connect();
relay2.connect();

relay1.on('connect', () => {
  console.log(`Connected to ${relay1.url}`);
});

relay2.on('connect', () => {
  console.log(`Connected to ${relay2.url}`);
});
```

## Monitoring and Maintenance

### Health Checks

- **Implement Health Checks**: Regularly check the status of each node.
- **Automate Health Checks**: Use tools like Prometheus to automate health checks.

### Logging

- **Set Up Logging**: Implement logging to monitor node activities.
- **Analyze Logs**: Regularly analyze logs for anomalies and performance issues.

### Example Prometheus Configuration

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'relaynodes'
    static_configs:
      - targets: ['localhost:8008']
```

### Example Grafana Dashboard

- Set up a Grafana dashboard to visualize metrics collected by Prometheus.

## Security Considerations

- **Encryption**: Use TLS to encrypt data transmitted between nodes.
- **Authentication**: Use JWT or OAuth for authenticating clients.
- **Access Control**: Implement role-based access control (RBAC) to restrict access to resources.

## Best Practices

- **Security**: Implement robust security measures, including encryption and authentication.
- **Scalability**: Design the MeshNet to scale horizontally by adding more nodes.
- **Redundancy**: Ensure redundancy to maintain network resilience in case of node failures.

## Further Reading and Resources

- [Nostr Protocol Documentation](https://github.com/fiatjaf/nostr)
- [nostr-tools Documentation](https://github.com/fiatjaf/nostr-tools)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/)

This detailed instruction manual provides a comprehensive guide for setting up and managing a Decentralized Nostr MeshNet RelayNode. It covers the prerequisites, environment setup, creating and configuring the RelayNode, connecting nodes in the MeshNet, monitoring, maintenance, security considerations, best practices, and additional resources for further reading. This should be useful for anyone looking to set up and manage a Nostr RelayNode in a decentralized network.
