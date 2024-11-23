// Initialize KV store for both local and Deploy environments
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
      <div id="counter" class="counter-display glow-text">
        ${count}
      </div>
      <div class="counter-controls">
        <button class="cyberpunk-button decrypt" 
                hx-post="/components/counter/increment" 
                hx-target="#counter">
          INCREMENT
        </button>
        <button class="cyberpunk-button firewall" 
                hx-post="/components/counter/decrement" 
                hx-target="#counter">
          DECREMENT
        </button>
      </div>
    </div>
  `;
}

// Handle component requests
export async function handleCounter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  let count: number;

  if (req.method === 'POST') {
    if (path.endsWith('/increment')) {
      count = await incrementCount();
    } else if (path.endsWith('/decrement')) {
      count = await decrementCount();
    } else {
      return new Response('Not Found', { status: 404 });
    }
  } else {
    count = await getCount();
  }

  return new Response(renderCounterHtml(count), {
    headers: { 'Content-Type': 'text/html' },
  });
} 