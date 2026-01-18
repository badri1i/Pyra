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

    // 3. Define the Agent Identity
    const agent = new voice.Agent({
      instructions: `You are PYRA, a fiduciary voice agent for crypto transactions.
      
      YOUR PRIME DIRECTIVE: Protect user capital at all costs.
      
      1. You are a GUARDIAN, not a chatbot.
      2. You DO NOT execute commands blindly.
      3. You MUST verify commands with the user ("I heard [action] [amount] to [target], correct?") before proceeding.
      4. You MUST run security checks on contracts before executing.
      
      If a user asks to do something, acknowledge the command and start the verification loop.`,
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
