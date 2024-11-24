/// <reference lib="deno.unstable" />

import type { Context, Session } from '../types.ts';

const kv = await Deno.openKv();

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  '/auth',
  '/api/v1/auth',
  '/styles',
  '/favicon.ico'
];

export async function authMiddleware(ctx: Context): Promise<void | Response> {
  const url = new URL(ctx.request.url);
  const path = url.pathname;
  
  // Check if path is public
  if (PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath))) {
    return;
  }

  // Get session cookie
  const sessionId = getCookie(ctx.request.headers, 'session');
  
  // All other paths require authentication
  if (!sessionId) {
    const isApi = path.startsWith('/api/v1/');
    return new Response(
      isApi ? JSON.stringify({ error: 'Unauthorized' }) : 'Unauthorized', 
      { 
        status: 401,
        headers: {
          'Content-Type': isApi ? 'application/json' : 'text/plain'
        }
      }
    );
  }

  // Check session in KV
  const session = await kv.get<Session>(['sessions', sessionId]);
  if (!session.value) {
    return new Response('Invalid session', { status: 401 });
  }

  // Check if session is expired
  const now = Date.now();
  if (now > session.value.timestamp + (7 * 24 * 60 * 60 * 1000)) { // 7 days
    await kv.delete(['sessions', sessionId]);
    return new Response('Session expired', { status: 401 });
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