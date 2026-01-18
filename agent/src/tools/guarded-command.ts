import { llm } from '@livekit/agents';
import { z } from 'zod';
import { resolveEnsGate } from '../gates/ens.js';
import { validateAddressGate } from '../gates/validation.js';
import { sourceCheckGate } from '../gates/source.js';
import { kairoScanGate } from '../gates/kairo.js';
import { sendTransaction } from '../services/wallet.js';

/**
 * FR-011: Command Intent Parsing
 * FR-012: Address Extraction
 * FR-013: "dot eth" normalization
 */

export interface PendingCommand {
  action: string;
  amount: string;
  target: string;
  securityChecksPassed?: boolean;
  finalAddress?: string; // Store resolved address after security checks
}

export interface SessionState {
  pendingCommand?: PendingCommand;
  awaitingConfirmation: boolean;
  confirmed: boolean;
  warningAcknowledged: boolean;
  kairoWarning?: any;
  room?: any; // LiveKit Room instance
}

export const GuardedCommandSchema = z.object({
  step: z.enum(['verify', 'check', 'execute']).describe(
    'The current stage of the command flow. ' +
    'verify: Initial command verification (user speaks command). ' +
    'check: Run security checks (user says "yes" to verification). ' +
    'execute: Execute transaction (user says "execute" after checks pass).'
  ),

  action: z.enum(['deposit', 'swap', 'send', 'invest']).describe(
    'The transaction action the user wants to perform'
  ),

  amount: z.string().describe(
    'The amount with denomination (e.g., "1 ETH", "500 USDC", "0.5 WBTC")'
  ),

  target: z.string().describe(
    'The target contract address (0x...) or ENS name. ' +
    'CRITICAL ENS CONVERSION RULES: ' +
    '1. Replace " dot eth" with ".eth" ' +
    '2. Replace spaces with hyphens (e.g., "my vault" → "my-vault") ' +
    '3. Convert to lowercase ' +
    'Examples: ' +
    '"vitalik dot eth" → "vitalik.eth" | ' +
    '"my vault dot eth" → "my-vault.eth" | ' +
    '"Uniswap Dot Eth" → "uniswap.eth" | ' +
    '"0x123..." → "0x123..." (keep addresses as-is)'
  ),
});

export type GuardedCommand = z.infer<typeof GuardedCommandSchema>;

/**
 * Stateful Guarded Command Tool with Kairo Security Integration
 * FR-060 through FR-086: Complete security gate implementation with explicit 3-stage execution
 */
