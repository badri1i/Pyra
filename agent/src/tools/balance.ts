import { llm } from '@livekit/agents';
import { z } from 'zod';
import { resolveEnsGate } from '../gates/ens.js';
import { getAgentWallet, getBalance } from '../services/wallet.js';

const BalanceSchema = z.object({
  target: z
    .string()
    .optional()
    .describe(
      'Wallet address or ENS name to check. If omitted, check the agent wallet address.',
    ),
});

export const getBalanceTool = llm.tool({
  description:
    'Look up the ETH balance for a wallet address or ENS name. If target is omitted, return the agent wallet balance.',
  parameters: BalanceSchema,
  execute: async ({ target }, ctx) => {
    let address = target?.trim();

    if (!address) {
      const agentWallet = getAgentWallet();
      const balance = await getBalance(agentWallet.address);
      const message = `Agent wallet ${agentWallet.address} balance: ${balance} ETH.`;
      ctx.ctx.session.say(message, { addToChatCtx: true });
      return { status: 'OK', address: agentWallet.address, balance };
    }

    if (address.toLowerCase().endsWith('.eth')) {
      const ensResult = await resolveEnsGate(address);
      if (!ensResult.passed || !ensResult.data?.address) {
        const message = ensResult.message || 'Unable to resolve ENS name.';
        ctx.ctx.session.say(message, { addToChatCtx: true });
        return { status: 'ERROR', message };
      }
      address = ensResult.data.address;
    }

    const balance = await getBalance(address);
    const message = `Balance for ${address}: ${balance} ETH.`;
    ctx.ctx.session.say(message, { addToChatCtx: true });
    return { status: 'OK', address, balance };
  },
});
