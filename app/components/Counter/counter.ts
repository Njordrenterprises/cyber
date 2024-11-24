import { authMiddleware } from '../../auth/middleware.ts';
import type { Context } from '../../types.ts';

// Initialize KV store
const kv = await Deno.openKv();

interface CounterData {
  count: number;
  userId: string;
  lastUpdated: number;
}

// Get current count from KV store
async function getCount(userId: string): Promise<number> {
  const result = await kv.get<CounterData>(['counters', userId]);
  return result.value?.count ?? 0;
}

// WebSocket handler for counter updates
async function handleCounterSocket(socket: WebSocket, userId: string) {
  const stream = kv.watch([['counters', userId]]);
  
  try {
    const initialCount = await getCount(userId);
    socket.send(JSON.stringify({ count: initialCount }));

    for await (const [entry] of stream) {
      if (socket.readyState !== WebSocket.OPEN) break;
      
      if (!entry?.value) continue;
      const value = entry.value as CounterData;
      
      socket.send(JSON.stringify({ 
        count: value.count,
        timestamp: value.lastUpdated
      }));
    }
  } catch (error) {
    console.error('WebSocket stream error:', error);
  } finally {
    stream.cancel();
  }
}

// Handle component requests
export async function handleCounter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ctx: Context = { request: req, state: {} };
  const authResult = await authMiddleware(ctx);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  if (!ctx.state.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Handle WebSocket upgrade requests
  if (url.pathname.endsWith('/ws')) {
    try {
      const { socket, response } = Deno.upgradeWebSocket(req);
      
      socket.onopen = () => {
        console.log('WebSocket opened for user:', ctx.state.user?.id);
        handleCounterSocket(socket, ctx.state.user!.id).catch(error => {
          console.error('Counter socket handler error:', error);
          socket.close();
        });
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = () => {
        console.log('WebSocket closed');
      };

      return response;
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      return new Response('WebSocket upgrade failed', { status: 500 });
    }
  }

  // Return 404 for non-WebSocket requests
  return new Response('Not Found', { status: 404 });
} 