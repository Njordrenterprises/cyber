export interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
  providerId: string;
}

export interface Session {
  userId: string;
  timestamp: number;
  user: User;
}

export interface Context {
  request: Request;
  state: {
    user?: User;
  };
} 