export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Custom fields
  teamId?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  locale?: string;
  timezone?: string | null;
  twoFactorEnabled?: boolean;
}

export interface Session {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: User;
}

export interface TwoFactorData {
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
}

export type AuthProvider = "google" | "github" | "apple" | "email";
