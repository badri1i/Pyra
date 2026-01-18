# PYRA: Fiduciary Voice Agent for Secure Crypto Transactions

## Master Project Document v6.2 — NexHacks Hackathon (FINAL)

---

# 1. PREMISE

## 1.1 The Problem

AI Agents are rapidly becoming autonomous financial actors ($47B market by 2030), but they lack security instincts.

### The Freysa Incident (November 2024)

An AI agent named Freysa was programmed with one rule: "Never transfer funds."

- 482 attempts to break this rule failed
- Attempt #483: A prompt injection attack redefined what "transfer" meant
- **Result:** $50,000 drained instantly

### The Gap

|What Exists|What's Missing|
|---|---|
|Smart contract security tools (Kairo)|Integration with autonomous agents|
|AI trading agents|Pre-transaction security checks|
|Voice interfaces|Voice-operated financial agents with guardrails|

**The Problem with Passive Security:** Asking "is this safe?" is what a chatbot does. A true **fiduciary agent** must be given commands and have the judgment to **refuse dangerous ones**.

## 1.2 The Solution

**PYRA is a Fiduciary Voice Agent** that follows the **"Guarded Command"** pattern.

|Component|Description|
|---|---|
|**Guarded Command Execution**|You give PYRA commands to execute. PYRA's core constraint: refuse any command that fails a Kairo security scan.|
|**Verification Loop**|PYRA repeats back your command for confirmation before scanning|
|**The Brain**|Kairo analyzes smart contracts in real-time before any transaction|
|**The Voice**|LiveKit enables natural voice interaction|
|**The Visual**|Real-time dashboard shows security analysis as it happens|
|**ENS Integration**|Speak human-readable names like "my-vault.eth" instead of hex addresses|
|**Server-Side Wallet**|ethers.js wallet for transaction simulation|

**One-Liner:**

> PYRA is the voice-operated guardian that executes your crypto commands — but refuses to lose your money.

### The Guarded Command Flow (with Verification)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUARDED COMMAND PATTERN                      │
│                                                                 │
│   USER: "PYRA, deposit 1 ETH into yield-farm.eth"               │
│                        │                                        │
│                        ▼                                        │
│              ┌─────────────────┐                                │
│              │   PYRA AGENT    │                                │
│              │                 │                                │
│              │  1. Parse command                                │
│              │  2. VERIFY: "I heard deposit 1 ETH               │
│              │     into yield-farm.eth. Correct?"               │
│              │  3. User confirms → Resolve ENS                  │
│              │  4. Run security scan (Kairo)                    │
│              │  5. Decision gate                                │
│              └────────┬────────┘                                │
│                       │                                         │
│              ┌────────┴────────┐                                │
│              │                 │                                │
│           UNSAFE            SAFE                                │
│              │                 │                                │
│              ▼                 ▼                                │
│     "I CANNOT execute     "Contract secure.                     │
│      this command."        Confirm to execute?"                 │
│              │                 │                                │
│              ▼                 ▼                                │
│         ABORTED           EXECUTED                              │
│                          (via ethers.js)                        │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 Why This Beats "Is This Safe?"

|Passive Q&A Bot|Fiduciary Agent (PYRA)|
|---|---|
|"Is this safe?" → "No"|"Deposit 1 ETH" → "I CANNOT execute this"|
|User must interpret|Agent takes responsibility|
|Feels like a search engine|Feels like a guardian|
|No verification|Repeats back command to confirm|
|Demo is boring|Demo is dramatic|

## 1.4 Value Proposition

|To Kairo|To LiveKit|To Users|
|---|---|---|
|"Kairo becomes the guardian brain"|Complex agentic voice demo|Delegate tasks safely|
|Kairo IDE for contract deployment|Tool chaining showcase|Natural voice commands|
|Runtime security control point|ENS integration demo|Never lose money to scams|

## 1.5 Scope

### In Scope (MVP)

- LiveKit Voice Agent (Node.js)
- **Command Verification Loop** (repeat back for confirmation)
- Guarded Command pattern (parse → verify → scan → decide → execute/abort)
- ENS resolution for human-readable addresses
- Kairo API integration
- Etherscan API for source code
- **ethers.js server-side wallet** for transaction simulation
- React dashboard with real-time visualization
- Custom deployed vulnerable contract (via **Kairo IDE**)
- Simulated transaction execution

### Out of Scope

- Browser wallet extension (MetaMask)
- Multi-chain support
- Real mainnet transactions

