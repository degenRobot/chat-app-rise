# RISE Chat App

A real-time decentralized chat application built on RISE with topic-based messaging, user karma system, and instant transaction confirmations.

Built using [RISE Vibe Kit](https://github.com/risechain/rise-vibe-kit/) - the full-stack template for building real-time dApps on RISE.

<img src="image.jpg">

## Features

**Topic-Based Messaging** - Create and filter messages by topics  
**Karma System** - Like/dislike messages to build user reputation  
**Instant Transactions** - Synchronous transaction receipts with `eth_sendRawTransactionSync`  
**Real-time Updates** - WebSocket subscriptions via `rise_subscribe` for live messaging  
**Embedded Wallets** - Browser-based wallets with the Shreds library  
**Modern UI** - Built with Next.js 15, TypeScript, and Tailwind CSS

## Quick Start

```bash
# Install dependencies
npm install

# Deploy contracts
npm run deploy-and-sync

# Start the frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the chat app.

## How It Works

### Smart Contract Features

The `ChatApp` contract (`contracts/src/ChatApp.sol`) includes:

- **User Registration**: Register with a unique username
- **Topic Management**: Create topics for organized conversations
- **Message Sending**: Send messages to the general chat or specific topics
- **Karma System**: Like/dislike messages to affect user reputation
- **Upgradeable**: Uses UUPS proxy pattern for future upgrades

### Frontend Features

- **Real-time Messaging**: Messages appear instantly via WebSocket subscriptions
- **Topic Filtering**: View all messages or filter by specific topics
- **Karma Feed**: See reputation changes in real-time
- **Responsive Design**: Works seamlessly on desktop and mobile

## Project Structure

```
test-chat-app/
├── contracts/                 # Foundry smart contracts
│   ├── src/
│   │   └── ChatApp.sol       # Main chat contract
│   ├── script/
│   │   └── DeployChatAppProxy.s.sol  # Deployment script
│   └── test/
│       └── ChatAppProxy.t.sol        # Contract tests
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/              # App routes
│   │   ├── components/       # React components
│   │   │   └── chat/         # Chat-specific components
│   │   ├── contracts/        # Auto-generated ABIs
│   │   ├── hooks/            # Custom React hooks
│   │   └── providers/        # WebSocket provider
│   └── public/               # Static assets
└── scripts/                   # Build and deployment tools
```

## Core Commands

```bash
npm run dev              # Start frontend development server
npm run deploy-and-sync  # Deploy contracts & sync to frontend
npm run build            # Build for production
npm run test             # Run contract tests
```

## Environment Setup

Create a `.env` file in the root directory:

```env
# Private key for contract deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here
```

## Contract Functions

### User Management
- `registerUser(string userId)` - Register a new user
- `updateUserId(string userId)` - Update your username

### Messaging
- `sendMessage(string message)` - Send to general chat (topic 0)
- `sendMessageToTopic(string message, uint256 topicId)` - Send to specific topic
- `createTopic(string topic)` - Create a new topic

### Karma System
- `likeMessage(uint256 msgId)` - Like a message (+1 karma to sender)
- `dislikeMessage(uint256 msgId)` - Dislike a message (-1 karma to sender)

## Technologies Used

- **Smart Contracts**: Solidity, Foundry, OpenZeppelin
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Blockchain Interaction**: Wagmi v2, Viem
- **Real-time**: RISE WebSocket subscriptions
- **Wallet**: MetaMask & Embedded Wallets (Shreds)

## Resources

- [RISE Documentation](https://docs.risechain.com)
- [RISE Vibe Kit](https://github.com/risechain/rise-vibe-kit/)
- [Discord Community](https://discord.gg/risechain)

## License

MIT