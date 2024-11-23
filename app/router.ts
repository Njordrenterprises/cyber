import { homeHandler } from './pages/home.ts';
import { authMiddleware } from './auth/middleware.ts';
import { getCounter, incrementCounter, decrementCounter } from './api/v1/counter.ts';

export async function handleRequest(req: Request): Promise<Response> {
  const ctx = {
    request: req,
    state: {},
  };

  try {
    await authMiddleware(ctx);
    
    const url = new URL(req.url);
    
    // Static file handling
    if (url.pathname.startsWith('/styles/')) {
      const file = await Deno.readFile(`.${url.pathname}`);
      return new Response(file, {
        headers: { 'Content-Type': 'text/css' },
      });
    }

    // API and page routing
    switch (url.pathname) {
      case '/':
        return await homeHandler(ctx);
      case '/api/v1/counter':
        return getCounter();
      case '/api/v1/counter/increment':
        return incrementCounter();
      case '/api/v1/counter/decrement':
        return decrementCounter();
      default:
        return new Response('Not Found', { status: 404 });
    }
  } catch (err) {
    console.error(err);
    return new Response('Internal Server Error', { status: 500 });
  }
} 