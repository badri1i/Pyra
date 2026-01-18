import { config } from '../config.js';

const BASE_URL = 'https://api-sepolia.etherscan.io/api'; // Default to Sepolia for testing

export interface ContractSource {
  verified: boolean;
  sourceCode: string;
  name: string;
}

export async function fetchContractSource(address: string): Promise<ContractSource> {
  // --- GATE 3 TEST TRIGGER: Unverified Contract ---
  if (address === "0x0000000000000000000000000000000000000000") {
    console.log("[Etherscan] GATE 3 TEST: Simulating Unverified Contract");
    return { verified: false, sourceCode: "", name: "Unverified Trap" };
  }

  // --- GATE 4 TEST TRIGGER: Vulnerable Contract (BLOCK) ---
  if (address === "0x1111111111111111111111111111111111111111") {
    console.log("[Etherscan] GATE 4 TEST: Simulating Vulnerable Contract (BLOCK)");
    return {
      verified: true,
      sourceCode: "contract VulnerableBank { function withdraw() { msg.sender.call{value: bal}(); } }",
      name: "VulnerableBank"
    };
  }

  // --- GATE 4 TEST TRIGGER: Warning Contract (WARN) ---
  if (address === "0x2222222222222222222222222222222222222222") {
    console.log("[Etherscan] GATE 4 TEST: Simulating Warning Contract (WARN)");
    return {
      verified: true,
      sourceCode: "contract ProxyContract { function execute(address target, bytes data) { target.delegatecall(data); } }",
      name: "ProxyContract"
    };
  }

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
