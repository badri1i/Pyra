import { fetchContractSource } from '../services/etherscan.js';
import type { GateResult } from './ens.js';

export async function sourceCheckGate(address: string): Promise<GateResult> {
  console.log(`[Gate:Source] Fetching source for ${address}...`);
  const start = Date.now();

  const source = await fetchContractSource(address);
  console.log(`[Gate:Source] Source fetch completed in ${Date.now() - start}ms`);

  if (!source.verified) {
    return {
      passed: false,
      message: "I cannot execute this command. Contract source is unavailable or unverified."
    };
  }

  return {
    passed: true,
    message: `Source verified: ${source.name}`,
    data: { sourceCode: source.sourceCode }
  };
}
