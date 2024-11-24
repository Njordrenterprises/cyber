import { deviceConfig } from './providers/google.ts';

export async function pollGoogleTokenHandler(request: Request): Promise<Response> {
  const { device_code } = await request.json();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: deviceConfig.clientId,
      client_secret: deviceConfig.clientSecret,
      device_code: device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }).toString(),
  });

  const data = await response.json();

  if (data.error) {
    if (data.error === 'authorization_pending' || data.error === 'slow_down') {
      return new Response(JSON.stringify({ error: data.error }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: data.error_description || data.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function initiateGoogleDeviceFlowHandler(_request: Request): Promise<Response> {
  const response = await fetch('https://oauth2.googleapis.com/device/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: deviceConfig.clientId,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(`Error initiating device flow: ${errorText}`, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
