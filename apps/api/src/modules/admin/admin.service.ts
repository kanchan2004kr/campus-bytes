import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  CartStatus,
  OrderStatus,
  RestaurantStatus,
  UserRole,
  UserStatus,
} from '@campus-bytes/types';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { AuditService } from '../audit/audit.service';
import { CartsService } from '../carts/carts.service';
import { dec } from '../../common/serialize';
import type { AuthUser } from '../../common/auth/auth.types';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantService,
    private readonly audit: AuditService,
    private readonly carts: CartsService,
  ) {}

  private actor(user: AuthUser) {
    return { campusId: user.campusId, actorUserId: user.sub, actorLabel: `Admin · ${user.sub.slice(0, 6)}` };
  }

  // ── Dashboard / analytics ──
  async overview(campusId: string) {
    const [restaurants, carts, liveOrders, delivered, pending, tickets] = await Promise.all([
      this.prisma.restaurant.findMany({ where: { campusId, deletedAt: null } }),
      this.prisma.foodCart.findMany({ where: { campusId } }),
      this.prisma.order.findMany({
        where: { campusId, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.REJECTED, OrderStatus.CANCELLED] } },
      }),
      this.prisma.order.findMany({ where: { campusId, status: OrderStatus.DELIVERED } }),
      this.prisma.restaurant.count({ where: { campusId, status: RestaurantStatus.PENDING, deletedAt: null } }),
      this.prisma.supportTicket.count({ where: { campusId, status: 'open' } }),
    ]);
    const revenue =
      delivered.reduce((s, o) => s + dec(o.itemTotal), 0) + liveOrders.reduce((s, o) => s + dec(o.itemTotal), 0);
    const statusDist = Object.values(OrderStatus).map((st) => ({
      status: st,
      count: liveOrders.filter((o) => o.status === st).length,
    }));

    // Real order distribution across the day (2-hour buckets), from actual orders.
    const allOrders = [...delivered, ...liveOrders];
    const buckets: { label: string; from: number; to: number }[] = [
      { label: '8a', from: 8, to: 10 }, { label: '10a', from: 10, to: 12 },
      { label: '12p', from: 12, to: 14 }, { label: '2p', from: 14, to: 16 },
      { label: '4p', from: 16, to: 18 }, { label: '6p', from: 18, to: 20 },
      { label: '8p', from: 20, to: 22 }, { label: '10p', from: 22, to: 24 },
    ];
    const peakHours = buckets.map((b) => ({
      label: b.label,
      value: allOrders.filter((o) => {
        const h = new Date(o.placedAt).getHours();
        return h >= b.from && h < b.to;
      }).length,
    }));

    // Real average delivery time from delivered orders (placed → last update).
    const avgDeliveryMin = delivered.length
      ? Math.round(
          delivered.reduce(
            (s, o) => s + Math.max(0, (o.updatedAt.getTime() - o.placedAt.getTime()) / 60000),
            0,
          ) / delivered.length,
        )
      : 0;

    return {
      todaysOrders: delivered.length + liveOrders.length,
      todaysRevenue: revenue,
      activeRestaurants: restaurants.filter((r) => r.status === RestaurantStatus.APPROVED).length,
      activeCarts: carts.filter((c) => c.status !== CartStatus.OFFLINE).length,
      avgDeliveryMin,
      pendingApprovals: pending,
      openTickets: tickets,
      peakHours,
      statusDist,
    };
  }

  async restaurantPerformance(campusId: string) {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { campusId, status: RestaurantStatus.APPROVED, deletedAt: null },
    });
    const withStats = await Promise.all(
      restaurants.map(async (r) => {
        const orders = await this.prisma.order.findMany({ where: { restaurantId: r.id } });
        const active = orders.filter((o) => !([OrderStatus.REJECTED, OrderStatus.CANCELLED] as OrderStatus[]).includes(o.status as OrderStatus));
        return {
          id: r.id, name: r.name, cuisine: r.cuisine ?? '', avgRating: r.avgRating,
          ordersToday: active.length,
          revenueToday: active.reduce((s, o) => s + dec(o.itemTotal), 0),
        };
      }),
    );
    return withStats.sort((a, b) => b.revenueToday - a.revenueToday);
  }

  // ── Restaurants ──
  async listRestaurants(campusId: string, status?: RestaurantStatus) {
    const rows = await this.prisma.restaurant.findMany({
      where: { campusId, deletedAt: null, ...(status ? { status } : {}) },
      include: { owner: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      rows.map(async (r) => {
        const orders = await this.prisma.order.findMany({ where: { restaurantId: r.id } });
        const active = orders.filter((o) => !([OrderStatus.REJECTED, OrderStatus.CANCELLED] as OrderStatus[]).includes(o.status as OrderStatus));
        return {
          id: r.id, name: r.name, cuisine: r.cuisine ?? '',
          ownerName: r.owner?.name ?? '—', ownerEmail: r.owner?.email ?? '—',
          status: r.status, isPaused: r.isPaused, avgRating: r.avgRating, ratingCount: r.ratingCount,
          ordersToday: active.length, revenueToday: active.reduce((s, o) => s + dec(o.itemTotal), 0),
          appliedAt: r.createdAt.toISOString(),
        };
      }),
    );
  }

  async approveRestaurant(user: AuthUser, id: string) {
    const r = await this.prisma.restaurant.update({
      where: { id },
      data: { status: RestaurantStatus.APPROVED, approvedByUserId: user.sub },
    });
    await this.audit.log({ ...this.actor(user), action: 'Approved restaurant', target: r.name });
    return { id: r.id, status: r.status, name: r.name };
  }

  async rejectRestaurant(user: AuthUser, id: string, reason: string) {
    const r = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Restaurant not found');
    await this.prisma.restaurant.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ ...this.actor(user), action: `Rejected restaurant (${reason})`, target: r.name });
    return { ok: true };
  }

  async setRestaurantStatus(user: AuthUser, id: string, status: RestaurantStatus) {
    const r = await this.prisma.restaurant.update({ where: { id }, data: { status } });
    await this.audit.log({
      ...this.actor(user),
      action: status === RestaurantStatus.SUSPENDED ? 'Suspended restaurant' : 'Reactivated restaurant',
      target: r.name,
    });
    return { id: r.id, status: r.status, name: r.name };
  }

  // ── Restaurant account creation & management (admin only) ──
  async createRestaurant(
    user: AuthUser,
    dto: {
      name: string;
      ownerEmail: string;
      ownerName?: string;
      password: string;
      description?: string;
      cuisine?: string;
      phone?: string;
      hours?: string;
    },
  ) {
    const campusId = user.campusId;
    const email = dto.ownerEmail.toLowerCase().trim();

    const existing = await this.prisma.user.findFirst({ where: { campusId, email } });
    if (existing) throw new BadRequestException('An account with this email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    // Owner login account + its restaurant, created together and linked 1:1.
    const owner = await this.prisma.user.create({
      data: {
        campusId,
        email,
        role: UserRole.RESTAURANT,
        name: dto.ownerName?.trim() || dto.name.trim(),
        passwordHash,
        verified: true, // admin-created accounts are pre-verified
      },
    });
    const restaurant = await this.prisma.restaurant.create({
      data: {
        campusId,
        ownerUserId: owner.id,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        cuisine: dto.cuisine?.trim() || null,
        phone: dto.phone?.trim() || null,
        hours: dto.hours?.trim() || null,
        status: RestaurantStatus.APPROVED,
        approvedByUserId: user.sub,
      },
    });
    await this.audit.log({ ...this.actor(user), action: 'Created restaurant + owner', target: restaurant.name });
    return { id: restaurant.id, name: restaurant.name, ownerEmail: owner.email, status: restaurant.status };
  }

  /** Attach an owner login to an EXISTING restaurant that has none yet. */
  async createRestaurantOwner(
    user: AuthUser,
    restaurantId: string,
    dto: { ownerEmail: string; ownerName?: string; password: string },
  ) {
    const campusId = user.campusId;
    const r = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!r || r.deletedAt) throw new NotFoundException('Restaurant not found');
    if (r.ownerUserId) throw new BadRequestException('This restaurant already has an owner account.');

    const email = dto.ownerEmail.toLowerCase().trim();
    const existing = await this.prisma.user.findFirst({ where: { campusId, email } });
    if (existing) throw new BadRequestException('An account with this email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const owner = await this.prisma.user.create({
      data: {
        campusId,
        email,
        role: UserRole.RESTAURANT,
        name: dto.ownerName?.trim() || r.name,
        passwordHash,
        verified: true,
      },
    });
    await this.prisma.restaurant.update({ where: { id: r.id }, data: { ownerUserId: owner.id } });
    await this.audit.log({ ...this.actor(user), action: 'Created owner for restaurant', target: r.name });
    return { id: r.id, name: r.name, ownerEmail: owner.email };
  }

  async updateRestaurant(
    user: AuthUser,
    id: string,
    dto: Partial<{
      name: string;
      description: string;
      cuisine: string;
      phone: string;
      hours: string;
      logoUrl: string;
      coverUrl: string;
      prepTimeMin: number;
      deliveryAvailable: boolean;
      isPaused: boolean;
    }>,
  ) {
    const r = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!r || r.deletedAt) throw new NotFoundException('Restaurant not found');
    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.cuisine !== undefined ? { cuisine: dto.cuisine.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.hours !== undefined ? { hours: dto.hours.trim() || null } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl.trim() || null } : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl.trim() || null } : {}),
        ...(dto.prepTimeMin !== undefined ? { prepTimeMin: dto.prepTimeMin } : {}),
        ...(dto.deliveryAvailable !== undefined ? { deliveryAvailable: dto.deliveryAvailable } : {}),
        ...(dto.isPaused !== undefined ? { isPaused: dto.isPaused } : {}),
      },
    });
    await this.audit.log({ ...this.actor(user), action: 'Edited restaurant', target: updated.name });
    return { id: updated.id, name: updated.name, status: updated.status };
  }

  async resetRestaurantPassword(user: AuthUser, id: string, newPassword: string) {
    const r = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!r || !r.ownerUserId) throw new NotFoundException('Restaurant owner not found');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: r.ownerUserId }, data: { passwordHash } });
    // Old password + existing sessions stop working immediately.
    await this.prisma.refreshToken.updateMany({
      where: { userId: r.ownerUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({ ...this.actor(user), action: 'Force-reset restaurant password', target: r.name });
    return { ok: true };
  }

  async setRestaurantOwnerStatus(user: AuthUser, id: string, active: boolean) {
    const r = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!r || !r.ownerUserId) throw new NotFoundException('Restaurant owner not found');
    await this.prisma.user.update({
      where: { id: r.ownerUserId },
      data: { status: active ? UserStatus.ACTIVE : UserStatus.BLOCKED },
    });
    if (!active) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: r.ownerUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.log({
      ...this.actor(user),
      action: active ? 'Enabled restaurant owner' : 'Disabled restaurant owner',
      target: r.name,
    });
    return { id: r.id, ownerActive: active };
  }

  // ── Students ──
  async listStudents(campusId: string) {
    const students = await this.prisma.user.findMany({
      where: { campusId, role: UserRole.STUDENT, deletedAt: null },
      include: { hostel: true, room: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return students.map((s) => ({
      id: s.id, name: s.name, email: s.email,
      hostelName: s.hostel?.name ?? '—', roomNo: s.room?.roomNo ?? '—',
      status: s.status, ordersCount: s._count.orders, joinedAt: s.createdAt.toISOString(),
    }));
  }

  async setStudentBlocked(user: AuthUser, id: string, blocked: boolean) {
    const s = await this.prisma.user.update({
      where: { id },
      data: { status: blocked ? UserStatus.BLOCKED : UserStatus.ACTIVE },
    });
    await this.audit.log({ ...this.actor(user), action: blocked ? 'Blocked student' : 'Unblocked student', target: s.name });
    return { id: s.id, name: s.name, status: s.status };
  }

  // ── Carts ──
  async listCarts(campusId: string) {
    return this.carts.list(campusId);
  }
  async createCart(user: AuthUser, label: string) {
    const cart = await this.carts.create(user.campusId, label);
    await this.audit.log({ ...this.actor(user), action: 'Created cart', target: label });
    return cart;
  }
  async setCartStatus(user: AuthUser, id: string, status: CartStatus) {
    const cart = await this.carts.setStatus(user.campusId, id, status);
    await this.audit.log({ ...this.actor(user), action: `Set cart ${status}`, target: cart.label });
    return cart;
  }

  // ── Live orders monitor ──
  async liveOrders(campusId: string) {
    const orders = await this.prisma.order.findMany({
      where: { campusId, status: { notIn: [OrderStatus.DELIVERED, OrderStatus.REJECTED, OrderStatus.CANCELLED] } },
      include: { restaurant: { select: { name: true } }, cart: { select: { label: true } }, student: { select: { name: true } } },
      orderBy: { placedAt: 'asc' },
    });
    return orders.map((o) => {
      const elapsedMin = Math.round((Date.now() - o.placedAt.getTime()) / 60000);
      return {
        id: o.id, code: o.code, studentName: o.student?.name ?? '—',
        restaurantName: o.restaurant?.name ?? '—', hostelName: o.deliveryHostelName ?? '—',
        roomNo: o.deliveryRoomNo ?? '—',
        deliveryType: o.deliveryType ?? null,
        deliveryLocationName: o.deliveryLocationName ?? o.deliveryHostelName ?? '—',
        deliveryInstructions: o.deliveryInstructions ?? null,
        status: o.status, cartLabel: o.cart?.label ?? null,
        grandTotal: dec(o.grandTotal), elapsedMin, slaBreach: elapsedMin > 25,
      };
    });
  }

  // ── Payments ──
  async payments(campusId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { order: { campusId } },
      include: { order: { select: { code: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return payments.map((p) => ({
      id: p.id, orderCode: p.order.code, amount: dec(p.amount),
      status: p.status, method: 'UPI', provider: p.provider, at: p.createdAt.toISOString(),
    }));
  }

  // ── Support ──
  async tickets(campusId: string) {
    const tickets = await this.prisma.supportTicket.findMany({ where: { campusId }, orderBy: { createdAt: 'desc' } });
    return tickets.map((t) => ({
      id: t.id, code: t.code, from: t.fromName, role: t.role, subject: t.subject,
      status: t.status, at: t.createdAt.toISOString(),
    }));
  }
  async resolveTicket(user: AuthUser, id: string) {
    const t = await this.prisma.supportTicket.update({ where: { id }, data: { status: 'resolved' } });
    await this.audit.log({ ...this.actor(user), action: 'Resolved ticket', target: t.code });
    return { id: t.id, code: t.code, status: t.status };
  }

  // ── Notifications broadcast ──
  async broadcast(user: AuthUser, audience: string, message: string) {
    await this.prisma.notification.create({
      data: {
        campusId: user.campusId, type: 'announcement', title: `Broadcast · ${audience}`,
        body: message, channel: 'in_app',
      },
    });
    await this.audit.log({ ...this.actor(user), action: `Broadcast to ${audience}`, target: message.slice(0, 40) });
    return { ok: true };
  }

  // ── Audit ──
  async auditLog(campusId: string) {
    const entries = await this.prisma.auditLog.findMany({ where: { campusId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return entries.map((e) => ({
      id: e.id, actor: e.actorLabel, action: e.action, target: e.target, at: e.createdAt.toISOString(),
    }));
  }
}
