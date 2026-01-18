import { llm } from '@livekit/agents';
import { z } from 'zod';
import { resolveEnsGate } from '../gates/ens.js';
import { validateAddressGate } from '../gates/validation.js';
import { sourceCheckGate } from '../gates/source.js';

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

    // Clear state immediately to prevent re-execution
    delete userData.pendingCommand;
    userData.awaitingConfirmation = false;
    userData.confirmed = false;

    console.log('[Tool] Executing SAVED command:', savedCommand);

    // Helper function to broadcast gate state updates
    const broadcastGateState = async (state: string, step: string, payload: any) => {
      const data = JSON.stringify({ type: "GATE_UPDATE", state, step, ...payload });
      await ctx.room.localParticipant?.publishData(
        new TextEncoder().encode(data),
        { reliable: true, topic: "agent-state" }
      );
    };

    // --- GATE 1: ENS RESOLUTION (FR-030 through FR-033) ---
    await broadcastGateState("RUNNING", "ENS", { target: savedCommand.target });

    // FR-033: Agent speaks "Resolving..."
    if (savedCommand.target.toLowerCase().endsWith('.eth')) {
      ctx.ctx.session.say(`Resolving ${savedCommand.target}...`, { addToChatCtx: true });
    }

    const ensResult = await resolveEnsGate(savedCommand.target);

    if (!ensResult.passed) {
      // FR-032: Broadcast failure to dashboard
      await broadcastGateState("FAILED", "ENS", { error: ensResult.message });
      ctx.ctx.session.say(ensResult.message, { addToChatCtx: true });
      return {
        status: "ABORTED",
        message: ensResult.message
      };
    }

    // Update target to the resolved address for future gates
    const resolvedAddress = ensResult.data?.address || savedCommand.target;
    await broadcastGateState("PASSED", "ENS", { resolved: resolvedAddress });

    // --- GATE 2: ADDRESS VALIDATION (FR-040) ---
    await broadcastGateState("RUNNING", "VALIDATION", {});

    const valResult = await validateAddressGate(resolvedAddress);

    if (!valResult.passed) {
      await broadcastGateState("FAILED", "VALIDATION", { error: valResult.message });
      ctx.ctx.session.say(valResult.message, { addToChatCtx: true });
      return {
        status: "ABORTED",
        message: valResult.message
      };
    }

    await broadcastGateState("PASSED", "VALIDATION", {});

    // --- GATE 3: SOURCE CHECK (FR-050, FR-052) ---
    await broadcastGateState("RUNNING", "SOURCE", {});

    const sourceResult = await sourceCheckGate(resolvedAddress);

    if (!sourceResult.passed) {
      await broadcastGateState("FAILED", "SOURCE", { error: sourceResult.message });
      ctx.ctx.session.say(sourceResult.message, { addToChatCtx: true });
      return {
        status: "ABORTED",
        message: sourceResult.message
      };
    }

    await broadcastGateState("PASSED", "SOURCE", { contract: sourceResult.message });

    // (Future: Gate 4 - FR-060 Kairo)

    // Placeholder Final Execution
    await broadcastGateState("EXECUTED", "TX", {
      action: savedCommand.action,
      amount: savedCommand.amount,
      target: resolvedAddress,
      txHash: "0xSIMULATED_HASH_123"
    });

    return {
      status: "SUCCESS",
      message: `Security checks passed. Source verified. Executing transaction to ${resolvedAddress}.`,
      parsedCommand: savedCommand,
    };
  },
});
