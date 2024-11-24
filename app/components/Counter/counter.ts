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
  // Create a new KV watch stream for this user's counter
  const stream = kv.watch([['counters', userId]]);
  
  try {
    // Send initial count immediately
    const initialCount = await getCount(userId);
    socket.send(JSON.stringify({ count: initialCount }));

    // Watch for changes
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
export function handleCounter(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  
  // Only handle WebSocket upgrade requests
  if (!url.pathname.endsWith('/ws')) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify authentication
  const userId = req.headers.get('X-User-ID');
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Set up WebSocket event handlers
    socket.onopen = () => {
      console.log('WebSocket opened for user:', userId);
      // handleCounterSocket is called after connection is established
      handleCounterSocket(socket, userId).catch(error => {
        console.error('Counter socket handler error:', error);
        socket.close();
      });
    };

    socket.onerror = (error) => {
      console.error('WebSocket error for user:', userId, error);
    };

    socket.onclose = () => {
      console.log('WebSocket closed for user:', userId);
    };

    return response;
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    return new Response('WebSocket upgrade failed', { status: 500 });
  }
} 