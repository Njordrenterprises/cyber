import { handleSignIn, handleOAuthCallback } from '../../auth/oauth.ts';

export async function handleAuthRequest(
  _req: Request,
  provider: string,
  action: string,
): Promise<Response> {
  if (action === 'callback') {
    return await handleOAuthCallback(provider, _req);
  } else {
    return await handleSignIn(provider, _req);
  }
}