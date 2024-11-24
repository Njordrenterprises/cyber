import { createGoogleOAuthConfig } from "@deno/kv-oauth";
import { load } from "@std/dotenv";

// Load environment variables
await load({ export: true });

// Get the Google credentials
const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  throw new Error("Google OAuth credentials not configured");
}

// Set OAuth-prefixed variables for kv-oauth
Deno.env.set("OAUTH_GOOGLE_CLIENT_ID", clientId);
Deno.env.set("OAUTH_GOOGLE_CLIENT_SECRET", clientSecret);

console.log('OAUTH_GOOGLE_CLIENT_ID set to:', Deno.env.get("OAUTH_GOOGLE_CLIENT_ID"));
console.log('OAUTH_GOOGLE_CLIENT_SECRET set to:', Deno.env.get("OAUTH_GOOGLE_CLIENT_SECRET"));

// Create and export the Google OAuth config with only valid properties
export const google = createGoogleOAuthConfig({
  redirectUri: "https://cyberclock.ca/auth/google/callback",
  scope: [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}); 