import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  photoUrl: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      validatedQuery?: Record<string, unknown>;
    }
  }
}
