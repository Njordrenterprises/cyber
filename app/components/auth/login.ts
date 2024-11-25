export function renderLoginPage(): Response {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login</title>
      <link rel="stylesheet" href="/styles/login.css">
    </head>
    <body>
      <h1>Login Page</h1>
      <a href="/auth/github">Login with GitHub</a>
      <a href="/auth/google">Login with Google</a>
    </body>
    </html>
  `;

  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html' },
  });
} 