import { createGoogleOAuthConfig } from "@deno/kv-oauth";

const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  throw new Error("Google OAuth credentials not configured");
}

export const google = createGoogleOAuthConfig({
  redirectUri: "http://localhost:8000/auth/google/callback",
  scope: [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}); 