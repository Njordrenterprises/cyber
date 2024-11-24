/// <reference lib="deno.unstable" />

interface Context {
  request: Request;
  state: {
    user?: {
      id: string;
      provider: string;
      providerId: string;
    };
  };
}

const kv = await Deno.openKv();

export async function authMiddleware(ctx: Context): Promise<void> {
  // Get session cookie
  const sessionId = getCookie(ctx.request.headers, 'session');
  
  if (!sessionId) {
    return;
  }

  // Check session in KV
  const session = await kv.get(['sessions', sessionId]);
  if (!session.value) {
    return;
  }

  // Check if session is expired
  const now = Date.now();
  if (now > session.value.expiresAt) {
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