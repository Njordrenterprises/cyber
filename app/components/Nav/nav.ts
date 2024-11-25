import type { User } from '../../types.ts';

export function renderNav(user: User): string {
  return `
    <nav class="navigation">
      <ul>
        <li>Welcome, ${user.name}</li>
        <li><a href="/counter">Counter</a></li>
        <li><a href="/auth/signout">Sign Out</a></li>
      </ul>
    </nav>
  `;
} 