import { load } from "@std/dotenv";

async function main() {
  console.log('🔍 Checking environment variables...\n');
  
  try {
    // Load environment variables
    await load({ export: true });
    
    // Check GitHub credentials
    const githubId = Deno.env.get("GITHUB_CLIENT_ID");
    const githubSecret = Deno.env.get("GITHUB_CLIENT_SECRET");
    
    console.log('GitHub Configuration:');
    console.log('-------------------');
    console.log('Client ID:', githubId ? `${githubId.slice(0, 5)}...` : 'Not set');
    console.log('Client Secret:', githubSecret ? 'Set (hidden)' : 'Not set');
    
    // Check if OAuth prefixed variables are set
    console.log('\nOAuth Prefixed Variables:');
    console.log('----------------------');
    console.log('OAUTH_GITHUB_CLIENT_ID:', Deno.env.get("OAUTH_GITHUB_CLIENT_ID") ? 'Set' : 'Not set');
    console.log('OAUTH_GITHUB_CLIENT_SECRET:', Deno.env.get("OAUTH_GITHUB_CLIENT_SECRET") ? 'Set' : 'Not set');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    Deno.exit(1);
  }
}

await main();
