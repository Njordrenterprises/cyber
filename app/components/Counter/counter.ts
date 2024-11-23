// Initialize KV store
const kv = await Deno.openKv();

interface CounterData {
  count: number;
}

// Counter operations
async function getCount(): Promise<number> {
  const result = await kv.get<CounterData>(['counter']);
  return result.value?.count ?? 0;
}

async function incrementCount(): Promise<number> {
  const currentCount = await getCount();
  await kv.set(['counter'], { count: currentCount + 1 });
  return currentCount + 1;
}

async function decrementCount(): Promise<number> {
  const currentCount = await getCount();
  await kv.set(['counter'], { count: Math.max(0, currentCount - 1) });
  return currentCount - 1;
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
async function handleCounterSocket(socket: WebSocket) {
  const stream = kv.watch([['counter']]);
  
  try {
    for await (const [entry] of stream) {
      if (!entry.value) continue;
      const count = (entry.value as CounterData).count;
      socket.send(JSON.stringify({ count }));
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('WebSocket error:', error);
    }
  } finally {
    stream.cancel();
  }
}

// Handle component requests
export async function handleCounter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle WebSocket upgrade
  if (path.endsWith('/ws')) {
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.onopen = () => {
      handleCounterSocket(socket);
    };
    return response;
  }

  // Handle increment/decrement
  if (req.method === 'POST') {
    if (path.endsWith('/increment')) {
      const count = await incrementCount();
      return new Response(count.toString());
    } 
    if (path.endsWith('/decrement')) {
      const count = await decrementCount();
      return new Response(count.toString());
    }
  }

  // Handle initial render
  const count = await getCount();
  return new Response(renderCounterHtml(count), {
    headers: { 'Content-Type': 'text/html' },
  });
} 