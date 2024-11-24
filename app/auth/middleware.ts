/// <reference lib="deno.unstable" />

import type { Context, User } from '../types.ts';

const kv = await Deno.openKv();

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
  const authHeader = ctx.request.headers.get('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.slice('Bearer '.length);

    // Validate the access token with GitHub
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
      
      // Store or update user in KV
      await storeOrUpdateUser(user);
      
      // Add user to context
      ctx.state.user = user;
      
      // Add user ID to headers for downstream handlers
      const headers = new Headers(ctx.request.headers);
      headers.set('X-User-ID', user.id);
      
      // Create new request with updated headers
      ctx.request = new Request(ctx.request.url, {
        method: ctx.request.method,
        headers,
        body: ctx.request.body
      });
      
      return;
    }
  }

  return new Response('Unauthorized', { status: 401 });
} 