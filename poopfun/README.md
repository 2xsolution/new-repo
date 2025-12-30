# PoopFun.app 💩

A pump.fun-style token launchpad built with Meteora DLMM, featuring bonding curves, one-launch-only rules, and creator fee routing.

## Features

- **Bonding Curve**: 50 SOL cap using Meteora DLMM pools
- **One-Launch Only**: Unique name+ticker enforcement on-chain
- **Creator Fee Routing**: 7 routing modes (LP, Buyback/Burn, Wallet, Volume, MM, Holder Rewards, Staker Rewards)
- **Automatic LP Migration**: 47 SOL + 85% supply to permanent LP after bonding
- **Fair Launch**: No presales, everyone trades on the bonding curve

## Architecture

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript + SQLite
- **Blockchain**: Solana + Meteora DLMM SDK
- **Bonding**: Meteora customizable permissionless pools

## Setup

### Prerequisites

- Node.js 18+
- SQLite3
- Solana wallet with SOL

### Installation

```bash
# Install dependencies
cd backend && npm install
cd ../web && npm install

# Setup database
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh

# Initialize configuration
npm run initialize

# Configure environment
cp .env.example .env
# Edit .env with your values
```

### Development

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd web
npm run dev
```

Visit http://localhost:3000

## Bonding Economics

- **Target**: 50 SOL collected
- **LP Creation**: 47 SOL + 85% of tokens
- **Creator Payout**: 2 SOL
- **Platform Payout**: 1 SOL

### Fees

**Pre-Bonding** (during bonding phase):
- Total: 1%
- Platform: 0.9%
- Creator: 0.1%

**Post-Bonding** (after LP migration):
- Dynamic fees based on market cap tiers
- Configurable in database

## Fee Routing Modes

1. **LP**: Add fees to liquidity pool
2. **Buyback & Burn**: Swap for tokens and burn
3. **Send to Wallet**: Direct transfer to specified wallet
4. **Volume**: Send to dedicated volume wallet
5. **Market Making**: Send to MM wallet
6. **Holder Rewards**: Distribute via merkle tree
7. **Staker Rewards**: Distribute to stakers only

## API Endpoints

### Tokens
- `POST /api/tokens/create` - Create new token
- `GET /api/tokens` - List all tokens
- `GET /api/tokens/:mint` - Get token details
- `GET /api/tokens/:mint/progress` - Get bonding progress

### Trading
- `POST /api/trading/buy` - Buy during bonding
- `POST /api/trading/sell` - Sell during bonding

### Identity
- `GET /api/identity/check` - Check name+ticker availability

## Deployment

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd web
npm run build
npm start
```

## License

MIT

## Support

Discord: [your-discord]
Twitter: [@poopfun]