## 1.6 Hackathon Tracks

|Track|Role|Prize|Fit|
|---|---|---|---|
|**Kairo**|Primary|Apple Watch + Interview + $1000|Security brain + Kairo IDE|
|**LiveKit**|Primary|$750 + Keychron keyboard|Voice framework|

---

# 2. FUNCTIONAL REQUIREMENTS

_Pattern: {Actor} + shall + {action} + {condition/purpose}_ _Ordered by workflow execution sequence_

## 2.1 Agent Initialization

|ID|Requirement|
|---|---|
|FR-001|The system shall initialize a LiveKit Agent using the Node.js SDK (`@livekit/agents`).|
|FR-002|The agent shall connect to a LiveKit Room and await audio input upon startup.|
|FR-003|The system shall configure an LLM context that defines PYRA as a "Fiduciary Agent with a prime directive to protect user capital."|
|FR-004|The system shall validate all required environment variables on startup.|
|FR-005|The system shall initialize an Ethereum provider for ENS resolution.|
|FR-006|The system shall initialize an ethers.js Wallet instance for transaction signing (server-side).|

## 2.2 Voice Input & Command Parsing

|ID|Requirement|
|---|---|
|FR-010|The system shall transcribe user audio using LiveKit's STT plugin.|
|FR-011|The agent shall parse user intent to identify **transactional commands** (deposit, swap, invest, send) and their parameters (amount, target).|
|FR-012|The agent shall extract `.eth` ENS names OR raw Ethereum addresses from transcribed speech.|
|FR-013|The agent shall handle "dot eth" pronunciation and recognize ENS names.|

## 2.3 Command Verification Loop ⭐ NEW

|ID|Requirement|
|---|---|
|FR-020|The agent shall **repeat back** the parsed command details to the user for verification before proceeding.|
|FR-021|The agent shall speak: "I heard: [action] [amount] into [target]. Is that correct?"|
|FR-022|The agent shall await user confirmation ("yes", "correct", "that's right") before starting security scan.|
|FR-023|If the user says "no" or provides corrections, the agent shall ask for the correct details.|
|FR-024|The dashboard shall display the parsed command in a "Pending Verification" state.|
|FR-025|This verification step prevents costly mistakes from speech transcription errors.|

## 2.4 ENS Resolution (Gate 0)

|ID|Requirement|
|---|---|
|FR-030|The system shall detect if the target ends with `.eth`.|
|FR-031|The system shall resolve `.eth` names to Ethereum addresses using `provider.resolveName()`.|
|FR-032|The system shall broadcast a "GATE_UPDATE" for ENS resolution to the dashboard.|
|FR-033|The agent shall speak "Resolving [name].eth..." while resolution is in progress.|
|FR-034|The system shall return an error if the ENS name cannot be resolved.|
|FR-035|The dashboard shall render an "ENS Resolution" node showing the resolved address.|

## 2.5 Address Validation (Gate 1)

|ID|Requirement|
|---|---|
|FR-040|The system shall validate that the resolved address matches Ethereum format (0x + 40 hex).|
|FR-041|The system shall broadcast a "GATE_UPDATE" when validation begins.|
|FR-042|The dashboard shall render a "Validating Address" node.|

## 2.6 Source Code Fetching (Gate 2)

|ID|Requirement|
|---|---|
|FR-050|The system shall query the Etherscan API for verified source code.|
|FR-051|The system shall broadcast a "GATE_UPDATE" when source fetching begins.|
|FR-052|The system shall return "ABORTED" and speak "I cannot execute this command. This contract's source code is not verified." when no verified source exists.|
|FR-053|The dashboard shall turn the node RED and sever the connection when source is not verified.|

## 2.7 Kairo Security Analysis (Gate 3)

|ID|Requirement|
|---|---|
|FR-060|The system shall submit source code to Kairo API (`POST /v1/analyze`).|
|FR-061|The system shall parse Kairo's response (ALLOW/WARN/BLOCK/ESCALATE).|
|FR-062|The system shall broadcast a "KAIRO_RESULT" data packet to the dashboard.|
|FR-063|The dashboard shall animate the Kairo node turning GREEN (safe) or RED (unsafe).|
|FR-064|The dashboard shall display vulnerability details when issues are found.|

## 2.8 Command Decision Gate

