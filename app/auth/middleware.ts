import { verifySession } from './session.ts';
import { Context } from '../types.ts';

export async function authMiddleware(ctx: Context): Promise<void> {
  const cookies = ctx.request.headers.get('cookie');
  const sessionId = cookies?.match(/session=([^;]+)/)?.[1];
  
  if (sessionId) {
    const session = await verifySession(sessionId);
    if (session) {
      ctx.state.user = session.user;
    }
  }
} 