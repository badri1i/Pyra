import { ethers } from 'ethers';
import type { GateResult } from './ens.js'; // Re-use interface

export async function validateAddressGate(address: string): Promise<GateResult> {
  console.log(`[Gate:Validation] Checking ${address}...`);

  if (!ethers.isAddress(address)) {
    return {
      passed: false,
      message: `Invalid Ethereum address format: ${address}`
    };
  }

  return {
    passed: true,
    message: "Valid Ethereum address format."
  };
}
