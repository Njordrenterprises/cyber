import { createGoogleOAuthConfig } from "@deno/kv-oauth";
import { load } from "@std/dotenv";

// Load environment variables
await load({ export: true });

// Get the Google credentials for web
const webClientId = Deno.env.get("GOOGLE_CLIENT_ID");
const webClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

// Get the Google credentials for device flow
const deviceClientId = Deno.env.get("GOOGLE_DEVICE_CLIENT_ID");
const deviceClientSecret = Deno.env.get("GOOGLE_DEVICE_CLIENT_SECRET");

if (!webClientId || !webClientSecret) {
  throw new Error("Google OAuth web credentials not configured");
}

if (!deviceClientId || !deviceClientSecret) {
  throw new Error("Google OAuth device credentials not configured");
}

// Set OAuth-prefixed variables for kv-oauth (web flow)
Deno.env.set("OAUTH_GOOGLE_CLIENT_ID", webClientId);
Deno.env.set("OAUTH_GOOGLE_CLIENT_SECRET", webClientSecret);

// Export device flow credentials
export const deviceConfig = {
  clientId: deviceClientId,
  clientSecret: deviceClientSecret,
};

// Create and export the Google OAuth config for web
export const google = createGoogleOAuthConfig({
  redirectUri: "https://cyberclock.ca/auth/google/callback",
  scope: [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}); 