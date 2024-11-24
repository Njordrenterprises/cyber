/// <reference lib="deno.unstable" />

import type { Context } from '../types.ts';

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
      // Create a user object for your application
      ctx.state.user = {
        id: userData.id.toString(),
        name: userData.name || userData.login,
        email: userData.email || '',
        provider: 'github',
        providerId: userData.id.toString(),
      };
      return;
    }
  }

  // Existing cookie-based authentication for web clients
  // ...

  // If authentication fails
  return new Response('Unauthorized', { status: 401 });
} 