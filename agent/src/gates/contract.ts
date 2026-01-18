import { provider } from "../services/wallet.js";
import type { GateResult } from "./ens.js";

export async function contractDetectionGate(address: string): Promise<GateResult> {
  const code = await provider.getCode(address);
  const isContract = code && code !== "0x";

  if (!isContract) {
    return {
      passed: true,
      message: "Target is an EOA (no contract code). Skipping source + Kairo.",
      data: { addressType: "EOA" }
    };
  }

  return {
    passed: true,
    message: "Target is a contract. Continuing to source verification.",
    data: { addressType: "CONTRACT" }
  };
}
