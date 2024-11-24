export function renderLoginPage() {
  return `
    <div class="cyberpunk-background neon-grid">
      <div class="container">
        <header class="cyberpunk-header">
          <h1 class="cyberpunk-header-glitch">CyberClock</h1>
          <p class="cyberpunk-header-neon">Secure Authentication Required</p>
        </header>
        
        <div class="cyberpunk-cards-container cards-1">
          <div class="cyberpunk-card neon">
            <div class="cyberpunk-card-content">
              <h2 class="cyberpunk-card-title">Choose Your Auth Provider</h2>
              <div class="auth-controls">
                <a 
                  href="/auth/github/signin"
                  class="cyberpunk-button hacker">
                  <span class="button-text">Login with GitHub</span>
                </a>
                <a 
                  href="/auth/google/signin"
                  class="cyberpunk-button neural">
                  <span class="button-text">Login with Google</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
} 