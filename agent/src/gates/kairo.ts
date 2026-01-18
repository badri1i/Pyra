import { analyzeWithKairo } from '../services/kairo.js';
import type { KairoResponse } from '../services/kairo.js';
import type { GateResult } from './ens.js';

/**
 * FR-060/061: Kairo Security Gate (Gate 4)
 * FR-070/071: System must ABORT on BLOCK, require acknowledgement on WARN, ALLOW on ALLOW
 * FR-072: Agent must speak exact vulnerability details
 */
export async function kairoScanGate(sourceCode: string): Promise<GateResult & { kairoData: KairoResponse }> {
  console.log(`[Gate:Kairo] Running security analysis...`);

  const kairoResponse = await analyzeWithKairo(sourceCode);
  const summaryParts = [
    kairoResponse.decision_reason,
    kairoResponse.summary,
  ].filter((part) => part && part.trim() !== '');
  const conciseReason = summaryParts.length > 0
    ? `${summaryParts.join(' | ')}${kairoResponse.risk_score ? ` (risk ${kairoResponse.risk_score}/10)` : ''}`
    : 'Security analysis complete';

  // FR-070: BLOCK - Immediate abort
  if (kairoResponse.decision === "BLOCK") {
    return {
      passed: false,
      message: `Kairo Security: BLOCKED - ${conciseReason}`,
      data: { vulnerability: conciseReason },
      kairoData: kairoResponse
    };
  }

  // FR-071: WARN/ESCALATE - Requires user acknowledgement
  if (kairoResponse.decision === "WARN" || kairoResponse.decision === "ESCALATE") {
    return {
      passed: false, // Don't proceed without user acknowledgement
      message: `Kairo Security: WARNING - ${conciseReason}. Do you want to proceed anyway?`,
      data: {
        vulnerability: conciseReason,
        requiresAcknowledgement: true,
        warningDetails: kairoResponse
      },
      kairoData: kairoResponse
    };
  }

  // ALLOW - Proceed normally
  return {
    passed: true,
    message: `Kairo Security: ALLOWED - ${conciseReason}`,
    data: {},
    kairoData: kairoResponse
  };
}
