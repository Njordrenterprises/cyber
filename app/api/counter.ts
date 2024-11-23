let count = 0;

export function getCounter(): Response {
  return new Response(counterTemplate(count), {
    headers: { 'Content-Type': 'text/html' },
  });
}

export function incrementCounter(): Response {
  count++;
  return getCounter();
}

export function decrementCounter(): Response {
  count--;
  return getCounter();
}

function counterTemplate(value: number): string {
  return `
    <div class="counter-display">
      Count: ${value}
    </div>
  `;
} 