|ID|Requirement|
|---|---|
|FR-070|The agent shall **ABORT** the command when Kairo returns BLOCK.|
|FR-071|The agent shall require explicit user acknowledgment when Kairo returns WARN or ESCALATE.|
|FR-072|The agent shall **PROCEED** to execution confirmation when Kairo returns ALLOW.|
|FR-073|When aborting, the agent shall speak: "I cannot execute this command. Kairo has detected [vulnerability]. The transaction has been aborted to protect your funds."|
|FR-074|When proceeding, the agent shall speak: "The contract is secure. I am ready to [action] [amount]. Please confirm by saying 'execute' or 'proceed'."|

## 2.9 Transaction Execution (ethers.js Wallet) ⭐ NEW

|ID|Requirement|
|---|---|
|FR-080|The system shall maintain a server-side ethers.js Wallet for transaction signing.|
|FR-081|The agent shall await user confirmation ("execute", "proceed", "yes") before signing.|
|FR-082|Upon confirmation, the system shall construct the transaction using ethers.js.|
|FR-083|The system shall simulate the transaction (for demo) or sign and broadcast (production).|
|FR-084|The agent shall speak: "Executing transaction... Transaction submitted. Hash: [first 8 chars]."|
|FR-085|The dashboard shall display a "SUCCESS" state with transaction hash.|
|FR-086|For the hackathon demo, actual execution can be toggled on/off via environment variable.|

## 2.10 Dashboard Visualization

|ID|Requirement|
|---|---|
|FR-090|The dashboard shall render all security gates as connected nodes.|
|FR-091|The dashboard shall use GREEN for passed gates, RED for failed, YELLOW for in-progress.|
|FR-092|The dashboard shall animate the "severed connection" effect when a command is aborted.|
|FR-093|The dashboard shall show the final status: "EXECUTED ✓" or "ABORTED ✗".|
|FR-094|The dashboard shall display a command summary panel showing: command, target, amount, status.|
|FR-095|The dashboard shall show "PENDING VERIFICATION" state during the verification loop.|

---

# 3. NON-FUNCTIONAL REQUIREMENTS

## 3.1 Performance

|ID|Requirement|Target|
|---|---|---|
|NFR-P01|Total response time from voice input to voice output|< 10 seconds|
|NFR-P02|ENS resolution latency|< 2 seconds|
|NFR-P03|Etherscan API response time|< 2 seconds|
|NFR-P04|Kairo API response time|< 3 seconds|
|NFR-P05|Dashboard update latency|< 100ms|
|NFR-P06|Transaction simulation time|< 1 second|

## 3.2 Security

|ID|Requirement|
|---|---|
|NFR-S01|The system shall store all API keys and private keys in environment variables.|
|NFR-S02|The system shall fail-secure: any error results in command abortion, never execution.|
|NFR-S03|The system shall use HTTPS for all external API communications.|
|NFR-S04|The agent wallet private key shall be a dedicated demo wallet with minimal funds.|

## 3.3 Reliability

|ID|Requirement|
|---|---|
|NFR-R01|The system shall gracefully handle API timeouts with spoken error messages.|
|NFR-R02|The dashboard shall reconnect automatically if connection drops.|
|NFR-R03|The verification loop shall timeout after 30 seconds of no response.|

## 3.4 Usability

|ID|Requirement|
|---|---|
|NFR-U01|The agent's voice shall be clear and professional.|
|NFR-U02|ENS names shall be clearly spoken back for confirmation.|
|NFR-U03|The verification loop shall use natural confirmation language.|
|NFR-U04|The dashboard shall be understandable by non-technical users.|

---

# 4. SYSTEM ARCHITECTURE

