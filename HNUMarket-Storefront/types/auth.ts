// Auth Types

export interface User {
  id: string;
  email: string;
  fullName: string;
  address: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, address: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  resendConfirmationEmail: (email: string) => Promise<boolean>;
}
