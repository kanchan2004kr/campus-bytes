import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toCategory, toFoodItem } from '../restaurants/restaurants.serializer';
import type { AvailabilityDto, UpsertCategoryDto, UpsertItemDto } from './dto/menu.dto';

/** Restaurant-owner menu management. Every mutation is scoped to the owner's restaurantId. */
@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwnMenu(restaurantId: string) {
    const [categories, items] = await Promise.all([
      this.prisma.menuCategory.findMany({ where: { restaurantId, deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.foodItem.findMany({ where: { restaurantId, deletedAt: null } }),
    ]);
    return { categories: categories.map(toCategory), items: items.map(toFoodItem) };
  }

  async createCategory(restaurantId: string, dto: UpsertCategoryDto) {
    const count = await this.prisma.menuCategory.count({ where: { restaurantId, deletedAt: null } });
    const cat = await this.prisma.menuCategory.create({
      data: { restaurantId, name: dto.name, sortOrder: dto.sortOrder ?? count + 1 },
    });
    return toCategory(cat);
  }

  async deleteCategory(restaurantId: string, categoryId: string) {
    await this.assertCategory(restaurantId, categoryId);
    await this.prisma.$transaction([
      this.prisma.foodItem.updateMany({ where: { categoryId }, data: { deletedAt: new Date() } }),
      this.prisma.menuCategory.update({ where: { id: categoryId }, data: { deletedAt: new Date() } }),
    ]);
    return { ok: true };
  }

  async createItem(restaurantId: string, dto: UpsertItemDto) {
    await this.assertCategory(restaurantId, dto.categoryId);
    const item = await this.prisma.foodItem.create({
      data: {
        restaurantId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        isVeg: dto.isVeg,
        imageUrl: dto.imageUrl ?? null,
      },
    });
    return toFoodItem(item);
  }

  async updateItem(restaurantId: string, itemId: string, dto: UpsertItemDto) {
    await this.assertItem(restaurantId, itemId);
    await this.assertCategory(restaurantId, dto.categoryId);
    const item = await this.prisma.foodItem.update({
      where: { id: itemId },
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        isVeg: dto.isVeg,
        imageUrl: dto.imageUrl ?? null,
      },
    });
    return toFoodItem(item);
  }

  async deleteItem(restaurantId: string, itemId: string) {
    await this.assertItem(restaurantId, itemId);
    await this.prisma.foodItem.update({ where: { id: itemId }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  async setAvailability(restaurantId: string, itemId: string, dto: AvailabilityDto) {
    await this.assertItem(restaurantId, itemId);
    const item = await this.prisma.foodItem.update({
      where: { id: itemId },
      data: { isAvailable: dto.isAvailable },
    });
    return toFoodItem(item);
  }

  private async assertCategory(restaurantId: string, categoryId: string) {
    const c = await this.prisma.menuCategory.findUnique({ where: { id: categoryId } });
    if (!c || c.deletedAt) throw new NotFoundException('Category not found');
    if (c.restaurantId !== restaurantId) throw new ForbiddenException('Not your category');
  }

  private async assertItem(restaurantId: string, itemId: string) {
    const i = await this.prisma.foodItem.findUnique({ where: { id: itemId } });
    if (!i || i.deletedAt) throw new NotFoundException('Item not found');
    if (i.restaurantId !== restaurantId) throw new ForbiddenException('Not your item');
  }
}