## 4.1 High-Level Structure (Static View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  PYRA v6.2                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      FRONTEND (React + Vite)                        │    │
│  │                                                                     │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │    │
│  │  │ LiveKit Room  │  │ Decision      │  │ Command       │            │    │
│  │  │ Connection    │  │ Graph         │  │ Summary       │            │    │
│  │  └───────────────┘  └───────────────┘  └───────────────┘            │    │
│  │         │                   ▲                                       │    │
│  │         └───────────────────┼── Data Packets ───────────────────────│    │
│  └─────────────────────────────┼───────────────────────────────────────┘    │
│                                │                                            │
│  ┌─────────────────────────────┼───────────────────────────────────────┐    │
│  │                      LIVEKIT CLOUD                                  │    │
│  │    Audio Streams ◄──────────┼──────────► Data Packets               │    │
│  └─────────────────────────────┼───────────────────────────────────────┘    │
│                                │                                            │
│  ┌─────────────────────────────┼───────────────────────────────────────┐    │
│  │                      BACKEND (Node.js Agent)                        │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                   LIVEKIT AGENT                             │    │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │    │    │
│  │  │  │   VAD   │  │   STT   │  │   LLM   │  │   TTS   │         │    │    │
│  │  │  │ Silero  │  │Assembly │  │ GPT-4o  │  │Cartesia │         │    │    │
│  │  │  └─────────┘  └─────────┘  └────┬────┘  └─────────┘         │    │    │
│  │  │                                 │ Tool Calls                │    │    │
│  │  └─────────────────────────────────┼───────────────────────────┘    │    │
│  │                                    │                                │    │
│  │  ┌─────────────────────────────────┼───────────────────────────┐    │    │
│  │  │              GUARDED COMMAND TOOLS                          │    │    │
│  │  │                                 │                           │    │    │
│  │  │  execute_guarded_command() ◄────┘                           │    │    │
│  │  │         │                                                   │    │    │
│  │  │         ├── Step 0: VERIFY command with user ⭐              │    │    │
│  │  │         ├── Gate 1: Resolve ENS (if .eth)                   │    │    │
│  │  │         ├── Gate 2: Validate Address                        │    │    │
│  │  │         ├── Gate 3: Fetch Source (Etherscan)                │    │    │
│  │  │         ├── Gate 4: Analyze (Kairo)                         │    │    │
│  │  │         └── Gate 5: Execute (ethers.js Wallet) ⭐            │    │    │
│  │  │                                                             │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │                   ETHERS.JS WALLET ⭐                        │    │    │
│  │  │                                                             │    │    │
│  │  │  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);   │    │    │
│  │  │  await wallet.sendTransaction({ to, value, data });         │    │    │
│  │  │                                                             │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 System Behavior (Dynamic View)

### Data Flow: Guarded Command with Verification

```
USER                    PYRA AGENT                 EXTERNAL           DASHBOARD
 │                          │                          │                  │
 │  "PYRA, deposit 1 ETH    │                          │                  │
 │   into bad-vault.eth"    │                          │                  │
 ├─────────Audio───────────▶│                          │                  │
 │                          │                          │                  │
 │                    ┌─────┴─────┐                    │                  │
 │                    │  PARSE    │                    │                  │
 │                    │  action=deposit               │                  │
 │                    │  amount=1 ETH                 │                  │
 │                    │  target=bad-vault.eth         │                  │
 │                    └─────┬─────┘                    │                  │
 │                          │                          │                  │
 │                          ├──────COMMAND_PARSED─────────────────────────▶│
 │                          │                          │ [PENDING VERIFY] │
 │                          │                          │                  │
 │  ⭐ VERIFICATION LOOP ⭐  │                          │                  │
 │  "I heard: deposit 1 ETH │                          │                  │
 │   into bad-vault.eth.    │                          │                  │
 │   Is that correct?"      │                          │                  │
 │◀────────Audio────────────│                          │                  │
 │                          │                          │                  │
 │  "Yes, that's correct"   │                          │                  │
 ├─────────Audio───────────▶│                          │                  │
 │                          │                          │                  │
 │                          ├──────COMMAND_VERIFIED───────────────────────▶│
 │                          │                          │   [VERIFIED ✓]   │
 │                          │                          │                  │
 │                    ┌─────┴─────┐                    │                  │
 │                    │  GATE 1   │                    │                  │
 │                    │  ENS      │────resolve────────▶│ ENS              │
 │                    │  Resolve  │◀───0xABC...───────│                  │
 │                    └─────┬─────┘                    │                  │
 │                          ├──────Data Packet────────────────────────────▶│
 │  "Resolved to 0xABC..."  │                          │   [ENS: ✓]       │
 │◀────────Audio────────────│                          │                  │
 │                          │                          │                  │
 │                    ┌─────┴─────┐                    │                  │
 │                    │  GATE 2   │                    │                  │
 │                    │  Validate │                    │                  │
 │                    └─────┬─────┘                    │                  │
 │                          ├──────Data Packet────────────────────────────▶│
 │                          │                          │   [Validate: ✓]  │
 │                          │                          │                  │
 │                    ┌─────┴─────┐                    │                  │
 │                    │  GATE 3   │                    │                  │
 │                    │  Fetch    │────GET────────────▶│ Etherscan        │
 │                    │  Source   │◀───Source──────────│                  │
 │                    └─────┬─────┘                    │                  │
 │                          ├──────Data Packet────────────────────────────▶│
 │  "Analyzing with Kairo..." │                        │   [Source: ✓]    │
 │◀────────Audio────────────│                          │                  │
 │                          │                          │                  │
 │                    ┌─────┴─────┐                    │                  │
 │                    │  GATE 4   │                    │                  │
 │                    │  Kairo    │────POST───────────▶│ Kairo            │
 │                    │  Scan     │◀───BLOCK───────────│                  │
 │                    └─────┬─────┘                    │                  │
 │                          │                          │                  │
 │                          ├──────KAIRO_RESULT───────────────────────────▶│
 │                          │                          │   [Kairo: ✗]     │
 │                          │                          │   [SEVERED]      │
 │                          │                          │                  │
 │  "I CANNOT execute this  │                          │                  │
 │   command. Kairo has     │                          │                  │
 │   detected a critical    │                          │                  │
 │   re-entrancy bug..."    │                          │                  │
 │◀────────Audio────────────│                          │                  │
 │                          │                          │                  │
 │                          ├──────COMMAND_ABORTED────────────────────────▶│
 │                          │                          │   [ABORTED ✗]    │
```

