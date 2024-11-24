const kv = await Deno.openKv();

interface CounterData {
  count: number;
  userId: string;
  lastUpdated: number;
}

// Internal function to get counter value
async function _getCounter(request: Request): Promise<Response> {
  const userId = request.headers.get('X-User-ID');
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await kv.get<CounterData>(['counters', userId]);
  const count = result.value?.count ?? 0;

  return new Response(JSON.stringify({ count }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function incrementCounter(request: Request): Promise<Response> {
  const userId = request.headers.get('X-User-ID');
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await kv.get<CounterData>(['counters', userId]);
  const currentCount = result.value?.count ?? 0;
  
  await kv.set(['counters', userId], {
    count: currentCount + 1,
    userId,
    lastUpdated: Date.now()
  });

  return _getCounter(request);
}

export async function decrementCounter(request: Request): Promise<Response> {
  const userId = request.headers.get('X-User-ID');
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await kv.get<CounterData>(['counters', userId]);
  const currentCount = result.value?.count ?? 0;
  
  await kv.set(['counters', userId], {
    count: Math.max(0, currentCount - 1),
    userId,
    lastUpdated: Date.now()
  });

  return _getCounter(request);
}

// Re-export getCounter for router use
export { _getCounter as getCounter }; 