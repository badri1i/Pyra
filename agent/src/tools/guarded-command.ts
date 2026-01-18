import { llm } from '@livekit/agents';
import { z } from 'zod';

/**
 * FR-011: Command Intent Parsing
 * FR-012: Address Extraction
 * FR-013: "dot eth" normalization
 *
 * This schema leverages LLM Function Calling to parse voice transcripts
 * into structured crypto commands, eliminating fragile regex parsing.
 */

// Define the shape of our pending command for state storage
export interface PendingCommand {
  action: string;
  amount: string;
  target: string;
}

export interface SessionState {
  pendingCommand?: PendingCommand;
  awaitingConfirmation: boolean;
  confirmed: boolean;
}

// Define the Zod schema for a guarded command
export const GuardedCommandSchema = z.object({
  action: z.enum(['deposit', 'swap', 'send', 'invest'], {
    description: 'The transaction action the user wants to perform',
  }),

  amount: z.string({
    description: 'The amount with denomination (e.g., "1 ETH", "500 USDC", "0.5 WBTC")',
  }),

  target: z.string({
    description:
      'The target contract address (0x...) or ENS name. ' +
      'CRITICAL: Convert spoken "dot eth" to actual ".eth" extension. ' +
      'Example: "my vault dot eth" → "my-vault.eth", "vitalik dot eth" → "vitalik.eth"',
  }),

  userConfirmed: z.boolean({
    description:
      'Whether the user has confirmed this command. ' +
      'MUST be false initially. Only set to true after explicit user confirmation.',
  }).default(false),
});

// Type inference from schema
export type GuardedCommand = z.infer<typeof GuardedCommandSchema>;

/**
 * Stateful Guarded Command Tool
 * FR-020 through FR-023: Robust Verification with State Management
 *
 * Flow:
 * 1. userConfirmed=false: Save command to ctx.userData.pendingCommand
 * 2. userConfirmed=true: Retrieve and execute saved command
 *
 * This prevents the LLM from hallucinating parameters during verification.
 */
export const executeGuardedCommandTool = llm.tool({
  description: `Execute a crypto transaction with stateful verification.
    If userConfirmed is false, this tool SAVES the command and SPEAKS a verification prompt.
    If userConfirmed is true, this tool EXECUTES the saved command.

    You must call this with userConfirmed=false first.
    Only call with userConfirmed=true after the user says "Yes".`,
  parameters: GuardedCommandSchema,
  execute: async ({ action, amount, target, userConfirmed }, ctx) => {
    const userData = ctx.ctx.userData as SessionState;

    console.log(`[Tool] Input: ${action} ${amount} -> ${target} (Confirmed: ${userConfirmed})`);

    // --- CASE 1: INITIAL REQUEST (Pending Verification) ---
    if (!userConfirmed) {
      // STATEFUL SAVE: Lock in the parameters so the LLM can't hallucinate them later
      userData.pendingCommand = { action, amount, target };
      userData.awaitingConfirmation = true;
      userData.confirmed = false;

      console.log('[Tool] State Saved:', userData.pendingCommand);

      // FR-024: Broadcast state to Dashboard
      const payload = JSON.stringify({
        state: "PENDING_VERIFICATION",
        action,
        amount,
        target,
      });
      await ctx.room.localParticipant?.publishData(
        new TextEncoder().encode(payload),
        { topic: "agent-state" }
      );

      const verificationMessage = `I heard: ${action} ${amount} into ${target}. Is that correct?`;
      ctx.ctx.session.say(verificationMessage, { addToChatCtx: true });
      return undefined;
    }

    // --- CASE 2: EXECUTION (Post Verification) ---
    // Retrieve the locked-in command
    const savedCommand = userData.pendingCommand;

    // Safety Check: Did we actually have a pending command?
    if (!savedCommand || !userData.confirmed) {
      return {
        status: "ERROR",
        message: "Please confirm the command before proceeding."
      };
    }

    // Verify the parameters match (Optional safety check)
    console.log('[Tool] Executing SAVED command:', savedCommand);

    // FR-024: Broadcast execution state to Dashboard
    const payload = JSON.stringify({
      state: "EXECUTED",
      action: savedCommand.action,
      amount: savedCommand.amount,
      target: savedCommand.target,
      txHash: "0xSIMULATED", // Placeholder for now
    });
    await ctx.room.localParticipant?.publishData(
      new TextEncoder().encode(payload),
      { topic: "agent-state" }
    );

    // Clear state so we don't accidentally re-execute later
    delete userData.pendingCommand;
    userData.awaitingConfirmation = false;
    userData.confirmed = false;

    // --- FR-020: Verification Loop - State 3 (Confirmed) ---
    // User has explicitly confirmed, proceed to Gate 1 (ENS Resolution)
    // Placeholder for future integration with Kairo security scanner
    // This will be implemented in FR-014 through FR-019
    return {
      status: "PENDING_EXECUTION",
      message: `User confirmed. Ready to initiate ENS resolution and security analysis for: ${savedCommand.action} ${savedCommand.amount} to ${savedCommand.target}`,
      parsedCommand: savedCommand,
    };
  },
});
