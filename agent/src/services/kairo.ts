import { config } from '../config.js';

// FR-061: Strict Types
export type KairoDecision = "ALLOW" | "WARN" | "BLOCK" | "ESCALATE" | "OFFLINE";

export interface KairoResponse {
  decision: KairoDecision;
  decision_reason: string;
  summary: string;
  risk_score: number;
  isOffline?: boolean;
}

type KairoSummary = {
  total?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
};

function formatSummary(summary: unknown): string {
  if (!summary) {
    return '';
  }
  if (typeof summary === 'string') {
    return summary;
  }
  if (typeof summary === 'object') {
    const { total, critical, high, medium, low } = summary as KairoSummary;
    const parts = [
      total != null ? `total=${total}` : undefined,
      critical != null ? `critical=${critical}` : undefined,
      high != null ? `high=${high}` : undefined,
      medium != null ? `medium=${medium}` : undefined,
      low != null ? `low=${low}` : undefined,
    ].filter(Boolean);
    if (parts.length > 0) {
      return `Findings: ${parts.join(', ')}`;
    }
  }
  return '';
}

export async function analyzeWithKairo(sourceCode: string): Promise<KairoResponse> {
  console.log('[Kairo] Security layer engaged. Preparing contract analysis...');

  // FR-060: Real API Client Structure
  const kairoEndpoint = config.KAIRO_API_URL || "https://api.kairoaisec.com/v1/analyze";
  const apiKey = config.KAIRO_API_KEY;
  console.log(`[Kairo] Targeting API endpoint: ${kairoEndpoint} (api key ${apiKey ? "set" : "missing"})`);

  // For Hackathon: Simulate with keyword detection, but structure is production-ready
  if (!apiKey) {
    console.warn('[Kairo] No API Key. Running simulated vulnerability detection instead of live Kairo scan.');
    return simulateKairoAnalysis(sourceCode);
  }

  const start = Date.now();
  try {
    // FR-060: Production HTTP POST structure
    const response = await fetch(kairoEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        source: {
          type: 'inline',
          files: [{
            path: 'Contract.sol',
            content: sourceCode
          }]
        },
        config: {
          severity_threshold: config.KAIRO_SEVERITY_THRESHOLD ?? 'high',
          include_suggestions: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Kairo API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Kairo] API responded in ${Date.now() - start}ms with decision ${data.decision}`);
    const summary = formatSummary(data.summary) || data.decision_reason || 'Kairo analysis completed';
    return {
      decision: data.decision as KairoDecision,
      decision_reason: data.decision_reason,
      summary,
      risk_score: data.risk_score ?? 0
    };
  } catch (error) {
    console.error(`[Kairo] API Error after ${Date.now() - start}ms - Kairo is offline:`, error);
    return {
      decision: "OFFLINE",
      decision_reason: "Kairo security service is currently unavailable",
      summary: "Unable to connect to Kairo API",
      risk_score: 0,
      isOffline: true
    };
  }
}

/**
 * Hackathon Simulator: Keyword-based vulnerability detection
 * Returns the same strict KairoResponse type as production API
 */
function simulateKairoAnalysis(sourceCode: string): KairoResponse {
  // Check for known vulnerability patterns
  if (sourceCode.includes('VulnerableBank') || sourceCode.includes('.call{value:')) {
    return {
      decision: "BLOCK",
      decision_reason: "Critical re-entrancy vulnerability detected",
      summary: "CWE-841: Re-entrancy Attack",
      risk_score: 9.5
    };
  }

  if (sourceCode.includes('selfdestruct')) {
    return {
      decision: "BLOCK",
      decision_reason: "Dangerous self-destruct pattern detected",
      summary: "CWE-477: Dangerous Self-Destruct",
      risk_score: 8.0
    };
  }

  if (sourceCode.includes('delegatecall')) {
    return {
      decision: "WARN",
      decision_reason: "Unchecked delegatecall pattern",
      summary: "CWE-829: Unchecked Delegatecall",
      risk_score: 7.0
    };
  }

  if (sourceCode.includes('tx.origin')) {
    return {
      decision: "WARN",
      decision_reason: "Authorization via tx.origin",
      summary: "CWE-477: Authorization via tx.origin",
      risk_score: 6.0
    };
  }

  // No vulnerabilities detected
  return {
    decision: "ALLOW",
    decision_reason: "No critical vulnerabilities detected",
    summary: "Contract passed all security checks",
    risk_score: 1.0
  };
}
