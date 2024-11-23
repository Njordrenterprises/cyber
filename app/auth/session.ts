import { kv } from '../db.ts';
import { Session } from '../types.ts';

export async function verifySession(sessionId: string): Promise<Session | null> {
  const result = await kv.get<Session>(['sessions', sessionId]);
  if (!result.value || Date.now() - result.value.timestamp > 7 * 24 * 60 * 60 * 1000) {
    return null;
  }
  return result.value;
} 