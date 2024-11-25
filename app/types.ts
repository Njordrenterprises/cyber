export interface AuthResponse {
  success: boolean;
  status: number;
  redirectUrl?: string;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  created?: number;
  lastLogin?: number;
}

export interface Session {
  user: User;
  timestamp: number;
}

export interface Context {
  request: Request;
  state: {
    user?: User;
    [key: string]: unknown;
  };
}

export interface CounterData {
  count: number;
  userId: string;
  lastUpdated: number;
} 