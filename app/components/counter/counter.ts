import { kv } from '../../db.ts';

interface CounterData {
  count: number;
}

export async function renderCounter() {
  const count = await getCount();
  
  return `
    <div class="card counter-component">
      <h2>Counter Demo</h2>
      <div id="htmx-counter" hx-get="/api/v1/counter" hx-trigger="load">
        ${counterTemplate(count)}
      </div>
      <div class="counter-controls">
        <button class="btn" hx-post="/api/v1/counter/increment" hx-target="#htmx-counter">+</button>
        <button class="btn" hx-post="/api/v1/counter/decrement" hx-target="#htmx-counter">-</button>
      </div>
    </div>
  `;
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