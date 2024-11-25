/// <reference lib="deno.unstable" />

import type { Context, User, Session } from '../types.ts';
import { getSessionId } from '@deno/kv-oauth';

const kv = await Deno.openKv();

// Export the function so it can be used in oauth.ts
export async function storeOrUpdateUser(user: User): Promise<void> {
  const userKey = ['users', user.id];
  const existingUser = await kv.get<User>(userKey);
  
  await kv.set(userKey, {
    ...user,
    created: existingUser.value?.created ?? Date.now(),
    lastLogin: Date.now()
  });
}

export async function authMiddleware(ctx: Context): Promise<void | Response> {
  const sessionId = await getSessionId(ctx.request);
  
  if (sessionId) {
    const session = await kv.get<Session>(['sessions', sessionId]);
    
    if (session.value) {
      // Check if session is expired
      if (session.value.expires < Date.now()) {
        await kv.delete(['sessions', sessionId]);
        return new Response('Session expired', { status: 401 });
      }
      
      ctx.state.user = session.value.user;
      return;
    }
  }

  // Handle unauthorized access
  if (ctx.request.headers.get('HX-Request') === 'true') {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return new Response(null, {
    status: 302,
    headers: { Location: '/login' },
  });
} 