const kv = await Deno.openKv();

interface CounterData {
  count: number;
  userId: string;
  lastUpdated: number;
}

export async function getCounter(request: Request): Promise<Response> {
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

  return getCounter(request);
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

  return getCounter(request);
} 