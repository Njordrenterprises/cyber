import type { CounterData, User } from '../../types.ts';

const kv = await Deno.openKv();

// Map to store WebSocket connections per user
const userSockets = new Map<string, Set<WebSocket>>();

// Get current count from KV store
async function getCount(userId: string): Promise<number> {
  const result = await kv.get<CounterData>(['counters', userId]);
  return result.value?.count ?? 0;
}

// Function to broadcast count to user's sockets
function broadcastCount(userId: string, count: number): void {
  const sockets = userSockets.get(userId);
  if (sockets) {
    const message = JSON.stringify({ count });
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }
}

// Function to render the counter display HTML
function renderCounterDisplay(count: number): string {
  return `<div id="counter-value" class="counter-display glow-text">${count}</div>`;
}

// Handle increment action and return HTML snippet
export async function handleIncrement(
  _req: Request,
  user: User,
): Promise<Response> {
  const userId = user.id;

  const result = await kv.get<CounterData>(['counters', userId]);
  const currentCount = result.value?.count ?? 0;
  const newCount = currentCount + 1;

  await kv.set(['counters', userId], {
    count: newCount,
    userId,
    lastUpdated: Date.now(),
  });

  // Broadcast the new count to connected sockets
  broadcastCount(userId, newCount);

  // Return the updated counter value as HTML
  return new Response(renderCounterDisplay(newCount), {
    headers: { 'Content-Type': 'text/html' },
  });
}

// Handle decrement action and return HTML snippet
export async function handleDecrement(
  _req: Request,
  user: User,
): Promise<Response> {
  const userId = user.id;

  const result = await kv.get<CounterData>(['counters', userId]);
  const currentCount = result.value?.count ?? 0;
  const newCount = Math.max(0, currentCount - 1);

  await kv.set(['counters', userId], {
    count: newCount,
    userId,
    lastUpdated: Date.now(),
  });

  // Broadcast the new count to connected sockets
  broadcastCount(userId, newCount);

  // Return the updated counter value as HTML
  return new Response(renderCounterDisplay(newCount), {
    headers: { 'Content-Type': 'text/html' },
  });
}

// Handle WebSocket connections
function handleCounterSocket(socket: WebSocket, userId: string): void {
  // Add socket to user's set
  let sockets = userSockets.get(userId);
  if (!sockets) {
    sockets = new Set();
    userSockets.set(userId, sockets);
  }
  sockets.add(socket);

  socket.onclose = () => {
    sockets!.delete(socket);
    if (sockets!.size === 0) {
      userSockets.delete(userId);
    }
  };

  socket.onerror = (err) => {
    console.error('WebSocket error:', err);
    socket.close();
  };

  // Send initial count
  getCount(userId).then((count) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ count }));
    }
  });
}

// Handle component requests
export function handleCounter(req: Request, user: User): Response {
  const url = new URL(req.url);

  if (url.pathname.endsWith('/ws')) {
    try {
      const { socket, response } = Deno.upgradeWebSocket(req);

      socket.onopen = () => {
        handleCounterSocket(socket, user.id);
      };

      return response;
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      return new Response('WebSocket upgrade failed', { status: 500 });
    }
  }

  return new Response('Not Found', { status: 404 });
} 