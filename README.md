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
AGENT_PRIVATE_KEY=0x...
SIMULATE_TRANSACTIONS=true
```

### Dashboard

```bash
cd dashboard
npm install
```

Create `dashboard/.env`:
```env
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_LIVEKIT_TOKEN=<generated-token>
```

## Run

### Start Agent
```bash
cd agent
npm run dev
```

### Start Dashboard
```bash
cd dashboard
npm run dev
```

Open `http://localhost:5173`
