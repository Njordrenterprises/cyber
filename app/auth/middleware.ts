import { Context } from '../types.ts';
import { githubClient, googleClient, getSessionId } from './oauth.ts';

export async function authMiddleware(ctx: Context): Promise<void> {
  const sessionId = await getSessionId(ctx.request);
  if (!sessionId) return;

  try {
    // Try GitHub first
    const githubUser = await githubClient.getUser(sessionId);
    if (githubUser) {
      ctx.state.user = githubUser;
      return;
    }

    // Try Google if GitHub failed
    const googleUser = await googleClient.getUser(sessionId);
    if (googleUser) {
      ctx.state.user = googleUser;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
  }
} 