import { authMiddleware } from './auth/middleware.ts';
import { renderLoginPage } from './components/auth/login.ts';
import {
  handleCounter,
  handleIncrement,
  handleDecrement,
} from './components/Counter/counter.ts';
import { handleAuthRequest } from './api/v1/auth.ts';
import { renderNav } from './components/Nav/nav.ts';
import type { Context, User } from './types.ts';

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Publicly accessible routes
  if (
    path.startsWith('/styles/') ||
    path.startsWith('/auth/') ||
    path === '/login'
  ) {
    // Handle static files and public routes
    if (path.startsWith('/styles/') || path.startsWith('/components/')) {
      try {
        const file = await Deno.readFile(`./app${path}`);
        const extension = path.split('.').pop();
        const contentType = extension === 'css' ? 'text/css' : 'text/plain';
        return new Response(file, {
          headers: { 
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (error) {
        console.error(`Error serving static file ${path}:`, error);
        return new Response('Not Found', { status: 404 });
      }
    }

    if (path === '/login') {
      return renderLoginPage();
    }

    if (path.startsWith('/auth/')) {
      // Extract provider and action from the path
      const parts = path.split('/');
      const provider = parts[2];
      const action = parts[3] || 'initiate';

      return await handleAuthRequest(req, provider, action);
    }

    // Add more public route handlers as needed
  }

  // Protect private routes with authentication middleware
  const ctx: Context = { request: req, state: {} };
  const authResponse = await authMiddleware(ctx);
  if (authResponse instanceof Response) {
    return authResponse;
  }

  const user = ctx.state.user as User;

  // Handle protected routes
  switch (true) {
    case path === '/':
      return new Response(`
        <div id="nav-container" hx-get="/components/nav" hx-trigger="load">
          <!-- Nav will be loaded here -->
        </div>
        <main class="container">
          <!-- Main content here -->
        </main>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });

    case path === '/counter':
      if (req.method === 'GET') {
        return handleCounter(req, user);
      } else if (req.method === 'POST') {
        const action = new URL(req.url).searchParams.get('action');
        if (action === 'increment') {
          return await handleIncrement(req, user);
        } else if (action === 'decrement') {
          return await handleDecrement(req, user);
        }
      }
      return new Response('Method Not Allowed', { status: 405 });

    // Add more protected route handlers as needed

    default:
      return new Response('Not Found', { status: 404 });
  }
}

// Helper function to render the navigation component
export function renderNavComponent(user: User): Response {
  const navHtml = renderNav(user);
  return new Response(navHtml, {
    headers: { 'Content-Type': 'text/html' },
  });
} 