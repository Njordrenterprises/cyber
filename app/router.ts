import { authMiddleware } from './auth/middleware.ts';
import { renderLoginPage } from './components/auth/login.ts';
import { handleCounter } from './components/Counter/counter.ts';
import { getCounter, incrementCounter, decrementCounter } from './api/v1/counter.ts';
import { handleAuthRequest } from './api/v1/auth.ts';
import { initiateGoogleDeviceFlowHandler, pollGoogleTokenHandler } from './auth/deviceFlow.ts';
import { getSessionId } from '@deno/kv-oauth';
import { handleOAuthCallback as _handleOAuthCallback } from './auth/oauth.ts';

function renderFullPage(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CyberClock - Login</title>
  <link rel="stylesheet" href="/styles/global/reset.css">
  <link rel="stylesheet" href="/styles/global/variables.css">
  <link rel="stylesheet" href="/styles/components/cards.css">
  <link rel="stylesheet" href="/styles/components/buttons.css">
  <link rel="stylesheet" href="/styles/components/headers.css">
  <link rel="stylesheet" href="/styles/components/backgrounds.css">
  <link rel="stylesheet" href="/components/auth/login.css">
  <script src="https://unpkg.com/htmx.org@2.0.3"></script>
  <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body class="circuit-board">
  ${content}
</body>
</html>`;
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Allow unauthenticated access to certain paths
  if (
    path.startsWith('/styles/') ||
    path.startsWith('/components/') ||
    path.startsWith('/auth/') ||
    path === '/login' ||
    path.startsWith('/api/auth/')
  ) {
    // Handle static files and public API endpoints
    if (path.startsWith('/styles/') || path.startsWith('/components/')) {
      try {
        const file = await Deno.readFile(`./app${path}`);
        const contentType = path.endsWith('.css') ? 'text/css' : 'text/plain';
        return new Response(file, {
          headers: { 
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
          },
        });
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }

    // Handle device flow endpoints for Google
    if (path === '/api/auth/google/device') {
      return await initiateGoogleDeviceFlowHandler(req);
    }
    if (path === '/api/auth/google/token') {
      return await pollGoogleTokenHandler(req);
    }

    // Handle regular OAuth flow
    if (path.startsWith('/auth/')) {
      const segments = path.split('/');
      const provider = segments[2];
      const action = segments[3];

      if (['github', 'google'].includes(provider)) {
        return await handleAuthRequest(req, provider, action);
      }
    }

    // Serve login page
    if (path === '/login') {
      return new Response(renderFullPage(renderLoginPage()), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // If no route matches, return 404
    return new Response('Not Found', { status: 404 });
  }

  // Check authentication for all other routes
  const sessionId = await getSessionId(req);
  if (!sessionId) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/login' },
    });
  }

  // Apply auth middleware for authenticated routes
  const ctx = {
    request: req,
    state: {},
  };
  await authMiddleware(ctx);

  // Handle authenticated routes
  switch (path) {
    case '/': {
      // Serve home page
      const html = await Deno.readFile('./views/home.html');
      return new Response(new TextDecoder().decode(html), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    case '/api/v1/counter': {
      if (req.method === 'GET') {
        return await getCounter(req);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    case '/api/v1/counter/increment': {
      if (req.method === 'POST') {
        return await incrementCounter(req);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    case '/api/v1/counter/decrement': {
      if (req.method === 'POST') {
        return await decrementCounter(req);
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    case '/components/counter/ws': {
      return await handleCounter(req);
    }

    default: {
      return new Response('Not Found', { status: 404 });
    }
  }
} 