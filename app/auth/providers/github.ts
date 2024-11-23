import { createGitHubOAuthConfig } from "@deno/kv-oauth";

const clientId = Deno.env.get("GITHUB_CLIENT_ID");
const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  throw new Error("GitHub OAuth credentials not configured");
}

export const github = createGitHubOAuthConfig({
  redirectUri: `${Deno.env.get("APP_URL") || "http://localhost:8000"}/auth/github/callback`,
  scope: ["read:user", "user:email"]
}); 