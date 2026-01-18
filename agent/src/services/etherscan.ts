import { config } from '../config.js';

const BASE_URL = 'https://api.etherscan.io/v2/api'; // Etherscan API v2

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

  const url = `${BASE_URL}?chainid=${config.CHAIN_ID}&module=contract&action=getsourcecode&address=${address}&apikey=${config.ETHERSCAN_API_KEY}`;

  const start = Date.now();
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`[Etherscan] API responded in ${Date.now() - start}ms for ${address}`);

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
    console.error(`[Etherscan] API Error after ${Date.now() - start}ms:`, e);
    return { verified: false, sourceCode: "", name: "Error" };
  }
}

export async function checkEtherscanHealth(): Promise<void> {
  if (!config.ETHERSCAN_API_KEY) {
    console.warn('[Etherscan] No API Key. Skipping Etherscan health check.');
    return;
  }

  const url = `${BASE_URL}?chainid=${config.CHAIN_ID}&module=stats&action=ethprice&apikey=${config.ETHERSCAN_API_KEY}`;
  const start = Date.now();

  try {
    const response = await fetch(url);
    const data = await response.json();
    const ok = response.ok && data?.status === "1";
    if (ok) {
      console.log(`[Etherscan] Health check ok in ${Date.now() - start}ms`);
    } else {
      console.warn(`[Etherscan] Health check failed in ${Date.now() - start}ms (status ${response.status})`, data);
    }
  } catch (error) {
    console.error(`[Etherscan] Health check error after ${Date.now() - start}ms:`, error);
  }
}