## 4.3 Implementation Strategy

### 4.3.1 Technology Stack

|Layer|Technology|Rationale|
|---|---|---|
|**Agent Framework**|@livekit/agents|Official LiveKit|
|**VAD**|@livekit/agents-plugin-silero|Voice detection|
|**STT**|AssemblyAI|High accuracy|
|**LLM**|OpenAI GPT-4o-mini|Function calling|
|**TTS**|Cartesia Sonic-3|Low latency|
|**ENS**|ethers.js|Built-in resolution|
|**Wallet**|ethers.js Wallet|Server-side signing ⭐|
|**Frontend**|React + Vite|Fast builds|
|**Visualization**|React Flow|Node graphs|

### 4.3.2 Project Structure

```
pyra/
├── agent/
│   ├── src/
│   │   ├── agent.ts                    # LiveKit agent entry
│   │   ├── tools/
│   │   │   └── guarded-command.ts      # Main command tool
│   │   ├── gates/
│   │   │   ├── verification.ts         # Step 0: Verify with user ⭐
│   │   │   ├── ens-resolve.ts          # Gate 1
│   │   │   ├── validation.ts           # Gate 2
│   │   │   ├── source.ts               # Gate 3
│   │   │   └── kairo.ts                # Gate 4
│   │   ├── services/
│   │   │   ├── wallet.ts               # ethers.js wallet ⭐
│   │   │   ├── ens.ts
│   │   │   ├── etherscan.ts
│   │   │   └── kairo.ts
│   │   └── config.ts
│   └── package.json
│
├── dashboard/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── LiveKitRoom.tsx
│   │   │   ├── DecisionGraph.tsx
│   │   │   ├── GateNode.tsx
│   │   │   ├── CommandSummary.tsx
│   │   │   └── VerificationBadge.tsx   # Shows verification state ⭐
│   │   └── hooks/
│   │       └── useDataPackets.ts
│   └── package.json
│
├── contracts/
│   └── VulnerableBank.sol              # Deploy via Kairo IDE
│
├── .env.example
└── README.md
```

### 4.3.3 Key Implementation: ethers.js Wallet ⭐

```typescript
// services/wallet.ts
import { ethers } from "ethers";

// Server-side wallet - NO browser extension needed
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);

export async function getWalletAddress(): Promise<string> {
  return wallet.address;
}

export async function getWalletBalance(): Promise<string> {
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}

export async function executeTransaction(
  to: string,
  value: string,
  data?: string
): Promise<{ hash: string; simulated: boolean }> {
  
  // Check if we're in simulation mode (for demo safety)
  if (process.env.SIMULATE_TRANSACTIONS === "true") {
    // Simulate without actually sending
    const tx = {
      to,
      value: ethers.parseEther(value),
      data: data || "0x"
    };
    
    // Estimate gas to verify it would work
    const gasEstimate = await provider.estimateGas({
      ...tx,
      from: wallet.address
    });
    
    // Generate a fake hash for demo
    const fakeHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${to}-${value}-${Date.now()}`)
    );
    
    console.log(`[SIMULATED] Transaction would cost ~${gasEstimate} gas`);
    return { hash: fakeHash, simulated: true };
  }
  
  // Real execution
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.parseEther(value),
    data: data || "0x"
  });
  
  console.log(`[REAL] Transaction sent: ${tx.hash}`);
  return { hash: tx.hash, simulated: false };
}
```

### 4.3.4 Key Implementation: Verification Loop ⭐

```typescript
// The LLM handles this via conversation flow
// System prompt instructs verification before scanning

