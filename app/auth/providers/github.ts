import { createGitHubOAuthConfig } from "@deno/kv-oauth";

export const github = createGitHubOAuthConfig({
  redirectUri: "http://localhost:8000/auth/github/callback",
  scope: ["read:user", "user:email"]
}); 