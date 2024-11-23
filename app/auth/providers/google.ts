import { createGoogleOAuthConfig } from "@deno/kv-oauth";

export const google = createGoogleOAuthConfig({
  redirectUri: "http://localhost:8000/auth/google/callback",
  scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"]
}); 