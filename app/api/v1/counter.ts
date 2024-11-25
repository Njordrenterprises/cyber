import type { User, CounterData } from '../../types.ts';

const kv = await Deno.openKv();

export async function getCounter(
  _req: Request,
  user: User,
): Promise<Response> {
  const userId = user.id;

  const result = await kv.get<CounterData>(['counters', userId]);
  const count = result.value?.count ?? 0;

  return new Response(JSON.stringify({ count }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function incrementCounter(
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

  return new Response(JSON.stringify({ count: newCount }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function decrementCounter(
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

  return new Response(JSON.stringify({ count: newCount }), {
    headers: { 'Content-Type': 'application/json' },
  });
} 