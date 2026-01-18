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
