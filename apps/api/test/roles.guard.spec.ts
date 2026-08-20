import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@campus-bytes/types';
import { RolesGuard } from '../src/common/auth/roles.guard';

function ctx(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard (RBAC)', () => {
  const make = (required: UserRole[]) => {
    const reflector = { getAllAndOverride: () => required } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('allows a matching role', () => {
    const guard = make([UserRole.ADMIN]);
    expect(guard.canActivate(ctx({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('blocks a restaurant from admin-only routes', () => {
    const guard = make([UserRole.ADMIN]);
    expect(() => guard.canActivate(ctx({ role: UserRole.RESTAURANT }))).toThrow(ForbiddenException);
  });

  it('blocks a student from restaurant routes', () => {
    const guard = make([UserRole.RESTAURANT]);
    expect(() => guard.canActivate(ctx({ role: UserRole.STUDENT }))).toThrow(ForbiddenException);
  });

  it('allows any authenticated user when no roles are required', () => {
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(ctx({ role: UserRole.STUDENT }))).toBe(true);
  });
});
