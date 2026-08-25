export enum UserRole {
  ADMIN = 'ADMIN',
  REGULAR = 'REGULAR',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  role?: UserRole;
}
