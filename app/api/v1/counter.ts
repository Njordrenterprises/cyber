import { kv } from '../../db.ts';

interface CounterData {
  count: number;
}

export async function getCounter(): Promise<Response> {
  const count = await getCount();
  return new Response(counterTemplate(count), {
    headers: { 'Content-Type': 'text/html' },
  });
}

export async function incrementCounter(): Promise<Response> {
  const count = await getCount();
  await kv.set(['counter'], { count: count + 1 });
  return getCounter();
}

export async function decrementCounter(): Promise<Response> {
  const count = await getCount();
  await kv.set(['counter'], { count: count - 1 });
  return getCounter();
}

async function getCount(): Promise<number> {
  const result = await kv.get<CounterData>(['counter']);
  return result.value?.count ?? 0;
}

function counterTemplate(value: number): string {
  return `
    <div class="counter-display">
      Count: ${value}
    </div>
  `;
} 