import { fetchContractSource } from '../services/etherscan.js';
import { GateResult } from './ens.js';

export async function sourceCheckGate(address: string): Promise<GateResult> {
  console.log(`[Gate:Source] Fetching source for ${address}...`);

  const source = await fetchContractSource(address);

  if (!source.verified) {
    return {
      passed: false,
      message: "I cannot execute this command. This contract's source code is not verified."
    };
  }

  return {
    passed: true,
    message: `Source verified: ${source.name}`,
    data: { sourceCode: source.sourceCode }
  };
}