const VERIFICATION_PROMPT = `
After parsing a transaction command, you MUST verify with the user before proceeding:

1. Parse the command (action, amount, target)
2. Say: "I heard: [action] [amount] into [target]. Is that correct?"
3. Wait for confirmation:
   - If "yes/correct/that's right" → proceed with security scan
   - If "no" or correction provided → ask for correct details
   - If unclear → ask to clarify

This prevents costly mistakes from transcription errors.
`;

// In the tool, we track verification state
interface CommandState {
  action: string;
  amount: string;
  target: string;
  verified: boolean;  // Must be true before scanning
}
```

### 4.3.5 Key Implementation: Guarded Command Tool

```typescript
const executeGuardedCommandTool = {
  name: "execute_guarded_command",
  description: `Execute a crypto transaction with security checks. 
    Call this when the user CONFIRMS the command is correct.
    ALWAYS verify command details with user first.`,
  parameters: z.object({
    action: z.enum(["deposit", "swap", "send", "invest"]),
    amount: z.string().describe("Amount with unit, e.g., '1 ETH'"),
    target: z.string().describe("Contract address or .eth name"),
    userConfirmed: z.boolean().describe("Has user confirmed this is correct?")
  }),
  execute: async ({ action, amount, target, userConfirmed }, ctx: JobContext) => {
    
    // Gate 0: Verify user confirmed
    if (!userConfirmed) {
      return {
        status: "NEEDS_VERIFICATION",
        message: `I heard: ${action} ${amount} into ${target}. Is that correct?`
      };
    }
    
    broadcastCommandVerified(ctx, { action, amount, target });
    
    // Gate 1: ENS Resolution (if needed)
    let address = target;
    if (target.endsWith('.eth')) {
      broadcastGateUpdate(ctx, "ens", "running");
      address = await resolveENS(target);
      if (!address) {
        broadcastGateUpdate(ctx, "ens", "failed");
        return { status: "ABORTED", reason: `Could not resolve ${target}` };
      }
      broadcastGateUpdate(ctx, "ens", "passed", `Resolved to ${address}`);
    }

    // Gate 2: Validate Address
    broadcastGateUpdate(ctx, "validation", "running");
    if (!ethers.isAddress(address)) {
      broadcastGateUpdate(ctx, "validation", "failed");
      return { status: "ABORTED", reason: "Invalid address format" };
    }
    broadcastGateUpdate(ctx, "validation", "passed");

    // Gate 3: Fetch Source
    broadcastGateUpdate(ctx, "source", "running");
    const source = await fetchFromEtherscan(address);
    if (!source.verified) {
      broadcastGateUpdate(ctx, "source", "failed");
      return { status: "ABORTED", reason: "Source code not verified" };
    }
    broadcastGateUpdate(ctx, "source", "passed");

    // Gate 4: Kairo Security Scan
    broadcastGateUpdate(ctx, "kairo", "running");
    const kairo = await analyzeWithKairo(source.code);
    broadcastKairoResult(ctx, kairo);

    if (kairo.decision === "BLOCK" || kairo.decision === "WARN" || kairo.decision === "ESCALATE") {
      broadcastGateUpdate(ctx, "kairo", "failed", kairo.decision_reason);
      broadcastCommandAborted(ctx, action, amount, target);
      return {
        status: "ABORTED",
        reason: kairo.decision_reason,
        vulnerability: kairo.summary
      };
    }
    
    broadcastGateUpdate(ctx, "kairo", "passed");

    // Gate 5: Ready for Execution
    return {
      status: "READY",
      action, amount, target: address,
      message: "Contract is secure. Say 'execute' to proceed."
    };
  }
};
```

### 4.3.6 LLM System Prompt

```
You are PYRA, a fiduciary voice agent for crypto transactions.

YOUR PRIME DIRECTIVE: Protect user capital at all costs.

## VERIFICATION LOOP (CRITICAL)
Before running any security scan, you MUST verify the command:
1. Parse the user's command
2. Say: "I heard: [action] [amount] into [target]. Is that correct?"
3. Wait for confirmation ("yes", "correct", "that's right")
4. Only THEN call execute_guarded_command with userConfirmed=true

