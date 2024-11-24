export interface CookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export function setCookie(headers: Headers, options: CookieOptions): void {
  const {
    name,
    value,
    maxAge,
    domain,
    path = '/',
    secure = true,
    httpOnly = true,
    sameSite = 'Lax'
  } = options;

  let cookie = `${name}=${value}`;
  if (maxAge) cookie += `; Max-Age=${maxAge}`;
  if (domain) cookie += `; Domain=${domain}`;
  if (path) cookie += `; Path=${path}`;
  if (secure) cookie += '; Secure';
  if (httpOnly) cookie += '; HttpOnly';
  if (sameSite) cookie += `; SameSite=${sameSite}`;

  headers.append('Set-Cookie', cookie);
}

export function getCookie(headers: Headers, name: string): string | undefined {
  const cookies = headers.get('cookie');
  if (!cookies) return undefined;

  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
} 