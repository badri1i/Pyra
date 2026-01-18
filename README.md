# PYRA
NexHacks 2026

## Setup

### Agent

```bash
cd agent
npm install
```

Create `agent/.env`:
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

RPC_URL=https://rpc.sepolia.org
CHAIN_ID=11155111

ETHERSCAN_API_KEY=your-etherscan-key
KAIRO_API_KEY=your-kairo-key
KAIRO_API_URL=https://api.kairoaisec.com/v1/analyze
KAIRO_SEVERITY_THRESHOLD=high

AGENT_PRIVATE_KEY=0x...
SIMULATE_TRANSACTIONS=true
```

### Dashboard

```bash
cd dashboard
npm install
node generate-token.js
```

Create `dashboard/.env` with the generated token:
```env
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_LIVEKIT_TOKEN=<paste-generated-token>
```

## Run

```bash
# Terminal 1 (connect agent to the dev room)
cd agent
npm run dev

This connects the agent to the `pyra-room` used by the dashboard token generator.

# Terminal 2
cd dashboard
npm run dev
```

Open http://localhost:5173
