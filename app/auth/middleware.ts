/// <reference lib="deno.unstable" />

import type { Context, Session } from '../types.ts';
import { getSessionId } from "@deno/kv-oauth";

// Initialize Deno KV
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
    console.log(`Public path accessed: ${path}`);
    return;
  }

  // Get session ID using kv-oauth's getSessionId
  const sessionId = await getSessionId(ctx.request);
  
  if (!sessionId) {
    const isApi = path.startsWith('/api/v1/');
    console.log(`Unauthorized access attempt to ${path}`);
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

  console.log(`Session ID retrieved: ${sessionId}`);

  // Check session in KV
  const session = await kv.get<Session>(['sessions', sessionId]);
  if (!session.value) {
    console.log(`Invalid session ID: ${sessionId}`);
    return new Response('Invalid session', { status: 401 });
  }

  // Check if session is expired
  const now = Date.now();
  if (now > session.value.timestamp + (7 * 24 * 60 * 60 * 1000)) { // 7 days
    console.log(`Session expired for ID: ${sessionId}`);
    await kv.delete(['sessions', sessionId]);
    return new Response('Session expired', { status: 401 });
  }

  console.log(`Session valid for user: ${session.value.user.id}`);
  
  // Add user to context state
  ctx.state.user = session.value.user;
} 