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

  // FR-070: BLOCK - Immediate abort
  if (kairoResponse.decision === "BLOCK") {
    return {
      passed: false,
      message: `Kairo Security: BLOCKED - ${kairoResponse.summary}`,
      data: { vulnerability: kairoResponse.summary },
      kairoData: kairoResponse
    };
  }

  // FR-071: WARN/ESCALATE - Requires user acknowledgement
  if (kairoResponse.decision === "WARN" || kairoResponse.decision === "ESCALATE") {
    return {
      passed: false, // Don't proceed without user acknowledgement
      message: `Kairo Security: WARNING - ${kairoResponse.summary}. Risk Score: ${kairoResponse.risk_score}/10. ${kairoResponse.decision_reason}. Do you want to proceed anyway?`,
      data: {
        vulnerability: kairoResponse.summary,
        requiresAcknowledgement: true,
        warningDetails: kairoResponse
      },
      kairoData: kairoResponse
    };
  }

  // ALLOW - Proceed normally
  return {
    passed: true,
    message: `Kairo Security: ALLOWED - ${kairoResponse.decision_reason}`,
    data: {},
    kairoData: kairoResponse
  };
}
