import { ethers } from 'ethers';
import { config } from '../config.js';

// FR-005: Initialize Provider
export const provider = new ethers.JsonRpcProvider(config.RPC_URL, config.CHAIN_ID);

// FR-006: Initialize Wallet
let wallet: ethers.Wallet | null = null;
let walletStatusLogged = false;

if (config.AGENT_PRIVATE_KEY) {
  wallet = new ethers.Wallet(config.AGENT_PRIVATE_KEY, provider);
  console.log(`[Wallet] Initialized agent wallet: ${wallet.address}`);
} else {
  console.warn('[Wallet] No private key provided. Transaction features will be disabled.');
}

const logWalletStatus = async (context: string) => {
  if (!wallet || walletStatusLogged) return;

  const start = Date.now();
  try {
    const network = await provider.getNetwork();
    const balance = await provider.getBalance(wallet.address);
    const elapsed = Date.now() - start;
    console.log(`[Wallet] RPC connected (${context}) in ${elapsed}ms via ${config.RPC_URL} (chainId ${network.chainId})`);
    console.log(`[Wallet] Balance for ${wallet.address}: ${ethers.formatEther(balance)} ETH`);
    walletStatusLogged = true;
  } catch (error) {
    console.error(`[Wallet] RPC connection failed (${context}):`, error);
  }
};

export const logWalletHealth = async () => {
  await logWalletStatus('startup');
};

export const getAgentWallet = () => {
  if (!wallet) throw new Error("Agent wallet not initialized. Check AGENT_PRIVATE_KEY.");
  return wallet;
};

export const getBalance = async (address: string): Promise<string> => {
  await logWalletStatus('getBalance');
  const start = Date.now();
  const bal = await provider.getBalance(address);
  console.log(`[Wallet] Balance lookup for ${address} took ${Date.now() - start}ms`);
  return ethers.formatEther(bal);
};

// FR-083, FR-084: Transaction execution with simulation support
export const sendTransaction = async (to: string, amountInEth: string): Promise<{ hash: string; simulated: boolean }> => {
  await logWalletStatus('sendTransaction');

  // FR-083: Implement Simulation Logic
  if (config.SIMULATE_TRANSACTIONS === true || !wallet) {
    const reason = !wallet ? 'no wallet available' : 'SIMULATE_TRANSACTIONS=true';
    console.log(`[Wallet] 🛡️ SIMULATION MODE (${reason}): Sending ${amountInEth} ETH -> ${to}`);

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
  const start = Date.now();
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.parseEther(amountInEth)
  });
  console.log(`[Wallet] Transaction submitted in ${Date.now() - start}ms: ${tx.hash}`);

  const confirmationStart = Date.now();
  await tx.wait();
  console.log(`[Wallet] Transaction confirmed in ${Date.now() - confirmationStart}ms: ${tx.hash}`);

  return { hash: tx.hash, simulated: false };
};
