export function renderNav(user?: { name: string }) {
  return `
    <nav class="main-nav">
      <div class="container nav-content">
        <a href="/" class="nav-logo">Cyber Framework</a>
        <div class="nav-links">
          ${user 
            ? `<span>Welcome, ${user.name}</span>
               <button class="btn" hx-post="/auth/logout" hx-push-url="true">Logout</button>`
            : `<button class="btn" hx-get="/auth/login" hx-push-url="true">Login</button>`
          }
        </div>
      </div>
    </nav>
  `;
} 