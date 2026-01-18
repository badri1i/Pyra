import { llm } from '@livekit/agents';
import { z } from 'zod';
import { resolveEnsGate } from '../gates/ens.js';
import { validateAddressGate } from '../gates/validation.js';
import { sourceCheckGate } from '../gates/source.js';
import { kairoScanGate } from '../gates/kairo.js';

/**
 * FR-011: Command Intent Parsing
 * FR-012: Address Extraction
 * FR-013: "dot eth" normalization
 */

export interface PendingCommand {
  action: string;
  amount: string;
  target: string;
}

export interface SessionState {
  pendingCommand?: PendingCommand;
  awaitingConfirmation: boolean;
  confirmed: boolean;
  warningAcknowledged: boolean;
  kairoWarning?: any;
}

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

  warningAcknowledged: z.boolean({
    description:
      'Whether the user has acknowledged a Kairo security warning. ' +
      'Only set to true after user explicitly approves proceeding despite a warning.',
  }).default(false),
});

export type GuardedCommand = z.infer<typeof GuardedCommandSchema>;

/**
 * Stateful Guarded Command Tool with Kairo Security Integration
 * FR-060 through FR-072: Complete security gate implementation
 */
export const executeGuardedCommandTool = llm.tool({
  description: `Execute a crypto transaction with multi-gate security.
    1. userConfirmed=false: Save command and ask for verification
    2. userConfirmed=true: Execute security gates (ENS, Validation, Source, Kairo)
    3. If Kairo returns WARN: Ask user to acknowledge risk
    4. warningAcknowledged=true: Proceed with transaction despite warning`,
  parameters: GuardedCommandSchema,
  execute: async ({ action, amount, target, userConfirmed, warningAcknowledged }, ctx) => {
    const userData = ctx.ctx.userData as SessionState;

    console.log(`[Tool] Input: ${action} ${amount} -> ${target} (Confirmed: ${userConfirmed}, WarningAck: ${warningAcknowledged})`);

    // Helper to broadcast state updates
    const broadcast = async (type: string, payload: any) => {
      const data = JSON.stringify({ type, ...payload });
      await ctx.room.localParticipant?.publishData(
        new TextEncoder().encode(data),
        { reliable: true, topic: "agent-state" }
      );
    };

    // --- PHASE 1: INITIAL VERIFICATION ---
    if (!userConfirmed) {
      userData.pendingCommand = { action, amount, target };
      userData.awaitingConfirmation = true;
      userData.confirmed = false;
      userData.warningAcknowledged = false;

      console.log('[Tool] State Saved:', userData.pendingCommand);

      await broadcast("GATE_UPDATE", {
        state: "PENDING",
        step: "VERIFICATION",
        action,
        amount,
        target,
      });

      const verificationMessage = `I heard: ${action} ${amount} into ${target}. Is that correct?`;
      ctx.ctx.session.say(verificationMessage, { addToChatCtx: true });
      return undefined;
    }

    // --- PHASE 2: EXECUTE SECURITY GATES ---
    const savedCommand = userData.pendingCommand;

    if (!savedCommand || !userData.confirmed) {
      return {
        status: "ERROR",
        message: "Please confirm the command before proceeding."
      };
    }

    // --- GATE 1: ENS RESOLUTION ---
    await broadcast("GATE_UPDATE", { state: "RUNNING", step: "ENS", target: savedCommand.target });

    if (savedCommand.target.toLowerCase().endsWith('.eth')) {
      ctx.ctx.session.say(`Resolving ${savedCommand.target}...`, { addToChatCtx: true });
    }

    const ensResult = await resolveEnsGate(savedCommand.target);

    if (!ensResult.passed) {
      await broadcast("GATE_UPDATE", { state: "FAILED", step: "ENS", error: ensResult.message });
      ctx.ctx.session.say(ensResult.message, { addToChatCtx: true });
      return { status: "ABORTED", message: ensResult.message };
    }

    const resolvedAddress = ensResult.data?.address || savedCommand.target;
    await broadcast("GATE_UPDATE", { state: "PASSED", step: "ENS", resolved: resolvedAddress });

    // --- GATE 2: ADDRESS VALIDATION ---
    await broadcast("GATE_UPDATE", { state: "RUNNING", step: "VALIDATION" });

    const valResult = await validateAddressGate(resolvedAddress);

    if (!valResult.passed) {
      await broadcast("GATE_UPDATE", { state: "FAILED", step: "VALIDATION", error: valResult.message });
      ctx.ctx.session.say(valResult.message, { addToChatCtx: true });
      return { status: "ABORTED", message: valResult.message };
    }

    await broadcast("GATE_UPDATE", { state: "PASSED", step: "VALIDATION" });

    // --- GATE 3: SOURCE VERIFICATION ---
    await broadcast("GATE_UPDATE", { state: "RUNNING", step: "SOURCE" });

    const sourceResult = await sourceCheckGate(resolvedAddress);

    if (!sourceResult.passed) {
      await broadcast("GATE_UPDATE", { state: "FAILED", step: "SOURCE", error: sourceResult.message });
      ctx.ctx.session.say(sourceResult.message, { addToChatCtx: true });
      return { status: "ABORTED", message: sourceResult.message };
    }

    await broadcast("GATE_UPDATE", { state: "PASSED", step: "SOURCE", contract: sourceResult.message });

    // --- GATE 4: KAIRO SECURITY ANALYSIS ---
    await broadcast("GATE_UPDATE", { state: "RUNNING", step: "KAIRO" });

    const sourceCode = sourceResult.data?.sourceCode || "";
    const kairoResult = await kairoScanGate(sourceCode);

    // FR-062: Broadcast KAIRO_RESULT packet
    await broadcast("KAIRO_RESULT", {
      decision: kairoResult.kairoData.decision,
      reason: kairoResult.kairoData.decision_reason,
      summary: kairoResult.kairoData.summary,
      risk_score: kairoResult.kairoData.risk_score
    });

    // FR-070: BLOCK or WARN decision - immediate abort
    if (kairoResult.kairoData.decision === "BLOCK" || kairoResult.kairoData.decision === "WARN") {
      await broadcast("GATE_UPDATE", {
        state: "FAILED",
        step: "KAIRO",
        error: kairoResult.message,
        issues: [kairoResult.data.vulnerability]
      });

      // FR-072: Exact phrasing requirement
      const abortMessage = `I cannot execute this command. Kairo has detected ${kairoResult.data.vulnerability}. The transaction has been aborted to protect your funds.`;
      ctx.ctx.session.say(abortMessage, { addToChatCtx: true });

      return {
        status: "ABORTED",
        message: abortMessage
      };
    }
    // FR-071: ALLOW decision - proceed
    await broadcast("GATE_UPDATE", { state: "PASSED", step: "KAIRO", reason: kairoResult.message });

    // --- PHASE 3: TRANSACTION EXECUTION ---
    // Placeholder for actual transaction execution
    await broadcast("GATE_UPDATE", {
      state: "EXECUTED",
      step: "TX",
      action: savedCommand.action,
      amount: savedCommand.amount,
      target: resolvedAddress,
      txHash: "0xSIMULATED_HASH_" + Date.now().toString(16)
    });

    // Clear state
    delete userData.pendingCommand;
    userData.awaitingConfirmation = false;
    userData.confirmed = false;
    userData.warningAcknowledged = false;

    return {
      status: "SUCCESS",
      message: `Security checks passed. Transaction executed to ${resolvedAddress}.`,
      parsedCommand: savedCommand,
    };
  },
});
