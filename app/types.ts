export interface AuthResponse {
  success: boolean;
  status: number;
  redirectUrl?: string;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
  providerId: string;
  created?: number;
  lastLogin?: number;
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

export interface CounterData {
  count: number;
  userId: string;
  lastUpdated: number;
} 