import { homeHandler } from './pages/home.ts';
import { authMiddleware } from './auth/middleware.ts';
import { getCounter, incrementCounter, decrementCounter } from './api/v1/counter.ts';
import { 
  handleCallback, 
  signIn, 
  signOut 
} from './auth/oauth.ts';
import { renderLoginPage } from './components/auth/login.ts';

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
        // Try component-local CSS first
        const componentPath = url.pathname.replace('/styles/components/', '/components/');
        let file: Uint8Array;
        
        try {
          file = await Deno.readFile(`./app${componentPath}`);
        } catch {
          // Fallback to styles directory
          file = await Deno.readFile(`./app${url.pathname}`);
        }
        
        const contentType = url.pathname.endsWith('.css') ? 'text/css' : 'text/plain';
        return new Response(file, {
          headers: { 
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
          },
        });
      } catch (error) {
        console.error(`File not found: ${url.pathname}`, error);
        return new Response('Not Found', { status: 404 });
      }
    }

    // Auth routes handling with provider specification
    if (url.pathname.startsWith('/auth/')) {
      const segments = url.pathname.split('/');
      
      // Handle generic login route
      if (segments[1] === 'auth' && segments[2] === 'login') {
        return new Response(await renderLoginPage(), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Handle provider-specific routes
      const provider = segments[2];
      if (segments[3] === 'signin') {
        return await signIn(provider, req);
      }
      if (segments[3] === 'callback') {
        return await handleCallback(provider, req);
      }
      if (segments[3] === 'signout') {
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