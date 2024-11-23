import { getSessionId } from './oauth.ts';
import { kv } from '../db.ts';
import type { Context, Session } from '../types.ts';

export async function authMiddleware(ctx: Context): Promise<void> {
  const sessionId = await getSessionId(ctx.request);
  
  if (!sessionId) {
    return;
  }

  const sessionResult = await kv.get<Session>(['sessions', sessionId]);
  const session = sessionResult.value;

  if (session) {
    ctx.state.user = session.user;
  }
} 