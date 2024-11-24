import { signIn, handleCallback, signOut } from '../../auth/oauth.ts';
import type { AuthResponse } from '../../types.ts';

export async function handleAuthRequest(
  req: Request,
  provider: string,
  action: string
): Promise<Response> {
  const acceptHeader = req.headers.get('Accept');
  const wantsJson = acceptHeader?.includes('application/json');

  try {
    let response: Response;

    switch (action) {
      case 'signin':
        response = await signIn(provider, req);
        break;
      case 'callback':
        response = await handleCallback(provider, req);
        break;
      case 'signout':
        response = await signOut(req);
        break;
      default:
        return new Response('Invalid action', { status: 400 });
    }

    if (!wantsJson) {
      return response;
    }

    // For JSON clients, transform the response
    const authResponse: AuthResponse = {
      success: response.ok,
      status: response.status,
      redirectUrl: response.headers.get('Location') || undefined,
      error: !response.ok ? await response.text() : undefined
    };

    return new Response(JSON.stringify(authResponse), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: unknown) {
    const errorResponse: AuthResponse = {
      success: false,
      status: 500,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 