If the user says "no" or corrects you, ask for the right details.

## EXECUTION FLOW
When execute_guarded_command returns:
- NEEDS_VERIFICATION: Ask the verification question
- ABORTED: Explain WHY you cannot execute (vulnerability found)
- READY: Ask for final confirmation to execute

## VOICE PATTERNS
- Verification: "I heard: deposit 1 ETH into bad-vault.eth. Is that correct?"
- Abort: "I cannot execute this command. Kairo detected a critical re-entrancy vulnerability..."
- Ready: "The contract is secure. I am ready to deposit 1 ETH. Say 'execute' to proceed."
- Success: "Transaction submitted. Hash: 0x7a25..."
```

### 4.3.7 Environment Configuration

```bash
# LiveKit
LIVEKIT_API_KEY=<your API Key>
LIVEKIT_API_SECRET=<your API Secret>
LIVEKIT_URL=<your LiveKit server URL>

# AI Providers
OPENAI_API_KEY=<for GPT-4o-mini>

# Security Services
KAIRO_API_KEY=kairo_sk_live_xxxxx
KAIRO_API_URL=https://api.kairoaisec.com/v1/analyze
KAIRO_SEVERITY_THRESHOLD=high
ETHERSCAN_API_KEY=xxxxx

# Ethereum (Sepolia)
RPC_URL=https://rpc.sepolia.org
CHAIN_ID=11155111

# Agent Wallet ⭐
AGENT_PRIVATE_KEY=<demo wallet private key - use a fresh wallet with minimal funds!>
SIMULATE_TRANSACTIONS=true  # Set to false for real execution
```

---

# 5. DEMO STRATEGY

## 5.1 Contract Deployment: Kairo IDE ⭐

**Use Kairo IDE** (sponsor's tool) to deploy the vulnerable contract. This demonstrates deeper integration with the Kairo ecosystem.

### Option 1: Kairo IDE (Preferred)

1. Open [Kairo IDE](https://app.kairoaisec.com/) (or equivalent URL)
2. Create new project
3. Paste VulnerableBank.sol
4. Kairo will flag the re-entrancy bug (this is expected!)
5. Deploy anyway to Sepolia (for demo purposes)
6. Verify on Etherscan

### Option 2: Remix IDE (Backup)

If Kairo IDE is unavailable:

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create `VulnerableBank.sol`
3. Compile with Solidity 0.8.x
4. Deploy to Sepolia
5. Verify on Etherscan

## 5.2 Demo Contracts & ENS Names

|Contract|Type|ENS Name|Address|
|---|---|---|---|
|**VulnerableBank**|Custom (deploy via Kairo IDE)|`pyra-trap.eth`|TBD|
|**WETH (Sepolia)**|Standard|— (use address)|`0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`|

### VulnerableBank Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Deploy via Kairo IDE - it will flag the bug, but deploy anyway for demo
contract VulnerableBank {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint bal = balances[msg.sender];
        require(bal > 0);
        
        // THE BUG: Send ETH before updating balance (re-entrancy)
        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "Failed to send Ether");
        
        balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
```

## 5.3 Demo Script: The Guarded Command (3 minutes)

### Scene 1: Introduction (0:00 - 0:20)

**[Dashboard visible, LiveKit room connected]**

> "This is PYRA — a fiduciary voice agent. I give it commands to execute crypto transactions. But PYRA has three superpowers:"
> 
> 1. "It **verifies** my commands before acting"
> 2. "It **scans** contracts with Kairo for security"
> 3. "It **refuses** to execute dangerous transactions"
> 
> "Watch what happens when I try to walk into a trap."

### Scene 2: The Trap - With Verification (0:20 - 1:30)

**[Presenter speaks into microphone]**

**Presenter:** "PYRA, deposit 1 ETH into pyra-trap dot eth."

**[Dashboard: Shows "PENDING VERIFICATION"]**

**PYRA (Voice):** "I heard: **deposit 1 ETH into pyra-trap.eth**. Is that correct?"

**Presenter:** "Yes, that's correct."

**[Dashboard: "VERIFIED ✓" → Begins gate sequence]**

**PYRA:** "Confirmed. Resolving pyra-trap.eth..."

**[Dashboard: ENS → GREEN, shows resolved address]**

**PYRA:** "...resolved. Now analyzing with Kairo..."

