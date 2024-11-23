import { 
  OAuth2Client, 
  createGitHubConfig, 
  createGoogleConfig, 
  getSessionId 
} from "@deno/kv-oauth";

// Create OAuth configs
const githubConfig = createGitHubConfig({
  clientId: Deno.env.get("GITHUB_CLIENT_ID") || "",
  clientSecret: Deno.env.get("GITHUB_CLIENT_SECRET") || "",
  redirectUri: "http://localhost:8000/auth/github/callback"
});

const googleConfig = createGoogleConfig({
  clientId: Deno.env.get("GOOGLE_CLIENT_ID") || "",
  clientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
  redirectUri: "http://localhost:8000/auth/google/callback"
});

// Create OAuth clients
export const githubClient = new OAuth2Client(githubConfig);
export const googleClient = new OAuth2Client(googleConfig);

export { getSessionId };
 