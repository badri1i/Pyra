import { llm } from '@livekit/agents';
import { getAgentWallet } from '../services/wallet.js';

export const getWalletInfoTool = llm.tool({
  description:
    'Explain the difference between the agent wallet and a browser wallet, and return the agent wallet address.',
  parameters: {},
  execute: async (_input, ctx) => {
    const agentWallet = getAgentWallet();
    const message =
      `Agent wallet address: ${agentWallet.address}. ` +
      'This is the server-side wallet the agent can sign with. ' +
      'Your browser wallet (e.g. MetaMask) is separate and controlled by you. ' +
      'To fund the agent wallet, send funds to the address above from your browser wallet.';
    ctx.ctx.session.say(message, { addToChatCtx: true });
    return { status: 'OK', address: agentWallet.address };
  },
});
