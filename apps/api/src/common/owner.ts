import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './auth/auth.types';

/** Resolves the restaurant owned by the current user (principal or DB lookup). */
export async function resolveRestaurantId(prisma: PrismaService, user: AuthUser): Promise<string> {
  if (user.restaurantId) return user.restaurantId;
  const r = await prisma.restaurant.findUnique({ where: { ownerUserId: user.sub } });
  if (!r) throw new ForbiddenException('No restaurant linked to this account');
  return r.id;
}
