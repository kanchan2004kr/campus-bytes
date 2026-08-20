import { Injectable, NotFoundException } from '@nestjs/common';
import { CartStatus, type FoodCart } from '@campus-bytes/types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(campusId: string): Promise<FoodCart[]> {
    const carts = await this.prisma.foodCart.findMany({ where: { campusId }, orderBy: { label: 'asc' } });
    return carts.map((c) => ({
      id: c.id,
      label: c.label,
      status: c.status as CartStatus,
      currentZoneId: c.currentZoneId,
    }));
  }

  async create(campusId: string, label: string): Promise<FoodCart> {
    const c = await this.prisma.foodCart.create({ data: { campusId, label } });
    return { id: c.id, label: c.label, status: c.status as CartStatus, currentZoneId: c.currentZoneId };
  }

  async setStatus(campusId: string, id: string, status: CartStatus): Promise<FoodCart> {
    const cart = await this.prisma.foodCart.findFirst({ where: { id, campusId } });
    if (!cart) throw new NotFoundException('Cart not found');
    const c = await this.prisma.foodCart.update({ where: { id }, data: { status } });
    return { id: c.id, label: c.label, status: c.status as CartStatus, currentZoneId: c.currentZoneId };
  }
}
