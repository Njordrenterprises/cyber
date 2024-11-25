import { 
  signIn as kvoSignIn, 
  handleCallback as kvoHandleCallback, 
  signOut as kvoSignOut,
  type OAuth2ClientConfig 
} from "@deno/kv-oauth";

import { github } from "./providers/github.ts";
import { google } from "./providers/google.ts";
import { storeOrUpdateUser } from './middleware.ts';
import type { User } from '../types.ts';

const kv = await Deno.openKv();

const providers: Record<string, OAuth2ClientConfig> = {
  github,
  google,
};

// Type-safe wrapper for signIn
export async function handleSignIn(provider: string, request: Request): Promise<Response> {
  const config = providers[provider];
  if (!config) {
    return new Response('Invalid provider', { status: 400 });
  }

  console.log(`Signing in with ${provider}, Client ID:`, Deno.env.get(`OAUTH_${provider.toUpperCase()}_CLIENT_ID`));

  return await kvoSignIn(request, config);
}

// Wrap handleCallback to handle the response
export async function handleOAuthCallback(provider: string, request: Request): Promise<Response> {
  const config = providers[provider];
  if (!config) {
    return new Response('Invalid provider', { status: 400 });
  }

  try {
    const { response, sessionId, tokens } = await kvoHandleCallback(request, config);
    
    // Get user info from the OAuth provider
    const userResponse = await fetch(
      provider === 'github' 
        ? 'https://api.github.com/user'
        : 'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();
    
    // Create user object
    const user: User = {
      id: provider === 'github' ? userData.id.toString() : userData.sub,
      name: userData.name || userData.login,
      email: userData.email || '',
      provider,
      providerId: provider === 'github' ? userData.id.toString() : userData.sub,
    };

    // Store session in KV
    await kv.set(['sessions', sessionId], {
      user,
      created: Date.now(),
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Store or update user
    await storeOrUpdateUser(user);

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}

// Handle signout
export async function handleSignOut(request: Request): Promise<Response> {
  return await kvoSignOut(request);
}

export const signIn = handleSignIn;
export const handleCallback = handleOAuthCallback;
export const signOut = handleSignOut;
 