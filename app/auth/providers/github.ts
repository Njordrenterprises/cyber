import { createGitHubOAuthConfig } from "@deno/kv-oauth";
import { load } from "https://deno.land/std@0.218.2/dotenv/mod.ts";

// Load environment variables
await load({ export: true });

// Get the GitHub credentials
const clientId = Deno.env.get("GITHUB_CLIENT_ID");
const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  throw new Error("GitHub OAuth credentials not configured");
}

// Set OAuth-prefixed variables for kv-oauth
Deno.env.set("OAUTH_GITHUB_CLIENT_ID", clientId);
Deno.env.set("OAUTH_GITHUB_CLIENT_SECRET", clientSecret);

// Create and export the GitHub OAuth config with only valid properties
export const github = createGitHubOAuthConfig({
  redirectUri: "https://cyberclock.ca/auth/github/callback",
  scope: ["read:user", "user:email"]
}); 