import { authMiddleware } from './auth/middleware.ts';
import { handleCallback, signIn, signOut } from './auth/oauth.ts';
import { renderLoginPage } from './components/auth/login.ts';
import { handleCounter } from './components/Counter/counter.ts';
import { getCounter, incrementCounter, decrementCounter } from './api/v1/counter.ts';

export async function handleRequest(req: Request): Promise<Response> {
  const ctx = {
    request: req,
    state: {},
  };

  try {
    await authMiddleware(ctx);
    
    const url = new URL(req.url);
    const path = url.pathname;

    // Auth routes
    if (path.startsWith('/auth/')) {
      const segments = path.split('/');
      // Handle login page
      if (segments[2] === 'login') {
        return new Response(renderLoginPage(), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      // Handle logout
      if (segments[2] === 'logout') {
        return await signOut(req);
      }
      // Handle OAuth provider routes
      if (['github', 'google'].includes(segments[2])) {
        if (segments[3] === 'signin') {
          return await signIn(segments[2], req);
        }
        if (segments[3] === 'callback') {
          return await handleCallback(segments[2], req);
        }
      }
    }

    // Static file handling
    if (path.startsWith('/styles/')) {
      try {
        const file = await Deno.readFile(`./app${path}`);
        return new Response(file, {
          headers: { 
            'Content-Type': 'text/css',
            'Cache-Control': 'public, max-age=3600'
          },
        });
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }

    // Home route - serve template
    if (path === '/') {
      const html = await Deno.readFile('./views/home.html');
      return new Response(new TextDecoder().decode(html), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // API v1 Routes - JSON endpoints
    if (path.startsWith('/api/v1/counter')) {
      if (req.method === 'GET') {
        return await getCounter();
      } else if (req.method === 'POST') {
        if (path.endsWith('/increment')) {
          return await incrementCounter();
        } else if (path.endsWith('/decrement')) {
          return await decrementCounter();
        }
      }
    }

    // Component Routes - Hypermedia endpoints
    if (path.startsWith('/components/counter')) {
      return await handleCounter(req);
    }

    return new Response('Not Found', { status: 404 });
  } catch (err) {
    console.error(err);
    return new Response('Internal Server Error', { status: 500 });
  }
} 