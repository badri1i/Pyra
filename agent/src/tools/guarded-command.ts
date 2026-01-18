import { z } from 'zod';

/**
 * FR-011: Command Intent Parsing
 * FR-012: Address Extraction
 * FR-013: "dot eth" normalization
 *
 * This schema leverages LLM Function Calling to parse voice transcripts
 * into structured crypto commands, eliminating fragile regex parsing.
 */

// Define the Zod schema for a guarded command
export const GuardedCommandSchema = z.object({
  action: z.enum(['deposit', 'swap', 'send', 'invest'], {
    description: 'The transaction action the user wants to perform',
  }),

  amount: z.string({
    description: 'The amount with denomination (e.g., "1 ETH", "500 USDC", "0.5 WBTC")',
  }),

  target: z.string({
    description:
      'The target contract address (0x...) or ENS name. ' +
      'CRITICAL: Convert spoken "dot eth" to actual ".eth" extension. ' +
      'Example: "my vault dot eth" → "my-vault.eth", "vitalik dot eth" → "vitalik.eth"',
  }),

  userConfirmed: z.boolean({
    description:
      'Whether the user has confirmed this command. ' +
      'MUST be false initially. Only set to true after explicit user confirmation.',
  }).default(false),
});

// Type inference from schema
export type GuardedCommand = z.infer<typeof GuardedCommandSchema>;

// Tool metadata for LLM function calling
export const guardedCommandTool = {
  name: 'execute_guarded_command',
  description:
    'Parse and validate a crypto transaction command from user voice input. ' +
    'This tool extracts the action, amount, target, and tracks user confirmation status. ' +
    'Use this whenever the user requests a transaction (deposit, swap, send, invest).',
  parameters: GuardedCommandSchema,
};

/**
 * Execute the guarded command tool
 * FR-011: Logs parsed parameters for verification
 * Returns structured response for agent to act upon
 */
export async function execute_guarded_command(params: GuardedCommand): Promise<string> {
  console.log('[GuardedCommand] Parsed Parameters:', {
    action: params.action,
    amount: params.amount,
    target: params.target,
    userConfirmed: params.userConfirmed,
  });

  // FR-020: Verification check (to be implemented in later requirements)
  if (!params.userConfirmed) {
    return JSON.stringify({
      status: 'NEEDS_VERIFICATION',
      message: 'Command parsed successfully. Awaiting user confirmation before security scan.',
      parsedCommand: params,
    });
  }

  // Placeholder for future integration with Kairo security scanner
  // This will be implemented in FR-014 through FR-019
  return JSON.stringify({
    status: 'READY_FOR_SECURITY_SCAN',
    message: 'User confirmed. Ready to initiate Kairo security analysis.',
    parsedCommand: params,
  });
}
