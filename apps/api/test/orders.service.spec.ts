import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, RestaurantStatus, UserRole } from '@campus-bytes/types';
import { OrdersService } from '../src/modules/orders/orders.service';
import type { AuthUser } from '../src/common/auth/auth.types';

const tenant = { getDefaultCampusId: async () => 'campus-1' } as never;
const realtime = { emitOrderEvent: jest.fn() } as never;

function makeService(prisma: Record<string, unknown>): OrdersService {
  return new OrdersService(prisma as never, tenant, realtime);
}

const student: AuthUser = { sub: 'stu-1', role: UserRole.STUDENT, campusId: 'campus-1' };

describe('OrdersService — security & validation', () => {
  it('rejects an order mixing items from multiple restaurants', async () => {
    const prisma = {
      restaurant: { findFirst: async () => ({ id: 'r-1', status: RestaurantStatus.APPROVED, isPaused: false, campusId: 'campus-1' }) },
      foodItem: {
        findMany: async () => [
          { id: 'f-1', restaurantId: 'r-1', isAvailable: true, name: 'A', price: 60, isVeg: true },
          { id: 'f-2', restaurantId: 'r-OTHER', isAvailable: true, name: 'B', price: 40, isVeg: true },
        ],
      },
    };
    const svc = makeService(prisma);
    await expect(
      svc.create(student, {
        restaurantId: 'r-1',
        items: [
          { foodItemId: 'f-1', quantity: 1 },
          { foodItemId: 'f-2', quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an order containing an unavailable item', async () => {
    const prisma = {
      restaurant: { findFirst: async () => ({ id: 'r-1', status: RestaurantStatus.APPROVED, isPaused: false }) },
      foodItem: {
        findMany: async () => [{ id: 'f-1', restaurantId: 'r-1', isAvailable: false, name: 'Sold out', price: 60, isVeg: true }],
      },
    };
    const svc = makeService(prisma);
    await expect(
      svc.create(student, { restaurantId: 'r-1', items: [{ foodItemId: 'f-1', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids a student from viewing another student’s order', async () => {
    const prisma = {
      order: { findFirst: async () => ({ id: 'o-1', studentId: 'stu-OTHER', restaurantId: 'r-1', items: [] }) },
    };
    const svc = makeService(prisma);
    await expect(svc.getOne(student, 'o-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids a restaurant from viewing another restaurant’s order', async () => {
    const restaurantUser: AuthUser = { sub: 'own-1', role: UserRole.RESTAURANT, campusId: 'campus-1', restaurantId: 'r-1' };
    const prisma = {
      order: { findFirst: async () => ({ id: 'o-1', studentId: 'stu-1', restaurantId: 'r-OTHER', items: [] }) },
    };
    const svc = makeService(prisma);
    await expect(svc.getOne(restaurantUser, 'o-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks accepting an order that is not in PLACED', async () => {
    const prisma = {
      order: { findUnique: async () => ({ id: 'o-1', restaurantId: 'r-1', status: OrderStatus.READY }) },
    };
    const svc = makeService(prisma);
    const restaurantUser: AuthUser = { sub: 'own-1', role: UserRole.RESTAURANT, campusId: 'campus-1', restaurantId: 'r-1' };
    await expect(svc.accept('r-1', 'o-1', { prepTimeMin: 15 }, restaurantUser)).rejects.toBeInstanceOf(BadRequestException);
  });
});
