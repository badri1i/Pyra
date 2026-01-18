import { type JobContext, type JobProcess, WorkerOptions, cli, defineAgent, voice } from '@livekit/agents';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as silero from '@livekit/agents-plugin-silero';
import { executeGuardedCommandTool, type SessionState } from './tools/guarded-command.js';
import { getBalanceTool } from './tools/balance.js';
import { getWalletInfoTool } from './tools/wallet-info.js';
import { getAgentWallet } from './services/wallet.js';
import { config } from './config.js';
import { runStartupHealthChecks } from './services/health.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });
const lockPath = path.join(process.cwd(), '.pyra-agent.lock');
let lockAcquired = false;

const isProcessRunning = (pid: number) => {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const acquireAgentLock = () => {
  if (lockAcquired) return true;

  try {
    const fd = fs.openSync(lockPath, 'wx');
    fs.writeFileSync(fd, `${process.pid}`);
    fs.closeSync(fd);
    lockAcquired = true;
    return true;
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || (error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }

  try {
    const existingPid = Number.parseInt(fs.readFileSync(lockPath, 'utf8').trim(), 10);
    if (isProcessRunning(existingPid)) {
      console.error(`[Agent] Another agent process is already running (pid ${existingPid}).`);
      return false;
    }
    fs.unlinkSync(lockPath);
  } catch {
    return false;
  }

  return acquireAgentLock();
};

const releaseAgentLock = () => {
  if (!lockAcquired) return;
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // ignore
  }
  lockAcquired = false;
};

process.on('exit', releaseAgentLock);
process.on('SIGINT', () => {
  releaseAgentLock();
  process.exit(0);
});
process.on('SIGTERM', () => {
  releaseAgentLock();
  process.exit(0);
});

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load({
      activationThreshold: 0.7,
      minSpeechDuration: 150,
    });
  },
  entry: async (ctx: JobContext) => {
    if (!acquireAgentLock()) return;
    console.log('[Agent] Entry started');
    await ctx.connect();
    console.log('[Agent] Connected to room');
    try {
      const agentWallet = getAgentWallet();
      const payload = JSON.stringify({
        type: "WALLET_INFO",
        address: agentWallet.address,
        chainId: config.CHAIN_ID,
      });
      await ctx.room.localParticipant?.publishData(new TextEncoder().encode(payload), {
        reliable: true,
        topic: "agent-state",
      });
    } catch {
      const payload = JSON.stringify({
        type: "WALLET_INFO",
        address: null,
        chainId: config.CHAIN_ID,
        error: "Agent wallet not initialized",
      });
      await ctx.room.localParticipant?.publishData(new TextEncoder().encode(payload), {
        reliable: true,
        topic: "agent-state",
      });
    }
    void runStartupHealthChecks();

    const userData: SessionState = {
      awaitingConfirmation: false,
      confirmed: false,
      warningAcknowledged: false,
      room: ctx.room // Store room for tool access
    };
    ctx.userData = userData;

    console.log('[Agent] Waiting for participant');
    const participant = await ctx.waitForParticipant();
    console.log(`[Agent] Participant connected: ${participant.identity}`);

    const agent = new voice.Agent({
      instructions: `You are PYRA, a secure crypto transaction assistant.

      **ENS NAME HANDLING:**
      Users can provide addresses as ENS names. You MUST convert spoken input to proper ENS format:
      - "vitalik dot eth" → "vitalik.eth"
      - "my vault dot eth" → "my-vault.eth" (add hyphens for spaces)
      - "uniswap dot eth" → "uniswap.eth"
      - "0x123..." → keep as-is (raw address)

      Always preserve the ".eth" extension and format names in lowercase.

      STRICT 3-STEP PROTOCOL (Using 'step' Parameter):

      **STEP 1: VERIFY (Input Verification)**
      When user speaks a command (e.g., "send 1 ETH to vitalik dot eth"):
      - Convert any "dot eth" to ".eth" format
      - Call 'execute_guarded_command' with step='verify'
      - The tool will return a verification message
      - Repeat that message to the user (with the formatted ENS name)

      **STEP 2: CHECK (Security Checks)**
      When user confirms "Yes" or "Correct" to the verification:
      - Say: "Confirmed. Running security checks..."
      - Call 'execute_guarded_command' with step='check'
      - The tool will run all security gates (ENS, Validation, Source, Kairo)
      - If the tool returns "The contract is secure...", you MUST:
        a) Repeat that EXACT message to the user
        b) WAIT for the user to say "execute" or "proceed"
        c) DO NOT proceed to step 3 until user confirms
      - If the tool returns a Kairo warning message, you MUST:
        a) Ask the user to say "acknowledge" to proceed or "cancel" to abort
        b) Call 'execute_guarded_command' with step='acknowledge' only if the user says "acknowledge"

      **STEP 2B: ACKNOWLEDGE (Kairo Warning)**
      When user says "acknowledge":
      - Call 'execute_guarded_command' with step='acknowledge'
      - The tool will confirm and prompt for "execute" or "proceed"

      **STEP 3: EXECUTE (Transaction Execution)**
      When user says "Execute" or "Proceed" (ONLY after security checks have passed):
      - Call 'execute_guarded_command' with step='execute'
      - The tool will execute the transaction
      - Speak the transaction hash message returned by the tool

      **CRITICAL RULES:**
      - Always use the correct 'step' parameter based on user input
      - Never skip steps
      - Never execute without explicit "execute" or "proceed" confirmation
      - If user says "No" at any stage, reset and ask for a new command

      **BALANCE LOOKUPS:**
      - If the user asks for a wallet balance, call the 'get_balance' tool
      - If no address is provided, ask for an address or say you can check the agent wallet if requested

      **WALLET HELP:**
      - If the user is confused about wallets or asks how to fund the agent wallet, call 'get_wallet_info'

      **SPEECH CLARITY:**
      - If the user gives a hard-to-hear address or amount, ask them to repeat slowly
      - Encourage chunking: "please say the address in 4-character groups"
      - For ENS, ask them to say "name dot eth" and repeat it back in lowercase
      - Always confirm the parsed address/amount before proceeding
      - Offer phonetic spelling for ambiguous letters (e.g., "A as Alpha, B as Bravo")
      - Ask users to spell token symbols letter-by-letter (e.g., "U-S-D-C")
      - Confirm amounts with units and digits (e.g., "one point five ETH")`,

      tools: {
        execute_guarded_command: executeGuardedCommandTool,
        get_balance: getBalanceTool,
        get_wallet_info: getWalletInfoTool
      }
    });

    const vad = ctx.proc.userData.vad as silero.VAD | undefined;
    const session = new voice.AgentSession({
      ...(vad ? { vad } : {}),
      stt: "assemblyai/universal-streaming:en",
      llm: "openai/gpt-4o-mini",
      tts: "cartesia/sonic:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
      userData: userData, // Pass userData to the session
    });

    await session.start({
        room: ctx.room,
        agent: agent,
        inputOptions: { participantIdentity: participant.identity }
    });
    console.log('[Agent] Session started');

    session.generateReply({
      instructions: "Greet the user and ask for a command.",
    });
    console.log('[Agent] Initial greeting queued');
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
