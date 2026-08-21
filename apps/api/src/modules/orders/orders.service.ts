import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CartStatus,
  OrderStatus,
  RestaurantStatus,
  UserRole,
  canTransition,
  isCancellableByStudent,
  isValidDeliveryLocation,
  locationTypeRequiresRoom,
} from '@campus-bytes/types';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { RealtimeService, ORDER_EVENTS, type OrderEvent } from '../realtime/realtime.service';
import { ORDER_INCLUDE, toOrder } from './orders.serializer';
import type { AuthUser } from '../../common/auth/auth.types';
import type { AcceptOrderDto, CreateOrderDto, RejectOrderDto } from './dto/orders.dto';

const EVENT_FOR_STATUS: Partial<Record<OrderStatus, OrderEvent>> = {
  [OrderStatus.ACCEPTED]: ORDER_EVENTS.ACCEPTED,
  [OrderStatus.PREPARING]: ORDER_EVENTS.PREPARING,
  [OrderStatus.READY]: ORDER_EVENTS.READY,
  [OrderStatus.OUT_FOR_DELIVERY]: ORDER_EVENTS.OUT_FOR_DELIVERY,
  [OrderStatus.DELIVERED]: ORDER_EVENTS.DELIVERED,
  [OrderStatus.REJECTED]: ORDER_EVENTS.REJECTED,
  [OrderStatus.CANCELLED]: ORDER_EVENTS.CANCELLED,
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly realtime: RealtimeService,
  ) {}

  // ─────────────────────── Student: create ───────────────────────
  async create(user: AuthUser, dto: CreateOrderDto) {
    const campusId = user.campusId;

    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: dto.restaurantId, campusId, deletedAt: null },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (restaurant.status !== RestaurantStatus.APPROVED || restaurant.isPaused) {
      throw new BadRequestException('Restaurant is not accepting orders');
    }

    // One order = one restaurant: fetch items and verify all belong here + available.
    const itemIds = dto.items.map((i) => i.foodItemId);
    const dbItems = await this.prisma.foodItem.findMany({
      where: { id: { in: itemIds }, deletedAt: null },
    });
    if (dbItems.length !== new Set(itemIds).size) {
      throw new BadRequestException('One or more items no longer exist');
    }
    for (const it of dbItems) {
      if (it.restaurantId !== dto.restaurantId) {
        throw new BadRequestException('All items must be from a single restaurant');
      }
      if (!it.isAvailable) {
        throw new BadRequestException(`"${it.name}" is currently unavailable`);
      }
    }

    // Server-side pricing — never trust the client.
    const byId = new Map(dbItems.map((i) => [i.id, i]));
    let itemTotal = 0;
    const orderItemsData = dto.items.map((line) => {
      const dbItem = byId.get(line.foodItemId)!;
      const price = Number(dbItem.price);
      itemTotal += price * line.quantity;
      return {
        foodItemId: dbItem.id,
        nameSnapshot: dbItem.name,
        priceSnapshot: dbItem.price,
        isVegSnapshot: dbItem.isVeg,
        quantity: line.quantity,
      };
    });

    const settings = (await this.prisma.campus.findUnique({ where: { id: campusId } }))?.settings as
      | { deliveryFee?: number; convenienceFee?: number }
      | undefined;
    const fees = (settings?.deliveryFee ?? 20) + (settings?.convenienceFee ?? 0);
    const grandTotal = itemTotal + fees;

    // Delivery location — the student MUST have a saved, approved campus location.
    // We snapshot it onto the order so old orders never change if they later edit it.
    const student = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });
    const dType = student?.savedDeliveryType ?? null;
    const dName = student?.savedDeliveryName ?? null;
    if (!dType || !dName || !isValidDeliveryLocation(dType, dName)) {
      throw new BadRequestException('Please select your delivery location before placing your order.');
    }
    const dRoomNo = locationTypeRequiresRoom(dType) ? student?.savedDeliveryRoomNo ?? null : null;
    if (locationTypeRequiresRoom(dType) && !dRoomNo) {
      throw new BadRequestException('A room number is required for hostel delivery.');
    }
    const dInstructions = student?.savedDeliveryInstructions ?? null;
    // Keep legacy hostel-name column populated for hostel deliveries.
    const hostelName = dType === 'hostel' ? dName : null;
    const roomNo = dRoomNo;

    const code = await this.nextCode(campusId);

    // A single nested create is already atomic — no interactive $transaction
    // needed (and avoids Prisma's 5s interactive-tx timeout over Neon latency).
    const order = await this.prisma.order.create({
      data: {
        campusId,
        code,
        studentId: user.sub,
        restaurantId: dto.restaurantId,
        deliveryZoneId: dto.deliveryZoneId ?? null,
        deliveryHostelName: hostelName,
        deliveryRoomNo: roomNo,
        deliveryType: dType,
        deliveryLocationName: dName,
        deliveryInstructions: dInstructions,
        status: OrderStatus.PLACED,
        itemTotal,
        fees,
        grandTotal,
        notes: dto.notes ?? null,
        items: { create: orderItemsData },
        statusHistory: {
          create: { status: OrderStatus.PLACED, changedByRole: 'student', changedById: user.sub },
        },
        // Payment stays pending until Razorpay capture (Phase 10).
        payment: {
          create: {
            amount: grandTotal,
            idempotencyKey: `${code}-${Date.now()}`,
            status: 'pending',
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    this.emit(order, ORDER_EVENTS.CREATED);
    return toOrder(order);
  }

  // ─────────────────────── Reads ───────────────────────
  async getOne(user: AuthUser, idOrCode: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        campusId: user.campusId,
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    this.assertCanView(user, order);
    return toOrder(order);
  }

  async listMine(user: AuthUser) {
    const orders = await this.prisma.order.findMany({
      where: { campusId: user.campusId, studentId: user.sub },
      include: ORDER_INCLUDE,
      orderBy: { placedAt: 'desc' },
    });
    return orders.map(toOrder);
  }

  async cancel(user: AuthUser, id: string) {
    const order = await this.prisma.order.findFirst({ where: { id, campusId: user.campusId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.studentId !== user.sub) throw new ForbiddenException('Not your order');
    if (!isCancellableByStudent(order.status as OrderStatus)) {
      throw new BadRequestException('Order can no longer be cancelled');
    }
    return this.transition(order.id, OrderStatus.CANCELLED, user, {});
  }

  // ─────────────────────── Restaurant actions ───────────────────────
  async listLive(restaurantId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: [OrderStatus.PLACED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY] },
      },
      include: ORDER_INCLUDE,
      orderBy: { placedAt: 'asc' },
    });
    return orders.map(toOrder);
  }

  async history(restaurantId: string) {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId, status: { in: [OrderStatus.DELIVERED, OrderStatus.REJECTED, OrderStatus.CANCELLED] } },
      include: ORDER_INCLUDE,
      orderBy: { placedAt: 'desc' },
    });
    return orders.map(toOrder);
  }

  async accept(restaurantId: string, orderId: string, dto: AcceptOrderDto, user: AuthUser) {
    const order = await this.assertRestaurantOrder(restaurantId, orderId);
    if (!canTransition(order.status as OrderStatus, OrderStatus.ACCEPTED)) {
      throw new BadRequestException('Order cannot be accepted from its current state');
    }
    // Accept → preparing (both transitions logged) to match the ops board.
    await this.prisma.order.update({ where: { id: orderId }, data: { prepTimeMin: dto.prepTimeMin } });
    await this.writeHistory(orderId, OrderStatus.ACCEPTED, user);
    return this.transition(orderId, OrderStatus.PREPARING, user, {});
  }

  async reject(restaurantId: string, orderId: string, dto: RejectOrderDto, user: AuthUser) {
    const order = await this.assertRestaurantOrder(restaurantId, orderId);
    if (!canTransition(order.status as OrderStatus, OrderStatus.REJECTED)) {
      throw new BadRequestException('Order cannot be rejected from its current state');
    }
    return this.transition(orderId, OrderStatus.REJECTED, user, { rejectionReason: dto.reason });
  }

  async markReady(restaurantId: string, orderId: string, user: AuthUser) {
    const order = await this.assertRestaurantOrder(restaurantId, orderId);
    if (!canTransition(order.status as OrderStatus, OrderStatus.READY)) {
      throw new BadRequestException('Order must be preparing to mark ready');
    }
    return this.transition(orderId, OrderStatus.READY, user, {});
  }

  async assignCart(restaurantId: string, orderId: string, cartId: string, user: AuthUser) {
    const order = await this.assertRestaurantOrder(restaurantId, orderId);
    if (!canTransition(order.status as OrderStatus, OrderStatus.OUT_FOR_DELIVERY)) {
      throw new BadRequestException('Order must be ready before cart handover');
    }
    const cart = await this.prisma.foodCart.findFirst({ where: { id: cartId, campusId: order.campusId } });
    if (!cart) throw new NotFoundException('Cart not found');
    if (cart.status !== CartStatus.AVAILABLE) throw new BadRequestException('Cart not available');

    await this.prisma.foodCart.update({ where: { id: cart.id }, data: { status: CartStatus.BUSY } });
    return this.transition(orderId, OrderStatus.OUT_FOR_DELIVERY, user, { cartId: cart.id });
  }

  async markDelivered(restaurantId: string, orderId: string, user: AuthUser) {
    const order = await this.assertRestaurantOrder(restaurantId, orderId);
    if (!canTransition(order.status as OrderStatus, OrderStatus.DELIVERED)) {
      throw new BadRequestException('Order must be out for delivery to mark delivered');
    }
    if (order.cartId) {
      await this.prisma.foodCart.update({ where: { id: order.cartId }, data: { status: CartStatus.AVAILABLE } });
    }
    return this.transition(orderId, OrderStatus.DELIVERED, user, {});
  }

  async restaurantSummary(restaurantId: string) {
    const [placed, preparing, ready, delivered] = await Promise.all([
      this.prisma.order.count({ where: { restaurantId, status: OrderStatus.PLACED } }),
      this.prisma.order.count({ where: { restaurantId, status: OrderStatus.PREPARING } }),
      this.prisma.order.count({ where: { restaurantId, status: OrderStatus.READY } }),
      this.prisma.order.findMany({ where: { restaurantId, status: OrderStatus.DELIVERED } }),
    ]);
    const active = await this.prisma.order.findMany({
      where: { restaurantId, status: { notIn: [OrderStatus.REJECTED, OrderStatus.CANCELLED, OrderStatus.DELIVERED] } },
    });
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    const revenue =
      delivered.reduce((s, o) => s + Number(o.itemTotal), 0) +
      active.reduce((s, o) => s + Number(o.itemTotal), 0);
    return {
      newCount: placed,
      preparingCount: preparing,
      readyCount: ready,
      todaysOrders: delivered.length + active.length,
      todaysRevenue: revenue,
      isOpen: restaurant ? restaurant.status === 'approved' && !restaurant.isPaused : false,
      paused: restaurant?.isPaused ?? false,
    };
  }

  async restaurantSales(restaurantId: string) {
    const all = await this.prisma.order.findMany({ where: { restaurantId }, include: { items: true } });
    const delivered = all.filter((o) => o.status === OrderStatus.DELIVERED);
    const rejected = all.filter((o) => o.status === OrderStatus.REJECTED);
    const revenue = delivered.reduce((s, o) => s + Number(o.itemTotal), 0);
    const completed = delivered.length;
    const total = completed + rejected.length;

    const itemMap = new Map<string, { qty: number; revenue: number }>();
    for (const o of all) {
      for (const it of o.items) {
        const cur = itemMap.get(it.nameSnapshot) ?? { qty: 0, revenue: 0 };
        cur.qty += it.quantity;
        cur.revenue += Number(it.priceSnapshot) * it.quantity;
        itemMap.set(it.nameSnapshot, cur);
      }
    }
    const topItems = [...itemMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      todaysRevenue: revenue,
      todaysOrders: all.length,
      avgOrderValue: completed ? Math.round(revenue / completed) : 0,
      completionRate: total ? Math.round((completed / total) * 100) : 100,
      ordersByHour: this.hourlyBuckets(all.map((o) => o.placedAt)),
      topItems,
    };
  }

  private hourlyBuckets(dates: Date[]) {
    const labels = ['8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'];
    const hours = [8, 10, 12, 14, 16, 18, 20, 22];
    const counts = new Array(labels.length).fill(0);
    for (const d of dates) {
      const h = d.getHours();
      let best = 0;
      for (let i = 0; i < hours.length; i++) if (Math.abs(hours[i]! - h) < Math.abs(hours[best]! - h)) best = i;
      counts[best]++;
    }
    return labels.map((label, i) => ({ label, value: counts[i] }));
  }

  // ─────────────────────── helpers ───────────────────────
  private async transition(
    orderId: string,
    to: OrderStatus,
    user: AuthUser,
    extra: { rejectionReason?: string; cartId?: string },
  ) {
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: to, ...extra },
      include: ORDER_INCLUDE,
    });
    await this.writeHistory(orderId, to, user);
    const event = EVENT_FOR_STATUS[to];
    if (event) this.emit(updated, event);
    return toOrder(updated);
  }

  private async writeHistory(orderId: string, status: OrderStatus, user: AuthUser) {
    await this.prisma.orderStatusHistory.create({
      data: { orderId, status, changedByRole: user.role, changedById: user.sub },
    });
  }

  private emit(order: { id: string; restaurantId: string; code: string; status: string }, event: OrderEvent) {
    this.realtime.emitOrderEvent(event, order);
  }

  private async assertRestaurantOrder(restaurantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurantId !== restaurantId) throw new ForbiddenException('Not your restaurant’s order');
    return order;
  }

  private assertCanView(user: AuthUser, order: { studentId: string; restaurantId: string }) {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.STUDENT && order.studentId === user.sub) return;
    if (user.role === UserRole.RESTAURANT && order.restaurantId === user.restaurantId) return;
    throw new ForbiddenException('You cannot view this order');
  }

  private async nextCode(campusId: string): Promise<string> {
    const count = await this.prisma.order.count({ where: { campusId } });
    // Unique constraint (campusId, code) guards against races; retry a few times.
    for (let n = count + 1042; n < count + 1142; n++) {
      const code = `CB${n}`;
      const exists = await this.prisma.order.findFirst({ where: { campusId, code } });
      if (!exists) return code;
    }
    return `CB${Date.now()}`;
  }
}
