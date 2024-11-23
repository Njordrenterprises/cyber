import { Context } from '../types.ts';
import { renderNav } from '../components/nav/nav.ts';
import { renderCounter } from '../components/counter/counter.ts';

export async function homeHandler(ctx: Context): Promise<Response> {
  const template = await Deno.readTextFile('./views/layout.html');
  
  const content = await renderCounter();
  const navigation = renderNav(ctx.state.user);
  
  const html = template
    .replace('{{ title }}', 'Counter Demo')
    .replace('{{ navigation }}', navigation)
    .replace('{{ content }}', content)
    .replace('{{ styles }}', '<link rel="stylesheet" href="/styles/components/counter.css">');
  
  return new Response(html, {
    headers: {
      'content-type': 'text/html',
    },
  });
} 