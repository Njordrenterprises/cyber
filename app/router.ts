import { homeHandler } from './pages/home.ts';
import { authMiddleware } from './auth/middleware.ts';
import { getCounter, incrementCounter, decrementCounter } from './api/v1/counter.ts';
import { signIn, signOut, handleCallback } from './auth/oauth.ts';

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
      try {
        const file = await Deno.readFile(`./app${url.pathname}`);
        const contentType = url.pathname.endsWith('.css') ? 'text/css' : 'text/plain';
        return new Response(file, {
          headers: { 'Content-Type': contentType },
        });
      } catch (_error) {
        console.error(`File not found: ./app${url.pathname}`);
        return new Response('Not Found', { status: 404 });
      }
    }

    // Auth routes
    if (url.pathname.startsWith('/auth/')) {
      if (url.pathname.endsWith('/signin')) {
        return await signIn(req);
      }
      if (url.pathname.endsWith('/callback')) {
        const { response } = await handleCallback(req);
        return response;
      }
      if (url.pathname.endsWith('/signout')) {
        return await signOut(req);
      }
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