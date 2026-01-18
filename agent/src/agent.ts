import { type JobContext, WorkerOptions, cli, defineAgent, voice } from '@livekit/agents';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { executeGuardedCommandTool, type SessionState } from './tools/guarded-command.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();

    const userData: SessionState = {
      awaitingConfirmation: false,
      confirmed: false,
      warningAcknowledged: false,
      room: ctx.room // Store room for tool access
    };
    ctx.userData = userData;

    const participant = await ctx.waitForParticipant();

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

      **STEP 3: EXECUTE (Transaction Execution)**
      When user says "Execute" or "Proceed" (ONLY after security checks have passed):
      - Call 'execute_guarded_command' with step='execute'
      - The tool will execute the transaction
      - Speak the transaction hash message returned by the tool

      **CRITICAL RULES:**
      - Always use the correct 'step' parameter based on user input
      - Never skip steps
      - Never execute without explicit "execute" or "proceed" confirmation
      - If user says "No" at any stage, reset and ask for a new command`,

      tools: {
        execute_guarded_command: executeGuardedCommandTool
      }
    });

    const session = new voice.AgentSession({
      stt: "assemblyai/universal-streaming:en",
      llm: "openai/gpt-4o-mini",
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
      userData: userData, // Pass userData to the session
    });

    await session.start({
        room: ctx.room,
        agent: agent,
        inputOptions: { participantIdentity: participant.identity }
    });

    session.generateReply({
      instructions: "Greet the user and ask for a command.",
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
