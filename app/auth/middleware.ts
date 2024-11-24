/// <reference lib="deno.unstable" />

import type { Context, User } from '../types.ts';
import { getSessionId } from '@deno/kv-oauth';

const kv = await Deno.openKv();

interface Session {
  user: User;
  created: number;
  expires: number;
}

async function storeOrUpdateUser(user: User): Promise<void> {
  const userKey = ['users', user.id];
  const existingUser = await kv.get<User>(userKey);
  
  await kv.set(userKey, {
    ...user,
    created: existingUser.value?.created ?? Date.now(),
    lastLogin: Date.now()
  });
}

export async function authMiddleware(ctx: Context): Promise<void | Response> {
  let userId: string | undefined;

  // Check for Bearer token (CLI)
  const authHeader = ctx.request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.slice('Bearer '.length);
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      const user = {
        id: userData.id.toString(),
        name: userData.name || userData.login,
        email: userData.email || '',
        provider: 'github',
        providerId: userData.id.toString(),
      };
      await storeOrUpdateUser(user);
      ctx.state.user = user;
      userId = user.id;
    }
  } 
  // Check for session cookie (Web App)
  else {
    const sessionId = await getSessionId(ctx.request);
    if (sessionId) {
      const session = await kv.get<Session>(['sessions', sessionId]);
      if (session.value) {
        ctx.state.user = session.value.user;
        userId = ctx.state.user.id;
      }
    }
  }

  if (!userId) {
    // Handle unauthorized access
    if (ctx.request.headers.get('HX-Request') === 'true') {
      // htmx request; return 401 without redirect
      return new Response('Unauthorized', { status: 401 });
    } else {
      // Regular request; redirect to login
      return new Response(null, {
        status: 302,
        headers: { Location: '/login' },
      });
    }
  }

  // Add user ID to headers for downstream handlers
  const headers = new Headers(ctx.request.headers);
  headers.set('X-User-ID', userId);
  
  // Create new request with updated headers
  ctx.request = new Request(ctx.request.url, {
    method: ctx.request.method,
    headers,
    body: ctx.request.body
  });
} 