import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@campus-bytes/types';

export const ROLES_KEY = 'roles';
/** Declares which roles may access a route. Enforced by RolesGuard server-side. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
