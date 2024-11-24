import type { AuthResponse } from './types.ts';
import { load } from "@std/dotenv";

const BASE_URL = 'http://localhost:8000';
let isAuthenticated = false;

async function makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET'): Promise<Response> {
  return await fetch(`${BASE_URL}/api/v1${endpoint}`, { 
    method,
    headers: { 'Accept': 'application/json' }
  });
}

function showAuthMenu() {
  console.log('\n🔐 Authentication');
  console.log('================');
  console.log('1. Sign in with GitHub');
  console.log('2. Sign in with Google');
  console.log('0. Exit');
}

function showMainMenu() {
  console.log('\n🌐 Cyber Framework CLI');
  console.log('====================');
  console.log('Available APIs:');
  console.log('1. Counter');
  console.log('2. Sign out');
  console.log('0. Exit');
}

async function showCounterMenu() {
  const response = await makeRequest('/counter');
  const { count } = await response.json();
  
  console.log('\n⚡ Counter API');
  console.log('============');
  console.log('Current count:', count);
  console.log('\nOperations:');
  console.log('1. Increment');
  console.log('2. Decrement');
  console.log('0. Back to main menu');
}

async function handleCounter() {
  while (true) {
    await showCounterMenu();
    const choice = prompt('\nSelect operation (0-2): ');
  
    switch (choice) {
      case '1': {
        const response = await makeRequest('/counter/increment', 'POST');
        const { count } = await response.json();
        console.log('Counter incremented. New value:', count);
        break;
      }
      case '2': {
        const response = await makeRequest('/counter/decrement', 'POST');
        const { count } = await response.json();
        console.log('Counter decremented. New value:', count);
        break;
      }
      case '0':
        return;
      default:
        console.log('Invalid selection. Please try again.');
    }
  }
}

async function handleAuth(): Promise<boolean> {
  await load({ export: true });
  
  await import("./auth/providers/github.ts");
  await import("./auth/providers/google.ts");
  
  console.log('Auth Environment Check:', {
    GITHUB_CLIENT_ID: Deno.env.get("GITHUB_CLIENT_ID")?.slice(0, 5) + '...',
    hasSecret: !!Deno.env.get("GITHUB_CLIENT_SECRET"),
    OAUTH_GITHUB_CLIENT_ID: Deno.env.get("OAUTH_GITHUB_CLIENT_ID")?.slice(0, 5) + '...',
    hasOAuthSecret: !!Deno.env.get("OAUTH_GITHUB_CLIENT_SECRET")
  });

  while (true) {
    showAuthMenu();
    const choice = prompt('\nSelect option (0-2): ');

    try {
      switch (choice) {
        case '1':
        case '2': {
          const provider = choice === '1' ? 'github' : 'google';
          try {
            const response = await fetch(
              `${BASE_URL}/api/v1/auth/${provider}/signin`,
              {
                headers: { 'Accept': 'application/json' },
                redirect: 'manual'
              }
            );
            
            if (response.status !== 302 && !response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json() as AuthResponse;
            
            if (data.redirectUrl) {
              console.log('\n🌐 Authentication Required');
              console.log('=======================');
              console.log('1. Open this URL in your browser:');
              console.log(data.redirectUrl);
              console.log('\n2. Sign in with your account');
              console.log('3. Copy the callback URL from your browser');
              console.log('4. Paste it below when prompted\n');
              
              const callbackUrl = prompt('Callback URL (or press Enter to cancel): ');
              if (!callbackUrl) break;
              
              const callbackResponse = await fetch(
                callbackUrl.replace(BASE_URL, `${BASE_URL}/api/v1`),
                {
                  headers: { 'Accept': 'application/json' }
                }
              );
              
              if (!callbackResponse.ok) {
                throw new Error(`Callback error! status: ${callbackResponse.status}`);
              }
              
              const callbackData = await callbackResponse.json() as AuthResponse;
              if (callbackData.success) {
                console.log('✅ Successfully signed in!');
                return true;
              } else {
                console.log(`❌ Sign in failed: ${callbackData.error}`);
              }
            }
          } catch (error) {
            console.error('Authentication error:', error instanceof Error ? error.message : 'Unknown error');
          }
          break;
        }
        case '0': {
          console.log('Goodbye! 👋');
          Deno.exit(0);
          break;
        }
        default: {
          console.log('Invalid selection. Please try again.');
          break;
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }
}

async function handleSignOut(): Promise<boolean> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/auth/signout`,
      {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      }
    );
    const data = await response.json() as AuthResponse;
    if (data.success) {
      console.log('✅ Signed out successfully');
      return true;
    } else {
      console.log('❌ Sign out failed');
      return false;
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'An unknown error occurred');
    return false;
  }
}

async function main() {
  while (true) {
    if (!isAuthenticated) {
      isAuthenticated = await handleAuth();
      continue;
    }

    showMainMenu();
    const choice = prompt('\nSelect API (0-2): ');

    switch (choice) {
      case '1': {
        await handleCounter();
        break;
      }
      case '2': {
        if (await handleSignOut()) {
          isAuthenticated = false;
        }
        break;
      }
      case '0': {
        console.log('Goodbye! 👋');
        Deno.exit(0);
        break;
      }
      default: {
        console.log('Invalid selection. Please try again.');
        break;
      }
    }
  }
}

await main();