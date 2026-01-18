import { type JobContext, WorkerOptions, cli, defineAgent, voice } from '@livekit/agents';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { config } from './config.js'; // FR-004: Validation triggers here
import { getAgentWallet, getBalance } from './services/wallet.js'; // FR-005/006: Init
import { executeGuardedCommandTool, type SessionState } from './tools/guarded-command.js'; // FR-011/012/013: Command parsing

// Load environment variables from .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // --- STARTUP CHECKS ---
    console.log('[System] Verifying Wallet...');
    try {
        const wallet = getAgentWallet();
        const balance = await getBalance(wallet.address);
        console.log(`[System] Agent Wallet Active: ${wallet.address} (Balance: ${balance} ETH)`);
        if (config.SIMULATE_TRANSACTIONS) {
            console.log('[System] 🛡️ SIMULATION MODE ACTIVE. No real funds will move.');
        }
    } catch (e) {
        console.error('[System] Wallet check failed:', e);
    }

    // 1. Connect to LiveKit
    await ctx.connect();
    console.log('Waiting for participant...');

    // 2. Wait for user to join
    const participant = await ctx.waitForParticipant();
    console.log(`Starting assistant for ${participant.identity}`);

    // 3. Define the Agent Identity (FR-003: Fiduciary Persona)
    const agent = new voice.Agent({
      instructions: `You are PYRA, a fiduciary voice agent for crypto transactions.

YOUR PRIME DIRECTIVE: Protect user capital at all costs.

Wallet Address: ${getAgentWallet()?.address || "Unavailable"}

## COMMAND PARSING (FR-011, FR-012, FR-013)
When you hear a transaction request (deposit, swap, send, invest):
1. Immediately call the execute_guarded_command tool with userConfirmed=false
2. The tool will parse the action, amount, and target (converting "dot eth" to ".eth")
3. You will receive back the parsed command

## VERIFICATION LOOP (FR-020, FR-021, FR-022) - CRITICAL ENFORCEMENT
When execute_guarded_command is called with userConfirmed=false:
1. The tool will speak the verification prompt exactly
2. DO NOT proceed with any execution logic
3. WAIT for the user to respond with confirmation ("yes", "correct", "that's right")
4. ONLY when the user confirms, call execute_guarded_command again with userConfirmed=true
5. If the user says "no" or corrects you, ask for the right details and start over

This verification step is MANDATORY. Never skip it or assume confirmation.

## EXECUTION FLOW
When execute_guarded_command returns:
- PENDING_EXECUTION: Proceed to security scanning (ENS resolution, Kairo analysis)
- ABORTED: Explain WHY you cannot execute (vulnerability found)
- READY: Ask for final confirmation to execute

## VOICE PATTERNS
- Verification: Use the exact message from the tool (e.g., "I heard: deposit 1 ETH to vault.eth. Is that correct?")
- Abort: "I cannot execute this command. Kairo detected a critical re-entrancy vulnerability..."
- Ready: "The contract is secure. I am ready to deposit 1 ETH. Say 'execute' to proceed."
- Success: "Transaction submitted. Hash: 0x7a25..."`,

      // FR-011/012/013: Register stateful command parsing tool
      tools: {
        execute_guarded_command: executeGuardedCommandTool,
      },
    });

    // 4. Start Session using LiveKit Inference
    // We use string identifiers to leverage LiveKit's managed models
    const session = new voice.AgentSession<SessionState>({
      userData: { awaitingConfirmation: false, confirmed: false },
      stt: "assemblyai/universal-streaming:en",      // High accuracy transcription
      llm: "openai/gpt-4o-mini",                     // Fast reasoning
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc", // "Jacqueline" voice (Confident)
    });

    const confirmationPattern = /\b(yes|correct|that's right|that is right)\b/i;
    const rejectionPattern = /\b(no|nope|incorrect|not correct|cancel)\b/i;
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (!ev.isFinal) {
        return;
      }

      const state = session.userData;
      if (!state.awaitingConfirmation || !state.pendingCommand) {
        return;
      }

      if (rejectionPattern.test(ev.transcript)) {
        delete state.pendingCommand;
        state.awaitingConfirmation = false;
        state.confirmed = false;
        session.say("Okay. Please repeat the command with the correct details.", {
          addToChatCtx: true,
        });
        return;
      }

      if (confirmationPattern.test(ev.transcript)) {
        state.confirmed = true;
        state.awaitingConfirmation = false;
      }
    });

    // 5. Begin the voice session
    await session.start({
      room: ctx.room,
      agent,
      inputOptions: { participantIdentity: participant.identity },
    });

    // 6. Initial Greeting
    session.generateReply({
      instructions: "Greet the user as PYRA, their fiduciary crypto guardian. Keep it brief and professional.",
    });
  },
});

// Run the agent
cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
