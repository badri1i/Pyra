import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const envSchema = z.object({
  LIVEKIT_URL: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  RPC_URL: z.string().url().default('https://rpc.sepolia.org'),
  CHAIN_ID: z.coerce.number().default(11155111), // Sepolia default
  AGENT_PRIVATE_KEY: z.string().startsWith('0x', "Private key must start with 0x").length(66, "Must be 64 hex chars + 0x prefix").optional(),
  SIMULATE_TRANSACTIONS: z.coerce.boolean().default(true),
  ETHERSCAN_API_KEY: z.string().optional(),
  KAIRO_API_KEY: z.string().optional(),
  KAIRO_API_URL: z.string().url().optional(),
});

export const config = envSchema.parse(process.env);

console.log('[Config] Environment validated successfully.');
