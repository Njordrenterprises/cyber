export function renderNav(user?: { name: string }) {
  return `
    <nav class="cyberpunk-nav">
      <div class="cyberpunk-nav-container">
        <a href="/" class="cyberpunk-nav-logo glow-text">CYBER</a>
        <div class="cyberpunk-nav-links">
          ${user 
            ? `<span class="cyberpunk-nav-user matrix">Welcome, ${user.name}</span>
               <button class="cyberpunk-button decrypt" hx-post="/auth/logout" hx-push-url="true">Logout</button>`
            : `<button class="cyberpunk-button hacker" hx-get="/auth/login" hx-push-url="true">Login</button>`
          }
        </div>
      </div>
    </nav>
  `;
} 