export const executeGuardedCommandTool = llm.tool({
  description: `Execute a crypto transaction with multi-gate security (explicit 3-step flow).
    This tool has a strict 3-step lifecycle. You must call it with the correct 'step' based on user input.

    Steps:
    1. 'verify': Call this INITIALLY when user speaks a command. Returns: "I heard... Correct?"
    2. 'check': Call this when user says "Yes/Correct". Runs security checks. Returns: "Secure. Say execute."
    3. 'execute': Call this when user says "Execute/Proceed". Runs transaction.`,
  parameters: GuardedCommandSchema,
  execute: async ({ step, action, amount, target }, ctx) => {
    const userData = ctx.ctx.userData as SessionState;

    console.log(`[Tool] Step: ${step}, Action: ${action} ${amount} -> ${target}`);

    // Helper to broadcast state updates
    const broadcast = async (type: string, payload: any) => {
      if (!userData.room) return; // Room not available
      const data = JSON.stringify({ type, ...payload });
      await userData.room.localParticipant?.publishData(
        new TextEncoder().encode(data),
        { reliable: true, topic: "agent-state" }
      );
    };

    // --- STEP 1: VERIFY (Input Confirmation) ---
    if (step === 'verify') {
      userData.pendingCommand = { action, amount, target, securityChecksPassed: false };
      userData.awaitingConfirmation = true;
      userData.confirmed = false;
      userData.warningAcknowledged = false;

      console.log('[Tool] Step 1 (Verify) - State Saved:', userData.pendingCommand);

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

    // Load State
    const savedCommand = userData.pendingCommand;

    if (!savedCommand) {
      return {
        status: "ERROR",
        message: "No pending command. Please start over."
      };
    }

    // --- STEP 2: CHECK (Security Gates) ---
    if (step === 'check') {
      console.log('[Tool] Step 2 (Check) - Running Security Gates');

      // --- GATE 1: ENS RESOLUTION ---
      await broadcast("GATE_UPDATE", { state: "RUNNING", step: "ENS", target: savedCommand.target });

      if (savedCommand.target.toLowerCase().endsWith('.eth')) {
        ctx.ctx.session.say(`Resolving ${savedCommand.target}...`, { addToChatCtx: true });
      }

      const ensResult = await resolveEnsGate(savedCommand.target);

      if (!ensResult.passed) {
        await broadcast("GATE_UPDATE", { state: "FAILED", step: "ENS", error: ensResult.message });
        ctx.ctx.session.say(ensResult.message, { addToChatCtx: true });
        delete userData.pendingCommand;
        return { status: "ABORTED", message: ensResult.message };
      }

      const resolvedAddress = ensResult.data?.address || savedCommand.target;
      savedCommand.finalAddress = resolvedAddress;
      await broadcast("GATE_UPDATE", { state: "PASSED", step: "ENS", resolved: resolvedAddress });

      // --- GATE 2: ADDRESS VALIDATION ---
      await broadcast("GATE_UPDATE", { state: "RUNNING", step: "VALIDATION" });

      const valResult = await validateAddressGate(resolvedAddress);

      if (!valResult.passed) {
        await broadcast("GATE_UPDATE", { state: "FAILED", step: "VALIDATION", error: valResult.message });
        ctx.ctx.session.say(valResult.message, { addToChatCtx: true });
        delete userData.pendingCommand;
        return { status: "ABORTED", message: valResult.message };
      }

      await broadcast("GATE_UPDATE", { state: "PASSED", step: "VALIDATION" });

      // --- GATE 3: SOURCE VERIFICATION ---
      await broadcast("GATE_UPDATE", { state: "RUNNING", step: "SOURCE" });

      const sourceResult = await sourceCheckGate(resolvedAddress);

      if (!sourceResult.passed) {
        await broadcast("GATE_UPDATE", { state: "FAILED", step: "SOURCE", error: sourceResult.message });
        ctx.ctx.session.say(sourceResult.message, { addToChatCtx: true });
        delete userData.pendingCommand;
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

        // Clear state on failure
        delete userData.pendingCommand;
        userData.awaitingConfirmation = false;
        userData.confirmed = false;

        return {
          status: "ABORTED",
          message: abortMessage
        };
      }

      // FR-071: ALLOW decision - proceed
      await broadcast("GATE_UPDATE", { state: "PASSED", step: "KAIRO", reason: kairoResult.message });

      // SECURITY CHECKS PASSED - SAVE STATE AND WAIT FOR EXECUTION CONFIRMATION
      savedCommand.securityChecksPassed = true;

      console.log('[Tool] Step 2 Complete - Security checks passed, awaiting execution confirmation');

      // FR-073: Exact phrasing requirement
      const confirmationMessage = `The contract is secure. I am ready to ${savedCommand.action} ${savedCommand.amount}. Please confirm by saying 'execute' or 'proceed'.`;
      ctx.ctx.session.say(confirmationMessage, { addToChatCtx: true });

      return {
        status: "CHECKS_PASSED",
        message: confirmationMessage
      };
    }

    // --- STEP 3: EXECUTE (Transaction) ---
    // FR-081: Explicitly requires 'execute' step and prior checks
    if (step === 'execute') {
      if (!savedCommand.securityChecksPassed || !savedCommand.finalAddress) {
        return {
          status: "ERROR",
          message: "Security checks not passed yet. Please confirm checks first."
        };
      }

      console.log('[Tool] Step 3 (Execute) - Executing Transaction');

      await broadcast("GATE_UPDATE", { state: "RUNNING", step: "TX" });

      // Extract numeric amount
      const numericAmount = savedCommand.amount.replace(/[^0-9.]/g, '');

      // FR-084: Execute transaction
      const tx = await sendTransaction(savedCommand.finalAddress, numericAmount);

      // FR-084: Format hash to first 8 characters (e.g., "0x123456")
      const shortHash = tx.hash.slice(0, 8);

      // FR-085: Success State
      await broadcast("GATE_UPDATE", {
        state: "SUCCESS",
        step: "TX",
        hash: tx.hash,
        simulated: tx.simulated,
        action: savedCommand.action,
        amount: savedCommand.amount,
        target: savedCommand.finalAddress
      });

      // Clear state
      delete userData.pendingCommand;
      userData.awaitingConfirmation = false;
      userData.confirmed = false;
      userData.warningAcknowledged = false;

      // FR-084: Audio Response with exact hash format
      const executionMessage = `Executing transaction... Transaction submitted. Hash: ${shortHash}...`;
      ctx.ctx.session.say(executionMessage, { addToChatCtx: true });

      return {
        status: "SUCCESS",
        message: executionMessage,
        txHash: tx.hash,
        simulated: tx.simulated
      };
    }

    return {
      status: "ERROR",
      message: "Invalid step. Please start over."
    };
  },
});
