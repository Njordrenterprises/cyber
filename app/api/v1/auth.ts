import { handleSignIn, handleCallback, signOut } from '../../auth/oauth.ts';

export async function handleAuthRequest(
  request: Request,
  provider: string,
  action: string
): Promise<Response> {
  try {
    switch (action) {
      case 'signin':
        return await handleSignIn(provider, request);
      case 'callback':
        return await handleCallback(provider, request);
      case 'signout':
        return await signOut(request);
      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}