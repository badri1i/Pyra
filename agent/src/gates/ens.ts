import { provider } from '../services/wallet.js';

/**
 * FR-030/031: ENS Resolution Gate
 *
 * This gate checks if a target is an ENS name and resolves it to an address.
 * If resolution fails, the transaction is blocked.
 */

export interface GateResult {
  passed: boolean;
  message: string;
  data?: any;
}

/**
 * Resolves ENS names to Ethereum addresses
 * FR-030: Detect .eth names
 * FR-031: Resolve using ethers provider
 * FR-034: Handle resolution failures
 */
export async function resolveEnsGate(target: string): Promise<GateResult> {
  // 1. Check format (FR-030)
  if (!target.toLowerCase().endsWith('.eth')) {
    return {
      passed: true,
      message: "Target is not an ENS name.",
      data: { address: target }
    };
  }

  console.log(`[Gate:ENS] Resolving ${target}...`);
  const start = Date.now();

  try {
    // 2. Resolve Name (FR-031)
    const address = await provider.resolveName(target);

    if (!address) {
      // FR-034: Handle failure
      return {
        passed: false,
        message: `ENS Resolution Failed: Could not find address for ${target}`
      };
    }

    console.log(`[Gate:ENS] Resolved to ${address} in ${Date.now() - start}ms`);

    return {
      passed: true,
      message: `Resolved ${target} to ${address.slice(0, 6)}...${address.slice(-4)}`,
      data: { address }
    };

  } catch (error) {
    console.error(`[Gate:ENS] Error after ${Date.now() - start}ms:`, error);
    return {
      passed: false,
      message: `ENS Resolution Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
