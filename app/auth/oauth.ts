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
    console.error(`Invalid provider: ${provider}`);
    return new Response('Invalid provider', { status: 400 });
  }

  const clientId = Deno.env.get(`OAUTH_${provider.toUpperCase()}_CLIENT_ID`);
  const clientSecret = Deno.env.get(`OAUTH_${provider.toUpperCase()}_CLIENT_SECRET`);

  console.log(`Signing in with ${provider}:`, {
    clientId: clientId ? 'present' : 'missing',
    clientSecret: clientSecret ? 'present' : 'missing',
    redirectUri: config.redirectUri
  });

  try {
    return await kvoSignIn(request, config);
  } catch (error: unknown) {
    console.error(`${provider} sign-in error:`, error);
    return new Response(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 500 
    });
  }
}

// Wrap handleCallback to handle the response
export async function handleOAuthCallback(provider: string, request: Request): Promise<Response> {
  const config = providers[provider];
  if (!config) {
    return new Response('Invalid provider', { status: 400 });
  }

  try {
    console.log(`Processing ${provider} callback...`);
    const { response, sessionId, tokens } = await kvoHandleCallback(request, config);
    
    // Log the tokens (but never in production!)
    console.log('Received tokens:', {
      accessToken: tokens.accessToken ? 'present' : 'missing',
      tokenType: tokens.tokenType,
    });

    // Get user info from the OAuth provider
    const userInfoUrl = provider === 'github' 
      ? 'https://api.github.com/user'
      : 'https://www.googleapis.com/oauth2/v2/userinfo';
    
    console.log(`Fetching user info from: ${userInfoUrl}`);
    
    const userResponse = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User info fetch failed:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch user data: ${userResponse.status} ${errorText}`);
    }

    const userData = await userResponse.json();
    console.log('User data received:', {
      id: userData.id || userData.sub,
      name: userData.name || userData.login,
      provider
    });

    // Create user object
    const user: User = {
      id: provider === 'github' ? userData.id.toString() : userData.sub,
      name: userData.name || userData.login,
      email: userData.email || '',
      provider,
      providerId: provider === 'github' ? userData.id.toString() : userData.sub,
      avatarUrl: userData.avatar_url || userData.picture || '',
    };

    // Store session in KV with proper expiration
    await kv.set(['sessions', sessionId], {
      user,
      created: Date.now(),
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Store or update user
    await storeOrUpdateUser(user);

    console.log('Authentication successful, redirecting...');
    return response;
  } catch (error: unknown) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(`Authentication failed: ${errorMessage}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Handle signout
export async function handleSignOut(request: Request): Promise<Response> {
  return await kvoSignOut(request);
}

export const signIn = handleSignIn;
export const handleCallback = handleOAuthCallback;
export const signOut = handleSignOut;
 