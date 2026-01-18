import { ethers } from 'ethers';
import { config } from '../config.js';

// FR-005: Initialize Provider
export const provider = new ethers.JsonRpcProvider(config.RPC_URL, config.CHAIN_ID);

// FR-006: Initialize Wallet
let wallet: ethers.Wallet | null = null;

if (config.AGENT_PRIVATE_KEY) {
  wallet = new ethers.Wallet(config.AGENT_PRIVATE_KEY, provider);
  console.log(`[Wallet] Initialized agent wallet: ${wallet.address}`);
} else {
  console.warn('[Wallet] No private key provided. Transaction features will be disabled.');
}

export const getAgentWallet = () => {
  if (!wallet) throw new Error("Agent wallet not initialized. Check AGENT_PRIVATE_KEY.");
  return wallet;
};

export const getBalance = async (address: string): Promise<string> => {
  const bal = await provider.getBalance(address);
  return ethers.formatEther(bal);
};

// FR-083, FR-084: Transaction execution with simulation support
export const sendTransaction = async (to: string, amountInEth: string): Promise<{ hash: string; simulated: boolean }> => {
  // FR-083: Implement Simulation Logic
  if (config.SIMULATE_TRANSACTIONS === true || !wallet) {
    console.log(`[Wallet] 🛡️ SIMULATION MODE: Sending ${amountInEth} ETH -> ${to}`);

    // Fake network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate fake hash
    const fakeHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

    return {
      hash: fakeHash,
      simulated: true
    };
  }

  // Real Execution
  console.log(`[Wallet] 💸 REAL TRANSACTION: Sending ${amountInEth} ETH -> ${to}`);
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.parseEther(amountInEth)
  });

  await tx.wait();
  console.log(`[Wallet] Transaction confirmed: ${tx.hash}`);

  return { hash: tx.hash, simulated: false };
};
