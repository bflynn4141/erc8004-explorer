# ERC-8004 Agent Registry Explorer

A real-time explorer for [ERC-8004 (Trustless Agents)](https://eips.ethereum.org/EIPS/eip-8004) - an Ethereum standard for on-chain AI agent identity and reputation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## What is ERC-8004?

ERC-8004 defines a standard for registering AI agents on-chain with:
- **Identity** - Unique agent IDs with metadata URIs
- **Ownership** - ERC-721 compatible (transferable)
- **Reputation** - On-chain feedback and scoring system

## Features

- **Real-time indexing** of agent registrations and feedback
- **Activity feed** showing latest on-chain events
- **Agent directory** with search and filtering
- **Reputation tracking** with feedback aggregation
- **Multi-chain support** (Sepolia, Base Sepolia)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ERC-8004 Contracts                       │
│              (Sepolia + Base Sepolia)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ Events
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ponder Indexer                           │
│  • Watches Registered, Transfer, NewFeedback events         │
│  • Fetches off-chain metadata (IPFS/HTTPS)                  │
│  • Exposes REST API                                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Web App                            │
│  • Agent directory grid                                     │
│  • Real-time activity feed                                  │
│  • Agent detail modals                                      │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/erc8004-explorer.git
cd erc8004-explorer

# Install dependencies
pnpm install

# Copy environment files
cp apps/indexer/.env.example apps/indexer/.env
```

### Configure RPC

Edit `apps/indexer/.env` with your RPC URL:

```bash
# Get a free key at https://alchemy.com
PONDER_RPC_URL_11155111=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Run

```bash
# Start the indexer (syncs blockchain data)
pnpm dev

# In another terminal, start the web app
pnpm dev:web
```

Open http://localhost:3000 to view the explorer.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /agents` | List all agents with pagination |
| `GET /agents/:chainId/:agentId` | Agent details with reputation |
| `GET /activity` | Recent activity feed |
| `GET /stats` | Global statistics |

## Contract Addresses

The ERC-8004 contracts are deployed at the same address across testnets:

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x7177a6867296406881E20d6647232314736Dd09A` |
| ReputationRegistry | `0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322` |

### Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Sepolia | 11155111 | ✅ Active |
| Base Sepolia | 84532 | 🔜 Coming soon |

## Tech Stack

- **Indexer**: [Ponder](https://ponder.sh) - EVM indexing framework
- **Database**: PGlite (dev) / PostgreSQL (prod)
- **Frontend**: React + Vite + Tailwind CSS
- **API**: Hono (built into Ponder)

## Project Structure

```
erc8004-explorer/
├── apps/
│   ├── indexer/           # Ponder blockchain indexer
│   │   ├── src/
│   │   │   ├── IdentityRegistry.ts
│   │   │   ├── ReputationRegistry.ts
│   │   │   └── api/index.ts
│   │   ├── abis/
│   │   ├── ponder.config.ts
│   │   └── ponder.schema.ts
│   │
│   └── web/               # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── App.tsx
│       └── vite.config.ts
│
├── pnpm-workspace.yaml
└── docker-compose.yml     # Local Postgres (optional)
```

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT
