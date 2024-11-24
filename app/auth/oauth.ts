import { 
  signIn as kvoSignIn, 
  handleCallback as kvoHandleCallback, 
  signOut as kvoSignOut,
  type OAuth2ClientConfig 
} from "@deno/kv-oauth";

import { github } from "./providers/github.ts";
import { google } from "./providers/google.ts";

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

  const { response } = await kvoHandleCallback(request, config);
  return response;
}

// Handle signout
export async function handleSignOut(request: Request): Promise<Response> {
  return await kvoSignOut(request);
}

export const signIn = handleSignIn;
export const handleCallback = handleOAuthCallback;
export const signOut = handleSignOut;
 