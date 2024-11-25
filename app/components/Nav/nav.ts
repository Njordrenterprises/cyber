import type { User } from '../../types.ts';

export function renderNav(user?: User): string {
  if (!user) {
    return `
      <nav class="cyberpunk-nav">
        <div class="nav-content">
          <a href="/" class="nav-brand">CyberClock</a>
          <div class="nav-links">
            <a href="/login" class="cyberpunk-button neural">Login</a>
          </div>
        </div>
      </nav>
    `;
  }

  return `
    <nav class="cyberpunk-nav">
      <div class="nav-content">
        <a href="/" class="nav-brand">CyberClock</a>
        <div class="nav-links">
          <span class="user-name">${user.name}</span>
          <a href="/auth/logout" class="cyberpunk-button decrypt">Logout</a>
        </div>
      </div>
    </nav>
  `;
} 