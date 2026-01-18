import { config } from '../config.js';
import { analyzeWithKairo } from './kairo.js';
import { checkEtherscanHealth } from './etherscan.js';
import { logWalletHealth, provider } from './wallet.js';

export async function runStartupHealthChecks() {
  console.log('[Health] Running startup connectivity checks...');

  const rpcStart = Date.now();
  try {
    const [network, blockNumber] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
    ]);
    console.log(`[Health] RPC reachable in ${Date.now() - rpcStart}ms (chainId ${network.chainId}, block ${blockNumber})`);
  } catch (error) {
    console.error(`[Health] RPC check failed after ${Date.now() - rpcStart}ms:`, error);
  }

  await logWalletHealth();

  await checkEtherscanHealth();

  if (config.KAIRO_API_KEY) {
    const kairoStart = Date.now();
    const kairoResult = await analyzeWithKairo('contract Ping { function noop() public {} }');
    console.log(`[Health] Kairo check completed in ${Date.now() - kairoStart}ms with decision ${kairoResult.decision}`);
  } else {
    console.warn('[Health] Kairo API key missing. Skipping live Kairo check.');
  }
}
