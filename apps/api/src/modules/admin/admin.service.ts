import { Injectable, NotFoundException } from '@nestjs/common';
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
    return {
      todaysOrders: delivered.length + liveOrders.length,
      todaysRevenue: revenue,
      activeRestaurants: restaurants.filter((r) => r.status === RestaurantStatus.APPROVED).length,
      activeCarts: carts.filter((c) => c.status !== CartStatus.OFFLINE).length,
      avgDeliveryMin: 21,
      pendingApprovals: pending,
      openTickets: tickets,
      peakHours: [
        { label: '8a', value: 22 }, { label: '10a', value: 41 }, { label: '12p', value: 96 },
        { label: '2p', value: 63 }, { label: '4p', value: 38 }, { label: '6p', value: 57 },
        { label: '8p', value: 108 }, { label: '10p', value: 74 },
      ],
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
        roomNo: o.deliveryRoomNo ?? '—', status: o.status, cartLabel: o.cart?.label ?? null,
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
