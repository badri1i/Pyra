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

    const userData: SessionState = { awaitingConfirmation: false, confirmed: false, warningAcknowledged: false };
    ctx.userData = userData;

    const participant = await ctx.waitForParticipant();

    const agent = new voice.Agent({
      instructions: `You are PYRA.
      
      PROTOCOL:
      1. User speaks command.
      2. Call 'execute_guarded_command' with userConfirmed=false.
      3. Speak the returned message ("I heard... Is that correct?").
      4. Wait for user input.
      5. If user says "Yes":
         - **FR-033: FIRST say "Confirmed. Resolving name and running security checks..."**
         - THEN Call 'execute_guarded_command' with userConfirmed=true.
      6. If user says "No", ask for the command again.`,
      
      tools: {
        execute_guarded_command: executeGuardedCommandTool
      }
    });

    const session = new voice.AgentSession({
      stt: "assemblyai/universal-streaming:en",      
      llm: "openai/gpt-4o-mini",                     
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc", 
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