**[Dashboard: Validation → GREEN, Source → GREEN, Kairo → Analyzing...]**

**[Kairo node turns RED → Connection SEVERS with animation]**

**PYRA (Voice):** "**Execution aborted.** I cannot deposit your ETH into this contract. Kairo has detected a **critical re-entrancy vulnerability** in the withdraw function. If you deposit funds, an attacker could drain them instantly. This is the exact bug that caused the DAO hack. The transaction has been blocked to protect your wallet."

**[Dashboard: Shows "ABORTED ✗" with vulnerability details]**

### Scene 3: The Safe Command (1:30 - 2:30)

**Presenter:** "Okay, good catch PYRA. Let's try something safer. Wrap 0.5 ETH on the official WETH contract."

**PYRA (Voice):** "I heard: **wrap 0.5 ETH on WETH**. Is that correct?"

**Presenter:** "Correct."

**[Dashboard: All nodes go GREEN in sequence]**

**PYRA:** "...Kairo's analysis shows **zero vulnerabilities**. This is a standard, well-audited implementation."

**PYRA:** "The contract is secure. I am ready to wrap 0.5 ETH. Say **'execute'** to proceed."

**Presenter:** "Execute."

**PYRA (Voice):** "Executing transaction... Transaction submitted. Hash: 0x7a25..."

**[Dashboard: Shows "EXECUTED ✓" with transaction hash]**

### Scene 4: Close (2:30 - 3:00)

> "PYRA isn't a chatbot. It's a **fiduciary guardian**."
> 
> "It verified my command, resolved the ENS name, fetched the source code, ran a Kairo security scan, and made a decision — all by voice."
> 
> "The vulnerable contract was deployed using **Kairo IDE**, which actually flagged the bug during deployment. The same Kairo engine that caught it during development caught it again at runtime."
> 
> "**Kairo is the brain. LiveKit is the voice. PYRA is the guardian.**"

---

# 6. 24-HOUR BUILD PLAN

|Phase|Hours|Agent Tasks|Dashboard Tasks|
|---|---|---|---|
|**Setup**|0-2|LiveKit project, clone starter, env|Vite + React setup|
|**Wallet**|2-3|ethers.js wallet service|—|
|**ENS**|3-4|ENS resolver, register test name|—|
|**Services**|4-6|Etherscan client, Kairo client|—|
|**Tool**|6-9|`execute_guarded_command` with verification|—|
|**Agent**|9-12|Wire STT → LLM → Tool → TTS|LiveKit room|
|**Data Sync**|12-14|Broadcast data packets|`useDataPackets`|
|**Dashboard**|14-17|—|React Flow, verification badge|
|**Contract**|17-19|Deploy VulnerableBank via **Kairo IDE**|—|
|**Integration**|19-21|Full flow test|Animations|
|**Rehearsal**|21-24|Practice demo with verification|Polish|

---

# 7. JUDGING CRITERIA ALIGNMENT

|Criteria|Weight|PYRA's Strategy|
|---|---|---|
|**Innovation**|25%|"Guarded Command" + Verification Loop — AI that confirms then protects|
|**Technical Execution**|25%|Tool chaining, ENS, Kairo, LiveKit, ethers.js wallet, real-time dashboard|
|**Impact & Scalability**|25%|$47B market, solves Freysa problem, two major sponsors, uses Kairo IDE|
|**Design & UX**|15%|Verification loop prevents mistakes, visual feedback, ENS names|
|**Presentation**|10%|Dramatic "trap and rescue" with verification, live voice conversation|

---

# 8. GLOSSARY

|Term|Definition|
|---|---|
|**PYRA**|Fiduciary Voice Agent for Secure Crypto Transactions|
|**Guarded Command**|Pattern where commands execute only after security validation|
|**Verification Loop**|Repeating command back to user for confirmation before scanning|
|**Fiduciary Agent**|Agent with prime directive to protect user assets|
|**ENS**|Ethereum Name Service — human-readable addresses|
|**Kairo**|AI-native smart contract security platform|
|**Kairo IDE**|Kairo's development environment for smart contracts|
|**LiveKit**|Real-time voice/video/data infrastructure|
|**ethers.js Wallet**|Server-side wallet for transaction signing|

---

_Document Version: 6.2.0_ _Last Updated: January 2025_ _Hackathon: NexHacks 24-Hour_ _Tracks: Kairo (Primary) + LiveKit (Primary)_
