// Run this script to generate a LiveKit token for the dashboard
// Usage: node generate-token.js

import { AccessToken } from 'livekit-server-sdk';

const API_KEY = process.env.LIVEKIT_API_KEY || 'APIhqmdktyEhQDR';
const API_SECRET = process.env.LIVEKIT_API_SECRET || 'nPf233I0mna9hXISzvfvTMmvWRaGQMA9bnQQSjFkbln';
const ROOM_NAME = 'pyra-room';
const PARTICIPANT_NAME = 'dashboard-user';

async function generateToken() {
  const token = new AccessToken(API_KEY, API_SECRET, {
    identity: PARTICIPANT_NAME,
    name: 'Dashboard User',
  });

  token.addGrant({
    room: ROOM_NAME,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const jwt = await token.toJwt();

  console.log('\n=== LiveKit Token Generated ===\n');
  console.log('Add this to your dashboard/.env file:\n');
  console.log(`VITE_LIVEKIT_URL=wss://nexhacks-kswwik4f.livekit.cloud`);
  console.log(`VITE_LIVEKIT_TOKEN=${jwt}`);
  console.log('\n================================\n');

  return jwt;
}

generateToken().catch(console.error);
