// Initialize KV store
const kv = await Deno.openKv();

interface CounterData {
  count: number;
  userId: string;
  lastUpdated: number;
}

// Counter operations
async function getCount(userId: string): Promise<number> {
  const result = await kv.get<CounterData>(['counters', userId]);
  return result.value?.count ?? 0;
}

async function incrementCount(userId: string): Promise<number> {
  const currentCount = await getCount(userId);
  await kv.set(['counters', userId], { 
    count: currentCount + 1,
    userId,
    lastUpdated: Date.now()
  });
  return currentCount + 1;
}

async function decrementCount(userId: string): Promise<number> {
  const currentCount = await getCount(userId);
  await kv.set(['counters', userId], { 
    count: Math.max(0, currentCount - 1),
    userId,
    lastUpdated: Date.now()
  });
  return Math.max(0, currentCount - 1);
}

// Render counter HTML
function renderCounterHtml(count: number): string {
  return `
    <div class="counter-component">
      <div id="counter-value" class="counter-display glow-text">
        ${count}
      </div>
      <div class="counter-controls">
        <button class="cyberpunk-button decrypt" 
                hx-post="/components/counter/increment" 
                hx-target="#counter-value">
          INCREMENT
        </button>
        <button class="cyberpunk-button firewall" 
                hx-post="/components/counter/decrement" 
                hx-target="#counter-value">
          DECREMENT
        </button>
      </div>
    </div>
  `;
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
export async function handleCounter(req: Request): Promise<Response> {
  const userId = req.headers.get('X-User-ID');
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle WebSocket upgrade
  if (path.endsWith('/ws')) {
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

  // Handle increment/decrement for HTMX
  if (req.method === 'POST') {
    let newCount: number;
    
    if (path.endsWith('/increment')) {
      newCount = await incrementCount(userId);
    } else if (path.endsWith('/decrement')) {
      newCount = await decrementCount(userId);
    } else {
      return new Response('Not Found', { status: 404 });
    }

    // Return just the number for HTMX target update
    return new Response(newCount.toString(), {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Handle initial render
  const count = await getCount(userId);
  return new Response(renderCounterHtml(count), {
    headers: { 'Content-Type': 'text/html' },
  });
} 