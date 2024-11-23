export function renderLoginPage() {
  return `
    <div class="auth-container">
      <h2>Sign In</h2>
      <div class="auth-providers">
        <a href="/auth/github/signin" class="auth-button github">
          Sign in with GitHub
        </a>
        <a href="/auth/google/signin" class="auth-button google">
          Sign in with Google
        </a>
      </div>
    </div>
  `;
} 