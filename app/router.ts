import { authMiddleware } from './auth/middleware.ts';
import { renderLoginPage } from './components/auth/login.ts';
import { handleCounter } from './components/Counter/counter.ts';
import { getCounter, incrementCounter, decrementCounter } from './api/v1/counter.ts';
import { handleAuthRequest } from './api/v1/auth.ts';
import { initiateGoogleDeviceFlowHandler, pollGoogleTokenHandler } from './auth/deviceFlow.ts';

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
    if (path.startsWith('/auth/') || path.startsWith('/api/v1/auth/')) {
      const segments = path.split('/');
      const isApi = segments[1] === 'api';
      const provider = isApi ? segments[4] : segments[2];
      const action = isApi ? segments[5] : segments[3];

      if (['github', 'google'].includes(provider)) {
        if (['signin', 'callback', 'signout'].includes(action)) {
          return await handleAuthRequest(req, provider, action);
        }
      }

      // Handle login page for hypermedia requests
      if (!isApi && action === 'login') {
        return new Response(renderLoginPage(), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      return new Response('Invalid auth request', { status: 400 });
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
        return await getCounter(req);
      } else if (req.method === 'POST') {
        if (path.endsWith('/increment')) {
          return await incrementCounter(req);
        } else if (path.endsWith('/decrement')) {
          return await decrementCounter(req);
        }
      }
    }

    // Component Routes - Hypermedia endpoints
    if (path.startsWith('/components/counter')) {
      return await handleCounter(req);
    }

    // Device Flow Routes
    if (path.startsWith('/api/auth/google/device')) {
      return await initiateGoogleDeviceFlowHandler(req);
    }

    if (path.startsWith('/api/auth/google/token')) {
      return await pollGoogleTokenHandler(req);
    }

    return new Response('Not Found', { status: 404 });
  } catch (err) {
    console.error(err);
    return new Response('Internal Server Error', { status: 500 });
  }
} 