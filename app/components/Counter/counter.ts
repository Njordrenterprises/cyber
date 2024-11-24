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
    for await (const [entry] of stream) {
      if (!entry.value) continue;
      const count = (entry.value as CounterData).count;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ count }));
      } else {
        break;
      }
    }
  } catch (error) {
    console.error('WebSocket stream error:', error);
  } finally {
    stream.cancel();
  }
}

// Handle component requests
export function handleCounter(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle WebSocket upgrade
  if (path.endsWith('/ws')) {
    const userId = req.headers.get('X-User-ID');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const { socket, response } = Deno.upgradeWebSocket(req);
      
      // Set up error handling
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      // Set up close handling
      socket.onclose = () => {
        console.log('WebSocket closed for user:', userId);
      };

      // Send initial count on connection
      socket.onopen = async () => {
        try {
          const count = await getCount(userId);
          socket.send(JSON.stringify({ count }));
          await handleCounterSocket(socket, userId);
        } catch (error) {
          console.error('Error in WebSocket open handler:', error);
          socket.close();
        }
      };
      
      return response;
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      return new Response('WebSocket upgrade failed', { status: 500 });
    }
  }

  // Handle other paths
  return new Response('Not Found', { status: 404 });
} 