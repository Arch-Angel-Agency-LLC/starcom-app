Here is a step-by-step instruction manual for creating an initial project that is a decentralized Nostr-based React application using TypeScript and nostr-tools.

# Initial Project Setup for Decentralized Nostr-based React Application

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setting Up the Environment](#setting-up-the-environment)
4. [Installing Nostr-tools](#installing-nostr-tools)
5. [Creating a Basic Nostr Client](#creating-a-basic-nostr-client)
6. [Summary](#summary)
7. [Further Reading and Resources](#further-reading-and-resources)

## Overview

This document provides instructions for setting up an initial project that is a decentralized Nostr-based React application using TypeScript and nostr-tools.

## Prerequisites

Ensure you have Node.js and npm installed on your system. You can download and install Node.js from [nodejs.org](https://nodejs.org/).

## Setting Up the Environment

1. **Create a new React application with TypeScript**:
   ```sh
   npx create-react-app nostr-app --template typescript
   cd nostr-app
   ```

2. **Install required libraries**:
   ```sh
   npm install nostr-tools
   ```

3. **Start the React application**:
   ```sh
   npm start
   ```

## Installing Nostr-tools

Install the nostr-tools library to handle Nostr protocol interactions.

```sh
npm install nostr-tools
```

## Creating a Basic Nostr Client

Create a basic Nostr client in your React application to connect to a Nostr relay and send/receive messages.

### App.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { relayInit, generatePrivateKey, getPublicKey, signEvent, Event } from 'nostr-tools';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Event[]>([]);
  const [relay, setRelay] = useState<any>(null);

  useEffect(() => {
    // Initialize the relay connection
    const relay = relayInit('wss://relay.example.com');
    relay.on('connect', () => {
      console.log(`Connected to ${relay.url}`);
    });
    relay.on('disconnect', () => {
      console.log(`Disconnected from ${relay.url}`);
    });
    relay.on('error', (err: any) => {
      console.log(`Error: ${err}`);
    });
    relay.on('event', (event: Event) => {
      setMessages((prevMessages) => [...prevMessages, event]);
    });

    setRelay(relay);
    relay.connect();

    return () => {
      relay.close();
    };
  }, []);

  const sendMessage = async (content: string) => {
    if (relay) {
      const sk = generatePrivateKey();
      const pk = getPublicKey(sk);
      const event: Event = {
        kind: 1,
        pubkey: pk,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content,
      };
      event.id = signEvent(event, sk);

      await relay.publish(event);
    }
  };

  return (
    <div>
      <h1>Nostr Client</h1>
      <div>
        <input type="text" id="messageInput" placeholder="Type a message" />
        <button onClick={() => {
          const input = document.getElementById('messageInput') as HTMLInputElement;
          sendMessage(input.value);
          input.value = '';
        }}>
          Send
        </button>
      </div>
      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg.content}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
```

## Summary

This guide provides a starting point for setting up a decentralized Nostr-based React application using TypeScript and nostr-tools. You can further expand this basic client to include more functionalities as needed.

## Further Reading and Resources

- [Nostr Protocol Documentation](https://github.com/fiatjaf/nostr)
- [nostr-tools Documentation](https://github.com/fiatjaf/nostr-tools)
- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)


You can save this content into a file named `Initial_Nostr_Project_Setup.md`.

Here is an expanded instruction manual that includes setting up a dynamic, horizontally stacked list of bots. Each bot is modular and can be in active, standby, or loading state. The bots run in a basic container that provides a dynamic API interface.

# Initial Project Setup for Decentralized Nostr-based React Application with Bots

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setting Up the Environment](#setting-up-the-environment)
4. [Installing Nostr-tools](#installing-nostr-tools)
5. [Creating a Basic Nostr Client](#creating-a-basic-nostr-client)
6. [Implementing Bots](#implementing-bots)
7. [Creating a Bot Container](#creating-a-bot-container)
8. [Summary](#summary)
9. [Further Reading and Resources](#further-reading-and-resources)

## Overview

This document provides instructions for setting up an initial project that is a decentralized Nostr-based React application using TypeScript and nostr-tools. It also includes a feature for managing bots in a horizontally stacked dynamic list. Each bot runs autonomously in a modular class object.

## Prerequisites

Ensure you have Node.js and npm installed on your system. You can download and install Node.js from [nodejs.org](https://nodejs.org/).

## Setting Up the Environment

1. **Create a new React application with TypeScript**:
   ```sh
   npx create-react-app nostr-app --template typescript
   cd nostr-app
   ```

2. **Install required libraries**:
   ```sh
   npm install nostr-tools
   ```

3. **Start the React application**:
   ```sh
   npm start
   ```

## Installing Nostr-tools

Install the nostr-tools library to handle Nostr protocol interactions.

```sh
npm install nostr-tools
```

## Creating a Basic Nostr Client

Create a basic Nostr client in your React application to connect to a Nostr relay and send/receive messages.

### App.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { relayInit, generatePrivateKey, getPublicKey, signEvent, Event } from 'nostr-tools';
import BotContainer from './BotContainer';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Event[]>([]);
  const [relay, setRelay] = useState<any>(null);

  useEffect(() => {
    // Initialize the relay connection
    const relay = relayInit('wss://relay.example.com');
    relay.on('connect', () => {
      console.log(`Connected to ${relay.url}`);
    });
    relay.on('disconnect', () => {
      console.log(`Disconnected from ${relay.url}`);
    });
    relay.on('error', (err: any) => {
      console.log(`Error: ${err}`);
    });
    relay.on('event', (event: Event) => {
      setMessages((prevMessages) => [...prevMessages, event]);
    });

    setRelay(relay);
    relay.connect();

    return () => {
      relay.close();
    };
  }, []);

  const sendMessage = async (content: string) => {
    if (relay) {
      const sk = generatePrivateKey();
      const pk = getPublicKey(sk);
      const event: Event = {
        kind: 1,
        pubkey: pk,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content,
      };
      event.id = signEvent(event, sk);

      await relay.publish(event);
    }
  };

  return (
    <div>
      <h1>Nostr Client</h1>
      <div>
        <input type="text" id="messageInput" placeholder="Type a message" />
        <button onClick={() => {
          const input = document.getElementById('messageInput') as HTMLInputElement;
          sendMessage(input.value);
          input.value = '';
        }}>
          Send
        </button>
      </div>
      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg.content}</li>
          ))}
        </ul>
      </div>
      <BotContainer />
    </div>
  );
};

export default App;
```

## Implementing Bots

Create a basic bot structure. Each bot is a modular class that runs autonomously.

### Bot.ts

```ts
export type BotState = 'active' | 'standby' | 'loading';

export class Bot {
  public state: BotState;
  public name: string;

  constructor(name: string, initialState: BotState = 'loading') {
    this.name = name;
    this.state = initialState;
  }

  // Example method to activate the bot
  public activate() {
    this.state = 'active';
  }

  // Example method to put the bot in standby
  public standby() {
    this.state = 'standby';
  }

  // Example method to load the bot
  public load() {
    this.state = 'loading';
  }

  // Method to simulate bot's work
  public doWork() {
    // Implement bot's autonomous actions here
    console.log(`${this.name} is doing work in ${this.state} state.`);
  }
}
```

## Creating a Bot Container

Create a React component to manage the bots and display their states in a horizontally stacked dynamic list.

### BotContainer.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { Bot, BotState } from './Bot';

const BotContainer: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);

  useEffect(() => {
    // Initialize bots
    const initialBots = [
      new Bot('Bot1', 'active'),
      new Bot('Bot2', 'standby'),
      new Bot('Bot3', 'loading'),
    ];
    setBots(initialBots);

    // Simulate bot work
    const interval = setInterval(() => {
      initialBots.forEach(bot => bot.doWork());
      setBots([...initialBots]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
      {bots.map((bot, index) => (
        <div key={index} style={{ border: '1px solid black', padding: '10px' }}>
          <h3>{bot.name}</h3>
          <p>Status: {bot.state}</p>
        </div>
      ))}
    </div>
  );
};

export default BotContainer;
```

## Summary

This guide provides a starting point for setting up a decentralized Nostr-based React application using TypeScript and nostr-tools. It also includes a feature for managing bots in a horizontally stacked dynamic list. Each bot runs autonomously in a modular class object.

## Further Reading and Resources

- [Nostr Protocol Documentation](https://github.com/fiatjaf/nostr)
- [nostr-tools Documentation](https://github.com/fiatjaf/nostr-tools)
- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
```

You can save this content into a file named `Initial_Nostr_Project_Setup_with_Bots.md`.
