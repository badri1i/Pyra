import { config } from '../config.js';

const BASE_URL = 'https://api-sepolia.etherscan.io/api'; // Default to Sepolia for testing

export interface ContractSource {
  verified: boolean;
  sourceCode: string;
  name: string;
}

export async function fetchContractSource(address: string): Promise<ContractSource> {
  // Simulator Bypass
  if (!config.ETHERSCAN_API_KEY) {
    console.warn("[Etherscan] No API Key. Simulating verified contract.");
    return { verified: true, sourceCode: "// Simulated Source", name: "SimulatedContract" };
  }

  const url = `${BASE_URL}?module=contract&action=getsourcecode&address=${address}&apikey=${config.ETHERSCAN_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1" && data.result[0]) {
      const result = data.result[0];
      // Etherscan returns "SourceCode": "" if not verified
      const isVerified = result.SourceCode !== "";

      return {
        verified: isVerified,
        sourceCode: result.SourceCode,
        name: result.ContractName
      };
    }

    return { verified: false, sourceCode: "", name: "Unknown" };
  } catch (e) {
    console.error("[Etherscan] API Error:", e);
    return { verified: false, sourceCode: "", name: "Error" };
  }
}
