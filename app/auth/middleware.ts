/// <reference lib="deno.unstable" />

import type { Context, Session } from '../types.ts';

const kv = await Deno.openKv();

export async function authMiddleware(ctx: Context): Promise<void> {
  // Get session cookie
  const sessionId = getCookie(ctx.request.headers, 'session');
  
  if (!sessionId) {
    return;
  }

  // Check session in KV
  const session = await kv.get<Session>(['sessions', sessionId]);
  if (!session.value) {
    return;
  }

  // Check if session is expired
  const now = Date.now();
  if (now > session.value.timestamp + (7 * 24 * 60 * 60 * 1000)) { // 7 days
    await kv.delete(['sessions', sessionId]);
    return;
  }

  // Add user to context state
  ctx.state.user = session.value.user;
}

function getCookie(headers: Headers, key: string): string | undefined {
  const cookies = headers.get('cookie');
  if (!cookies) return undefined;
  
  const match = cookies.match(new RegExp(`${key}=([^;]+)`));
  return match ? match[1] : undefined;
} 