import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantStatus } from '@campus-bytes/types';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { toCategory, toFoodItem, toRestaurant } from './restaurants.serializer';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
  ) {}

  /** Student-facing list: approved restaurants only (business rule). */
  async listPublic() {
    const campusId = await this.tenant.getDefaultCampusId();
    const rows = await this.prisma.restaurant.findMany({
      where: { campusId, status: RestaurantStatus.APPROVED, deletedAt: null },
      orderBy: { avgRating: 'desc' },
    });
    return rows.map(toRestaurant);
  }

  async getPublic(id: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const r = await this.prisma.restaurant.findFirst({
      where: { id, campusId, status: RestaurantStatus.APPROVED, deletedAt: null },
    });
    if (!r) throw new NotFoundException('Restaurant not found');
    return toRestaurant(r);
  }

  /** Menu for a restaurant (student view hides unavailable? No — visible but non-addable). */
  async getMenu(restaurantId: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, campusId, deletedAt: null },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const [categories, items] = await Promise.all([
      this.prisma.menuCategory.findMany({
        where: { restaurantId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.foodItem.findMany({ where: { restaurantId, deletedAt: null } }),
    ]);
    return { categories: categories.map(toCategory), items: items.map(toFoodItem) };
  }

  async setPaused(restaurantId: string, paused: boolean) {
    const r = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isPaused: paused },
    });
    return { isOpen: r.status === RestaurantStatus.APPROVED && !r.isPaused, paused: r.isPaused };
  }

  /** Owner edits their OWN restaurant profile (restaurantId comes from the JWT). */
  async updateOwnProfile(
    restaurantId: string,
    dto: Partial<{
      name: string;
      description: string;
      cuisine: string;
      phone: string;
      hours: string;
      logoUrl: string;
      coverUrl: string;
    }>,
  ) {
    const r = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.cuisine !== undefined ? { cuisine: dto.cuisine.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.hours !== undefined ? { hours: dto.hours.trim() || null } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl.trim() || null } : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl.trim() || null } : {}),
      },
    });
    return { id: r.id, name: r.name, description: r.description, cuisine: r.cuisine, phone: r.phone, hours: r.hours, logoUrl: r.logoUrl, coverUrl: r.coverUrl };
  }

  async search(query: string) {
    const campusId = await this.tenant.getDefaultCampusId();
    const q = query.trim();
    if (q.length < 2) return { items: [], restaurants: [] };

    const [restaurants, items] = await Promise.all([
      this.prisma.restaurant.findMany({
        where: {
          campusId,
          status: RestaurantStatus.APPROVED,
          deletedAt: null,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { cuisine: { contains: q, mode: 'insensitive' } },
          ],
        },
      }),
      this.prisma.foodItem.findMany({
        where: {
          deletedAt: null,
          isAvailable: true,
          name: { contains: q, mode: 'insensitive' },
          restaurant: { campusId, status: RestaurantStatus.APPROVED },
        },
        take: 20,
      }),
    ]);
    return { restaurants: restaurants.map(toRestaurant), items: items.map(toFoodItem) };
  }
}
