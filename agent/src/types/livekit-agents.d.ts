import type { SessionState } from '../tools/guarded-command.js';

declare module '@livekit/agents' {
  interface JobContext {
    userData: SessionState;
  }
}
