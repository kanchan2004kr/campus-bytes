import { UserRole } from '@campus-bytes/types';

/** JWT payload / authenticated principal attached to each request. */
export interface AuthUser {
  sub: string; // user id
  role: UserRole;
  campusId: string;
  restaurantId?: string; // convenience for restaurant owners
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
