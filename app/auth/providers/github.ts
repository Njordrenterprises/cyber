import { createGitHubOAuthConfig } from "@deno/kv-oauth";

export const github = createGitHubOAuthConfig({
  redirectUri: `${Deno.env.get("APP_URL")}/auth/github/callback`,
  scope: ["read:user", "user:email"],
}); 