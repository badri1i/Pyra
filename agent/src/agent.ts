import { type JobContext, WorkerOptions, cli, defineAgent, voice } from '@livekit/agents';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables from .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

export default defineAgent({
  entry: async (ctx: JobContext) => {
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
- Success: "Transaction submitted. Hash: 0x7a25..."`,
    });

    // 4. Start Session using LiveKit Inference
    // We use string identifiers to leverage LiveKit's managed models
    const session = new voice.AgentSession({
      stt: "assemblyai/universal-streaming:en",      // High accuracy transcription
      llm: "openai/gpt-4o-mini",                     // Fast reasoning
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc", // "Jacqueline" voice (Confident)
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
