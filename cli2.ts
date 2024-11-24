const BASE_URL = 'https://cyberclock.ca';
const GITHUB_CLIENT_ID = 'Ov23lisA7NFRFBKKqvmi';  // Updated to your actual Client ID

interface AuthResponse {
  success: boolean;
  status: number;
  error?: string;
}

async function initiateDeviceFlow(): Promise<{
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}> {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user user:email'
    }).toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error initiating device flow: ${errorText}`);
  }

  return await response.json();
}

async function pollForToken(deviceCode: string, interval: number): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
}> {
  while (true) {
    await new Promise(resolve => setTimeout(resolve, interval * 1000));

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      }).toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes('authorization_pending')) {
        continue;
      }
      throw new Error(`Error polling for token: ${errorText}`);
    }

    try {
      const data = await response.json();
      if (data.error) {
        if (data.error === 'authorization_pending' || 
            data.error === 'slow_down') {
          continue;
        }
        throw new Error(data.error_description || data.error);
      }
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to parse response from GitHub');
    }
  }
}

async function initiateGoogleDeviceFlow(): Promise<{
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}> {
  const response = await fetch(`${BASE_URL}/api/auth/google/device`, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error initiating device flow: ${errorText}`);
  }

  const data = await response.json();

  return {
    device_code: data.device_code,
    user_code: data.user_code,
    verification_uri: data.verification_url,
    expires_in: data.expires_in,
    interval: data.interval,
  };
}

async function pollGoogleToken(deviceCode: string, interval: number): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
}> {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));

    const response = await fetch(`${BASE_URL}/api/auth/google/token`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ device_code: deviceCode }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error polling for token: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      if (data.error === 'authorization_pending' || data.error === 'slow_down') {
        continue;
      }
      throw new Error(data.error_description || data.error);
    }

    return data;
  }
}

// Update makeAuthRequest to include the access token
async function makeAuthRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: Record<string, unknown>,
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'CyberClock-CLI/1.0',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = new URL(`${BASE_URL}/api/v1${endpoint}`);

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  return await fetch(url.toString(), options);
}

function showMainMenu() {
  console.log('\n🌐 Cyber Framework CLI');
  console.log('====================');
  console.log('Available APIs:');
  console.log('1. Counter');
  console.log('2. Sign out');
  console.log('0. Exit');
}

async function handleCounter(token: string) {
  while (true) {
    const response = await makeAuthRequest('/counter', 'GET', undefined, token);
    if (!response.ok) {
      console.error('Failed to fetch counter');
      return;
    }
    const { count } = await response.json();
    
    console.log('\n⚡ Counter API');
    console.log('============');
    console.log('Current count:', count);
    console.log('\nOperations:');
    console.log('1. Increment');
    console.log('2. Decrement');
    console.log('0. Back to main menu');

    const choice = prompt('\nSelect operation (0-2): ');

    switch (choice) {
      case '1': {
        const response = await makeAuthRequest('/counter/increment', 'POST', undefined, token);
        if (response.ok) {
          const { count } = await response.json();
          console.log('Counter incremented. New value:', count);
        }
        break;
      }
      case '2': {
        const response = await makeAuthRequest('/counter/decrement', 'POST', undefined, token);
        if (response.ok) {
          const { count } = await response.json();
          console.log('Counter decremented. New value:', count);
        }
        break;
      }
      case '0':
        return;
      default:
        console.log('Invalid selection. Please try again.');
    }
  }
}

async function handleSignOut(token: string): Promise<boolean> {
  try {
    const response = await makeAuthRequest('/auth/signout', 'POST', undefined, token);
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
  let isAuthenticated = false;
  let accessToken: string | undefined;

  while (true) {
    if (!isAuthenticated) {
      try {
        console.log('\n🔐 Choose Authentication Provider');
        console.log('==============================');
        console.log('1. GitHub');
        console.log('2. Google');
        console.log('0. Exit');

        const choice = prompt('\nSelect provider (0-2): ');

        if (choice === '0') {
          console.log('Goodbye! 👋');
          Deno.exit(0);
        }

        if (choice !== '1' && choice !== '2') {
          console.log('Invalid selection. Please try again.');
          continue;
        }

        const isGitHub = choice === '1';
        console.log(`Initiating device authorization flow with ${isGitHub ? 'GitHub' : 'Google'}...`);

        const deviceData = isGitHub ? 
          await initiateDeviceFlow() : 
          await initiateGoogleDeviceFlow();

        console.log('\n🔑 Authentication Required');
        console.log('=========================');
        console.log('1. Open this URL in your browser:');
        console.log(`   ${deviceData.verification_uri}`);
        console.log(`2. Enter the code: ${deviceData.user_code}`);
        console.log('3. Authorize the application');
        console.log('Waiting for authorization...');

        const tokenData = isGitHub ?
          await pollForToken(deviceData.device_code, deviceData.interval) :
          await pollGoogleToken(deviceData.device_code, deviceData.interval);

        isAuthenticated = true;
        accessToken = tokenData.access_token;

        const userEndpoint = isGitHub ? 
          'https://api.github.com/user' : 
          'https://www.googleapis.com/oauth2/v2/userinfo';

        const userResponse = await fetch(userEndpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user data: ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        console.log(`Welcome, ${userData.login}!`);
      } catch (error) {
        console.error('Authentication error:', error instanceof Error ? error.message : 'Unknown error');
        Deno.exit(1);
      }
    }

    showMainMenu();
    const menuChoice = prompt('\nSelect API (0-2): ');

    switch (menuChoice) {
      case '1': {
        await handleCounter(accessToken!);
        break;
      }
      case '2': {
        if (await handleSignOut(accessToken!)) {
          isAuthenticated = false;
          accessToken = undefined;
          continue;
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
// Start the program
if (import.meta.main) {
  main().catch(console.error);
}

