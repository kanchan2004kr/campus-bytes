import {
  CartStatus,
  OrderStatus,
  RestaurantStatus,
  type FoodCart,
} from '@campus-bytes/types';
import { API_ENABLED } from '@/lib/api-config';
import { api } from '@/lib/api-client';

/**
 * Admin Panel data layer — in-memory, mutable, API-shaped (PRD §14.6).
 * State anchored on globalThis so it survives module re-evaluation. Phase 7
 * replaces bodies with real /admin/* HTTP calls without touching screens.
 */

const LATENCY = 260;
const delay = <T>(v: T, ms = LATENCY): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));
const nowIso = (offMin = 0) => new Date(Date.now() + offMin * 60000).toISOString();

export interface AdminRestaurant {
  id: string;
  name: string;
  cuisine: string;
  ownerName: string;
  ownerEmail: string;
  status: RestaurantStatus;
  isPaused: boolean;
  avgRating: number;
  ratingCount: number;
  ordersToday: number;
  revenueToday: number;
  appliedAt: string;
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  hostelName: string;
  roomNo: string;
  status: 'active' | 'blocked';
  ordersCount: number;
  joinedAt: string;
}

export interface AdminLiveOrder {
  id: string;
  code: string;
  studentName: string;
  restaurantName: string;
  hostelName: string;
  roomNo: string;
  status: OrderStatus;
  cartLabel: string | null;
  grandTotal: number;
  elapsedMin: number;
  slaBreach: boolean;
}

export interface AdminHostel {
  id: string;
  name: string;
  zoneName: string;
  rooms: number;
}

export interface AdminZone {
  id: string;
  name: string;
  isPickupPoint: boolean;
}

export interface AdminPayment {
  id: string;
  orderCode: string;
  amount: number;
  status: 'captured' | 'refunded' | 'failed';
  method: 'UPI' | 'Card' | 'Wallet';
  provider: string;
  at: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
}

export interface SupportTicket {
  id: string;
  code: string;
  from: string;
  role: 'student' | 'restaurant';
  subject: string;
  status: 'open' | 'resolved';
  at: string;
}

interface AdminStore {
  restaurants: AdminRestaurant[];
  students: AdminStudent[];
  carts: FoodCart[];
  hostels: AdminHostel[];
  zones: AdminZone[];
  liveOrders: AdminLiveOrder[];
  payments: AdminPayment[];
  audit: AuditEntry[];
  tickets: SupportTicket[];
  cartSeq: number;
}

let auditSeq = 1;
function logAudit(store: AdminStore, action: string, target: string) {
  store.audit.unshift({
    id: `a-${auditSeq++}`,
    actor: 'Admin · Rohan',
    action,
    target,
    at: nowIso(),
  });
}

function seed(): AdminStore {
  return {
    restaurants: [
      { id: 'r-vista', name: 'Vista Colline', cuisine: 'Chai · Snacks · Combos', ownerName: 'Meera Joshi', ownerEmail: 'owner@vistacolline.campus', status: RestaurantStatus.APPROVED, isPaused: false, avgRating: 4.5, ratingCount: 812, ordersToday: 64, revenueToday: 9120, appliedAt: nowIso(-60 * 24 * 30) },
      { id: 'r-365', name: '365', cuisine: 'Maggie · Paneer · Rolls', ownerName: 'Vikram Shah', ownerEmail: 'hello@365.campus', status: RestaurantStatus.APPROVED, isPaused: false, avgRating: 4.5, ratingCount: 1290, ordersToday: 88, revenueToday: 12400, appliedAt: nowIso(-60 * 24 * 45) },
      { id: 'r-legabriel', name: 'Le Gabriel', cuisine: 'Biryani · Beverages', ownerName: 'Sara Thomas', ownerEmail: 'contact@legabriel.campus', status: RestaurantStatus.APPROVED, isPaused: true, avgRating: 3.4, ratingCount: 305, ordersToday: 22, revenueToday: 4360, appliedAt: nowIso(-60 * 24 * 20) },
      { id: 'r-lapopote', name: 'La Popote', cuisine: 'Paratha · Chole · Thali', ownerName: 'Amit Bose', ownerEmail: 'amit@lapopote.campus', status: RestaurantStatus.SUSPENDED, isPaused: false, avgRating: 2.2, ratingCount: 88, ordersToday: 0, revenueToday: 0, appliedAt: nowIso(-60 * 24 * 15) },
      { id: 'r-brewpoint', name: 'Brew Point', cuisine: 'Coffee · Sandwiches', ownerName: 'Nisha Reddy', ownerEmail: 'nisha@brewpoint.campus', status: RestaurantStatus.PENDING, isPaused: false, avgRating: 0, ratingCount: 0, ordersToday: 0, revenueToday: 0, appliedAt: nowIso(-60 * 6) },
      { id: 'r-tandoor', name: 'Tandoor Tales', cuisine: 'North Indian · Grills', ownerName: 'Rahul Verma', ownerEmail: 'rahul@tandoortales.campus', status: RestaurantStatus.PENDING, isPaused: false, avgRating: 0, ratingCount: 0, ordersToday: 0, revenueToday: 0, appliedAt: nowIso(-60 * 30) },
    ],
    students: [
      { id: 's-1', name: 'Kabir Singh', email: 'kabir@nims.campus', hostelName: 'Larimar Hostel', roomNo: '811', status: 'active', ordersCount: 42, joinedAt: nowIso(-60 * 24 * 120) },
      { id: 's-2', name: 'Aarav Mehta', email: 'aarav@nims.campus', hostelName: 'Larimar Hostel', roomNo: '733', status: 'active', ordersCount: 18, joinedAt: nowIso(-60 * 24 * 80) },
      { id: 's-3', name: 'Priya Nair', email: 'priya@nims.campus', hostelName: 'Vista Hostel', roomNo: '204', status: 'active', ordersCount: 55, joinedAt: nowIso(-60 * 24 * 200) },
      { id: 's-4', name: 'Rohan Das', email: 'rohan@nims.campus', hostelName: 'LG Hostel', roomNo: '512', status: 'blocked', ordersCount: 7, joinedAt: nowIso(-60 * 24 * 30) },
      { id: 's-5', name: 'Sana Kapoor', email: 'sana@nims.campus', hostelName: 'LP Hostel', roomNo: '106', status: 'active', ordersCount: 29, joinedAt: nowIso(-60 * 24 * 60) },
    ],
    carts: [
      { id: 'cart-01', label: 'Campus Cart #01', status: CartStatus.AVAILABLE, currentZoneId: 'z-north' },
      { id: 'cart-02', label: 'Campus Cart #02', status: CartStatus.BUSY, currentZoneId: 'z-south' },
      { id: 'cart-03', label: 'Campus Cart #03', status: CartStatus.AVAILABLE, currentZoneId: 'z-north' },
      { id: 'cart-04', label: 'Campus Cart #04', status: CartStatus.OFFLINE, currentZoneId: null },
    ],
    hostels: [
      { id: 'h-larimar', name: 'Larimar Hostel', zoneName: 'North Campus', rooms: 240 },
      { id: 'h-vista', name: 'Vista Hostel', zoneName: 'North Campus', rooms: 180 },
      { id: 'h-lg', name: 'LG Hostel', zoneName: 'South Campus', rooms: 300 },
      { id: 'h-lp', name: 'LP Hostel', zoneName: 'South Campus', rooms: 160 },
    ],
    zones: [
      { id: 'z-north', name: 'North Campus', isPickupPoint: false },
      { id: 'z-south', name: 'South Campus', isPickupPoint: false },
      { id: 'z-library', name: 'Library Block (Pickup)', isPickupPoint: true },
    ],
    liveOrders: [
      { id: 'o-1', code: 'CB1048', studentName: 'Aarav Mehta', restaurantName: 'Vista Colline', hostelName: 'Larimar Hostel', roomNo: '811', status: OrderStatus.PLACED, cartLabel: null, grandTotal: 160, elapsedMin: 1, slaBreach: false },
      { id: 'o-2', code: 'CB1045', studentName: 'Rohan Das', restaurantName: 'Vista Colline', hostelName: 'LG Hostel', roomNo: '512', status: OrderStatus.PREPARING, cartLabel: null, grandTotal: 230, elapsedMin: 9, slaBreach: false },
      { id: 'o-3', code: 'CB1042', studentName: 'Kabir Singh', restaurantName: 'Le Gabriel', hostelName: 'Larimar Hostel', roomNo: '811', status: OrderStatus.OUT_FOR_DELIVERY, cartLabel: 'Campus Cart #03', grandTotal: 198, elapsedMin: 22, slaBreach: false },
      { id: 'o-4', code: 'CB1040', studentName: 'Sana Kapoor', restaurantName: '365', hostelName: 'LP Hostel', roomNo: '106', status: OrderStatus.READY, cartLabel: null, grandTotal: 150, elapsedMin: 28, slaBreach: true },
    ],
    payments: [
      { id: 'p-1', orderCode: 'CB1048', amount: 160, status: 'captured', method: 'UPI', provider: 'Razorpay', at: nowIso(-1) },
      { id: 'p-2', orderCode: 'CB1045', amount: 230, status: 'captured', method: 'Card', provider: 'Razorpay', at: nowIso(-9) },
      { id: 'p-3', orderCode: 'CB1031', amount: 110, status: 'refunded', method: 'UPI', provider: 'Razorpay', at: nowIso(-300) },
      { id: 'p-4', orderCode: 'CB1042', amount: 198, status: 'captured', method: 'Wallet', provider: 'Razorpay', at: nowIso(-22) },
      { id: 'p-5', orderCode: 'CB1038', amount: 90, status: 'failed', method: 'UPI', provider: 'Razorpay', at: nowIso(-140) },
    ],
    audit: [
      { id: 'a-0', actor: 'Admin · Rohan', action: 'Suspended restaurant', target: 'La Popote', at: nowIso(-120) },
      { id: 'a-01', actor: 'System', action: 'Auto-refund issued', target: 'Order CB1031', at: nowIso(-300) },
    ],
    tickets: [
      { id: 't-1', code: 'TK-204', from: 'Priya Nair', role: 'student', subject: 'Order delivered cold', status: 'open', at: nowIso(-45) },
      { id: 't-2', code: 'TK-203', from: 'Vista Colline', role: 'restaurant', subject: 'Cart not assigned at peak', status: 'open', at: nowIso(-120) },
      { id: 't-3', code: 'TK-201', from: 'Kabir Singh', role: 'student', subject: 'Refund not received', status: 'resolved', at: nowIso(-1400) },
    ],
    cartSeq: 5,
  };
}

const g = globalThis as unknown as { __cbAdminStore?: AdminStore };
const store: AdminStore = g.__cbAdminStore ?? (g.__cbAdminStore = seed());

// ── Dashboard / analytics ───────────────────────────────────────────────
export interface AdminOverview {
  todaysOrders: number;
  todaysRevenue: number;
  activeRestaurants: number;
  activeCarts: number;
  avgDeliveryMin: number;
  pendingApprovals: number;
  openTickets: number;
  peakHours: { label: string; value: number }[];
  statusDist: { status: string; count: number }[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (API_ENABLED) return api.get<AdminOverview>('/admin/overview');
  const activeRestaurants = store.restaurants.filter((r) => r.status === RestaurantStatus.APPROVED).length;
  const activeCarts = store.carts.filter((c) => c.status !== CartStatus.OFFLINE).length;
  const revenue = store.restaurants.reduce((s, r) => s + r.revenueToday, 0);
  const orders = store.restaurants.reduce((s, r) => s + r.ordersToday, 0);
  const statusDist = Object.values(OrderStatus).map((st) => ({
    status: st,
    count: store.liveOrders.filter((o) => o.status === st).length,
  }));
  return delay({
    todaysOrders: orders,
    todaysRevenue: revenue,
    activeRestaurants,
    activeCarts,
    avgDeliveryMin: 21,
    pendingApprovals: store.restaurants.filter((r) => r.status === RestaurantStatus.PENDING).length,
    openTickets: store.tickets.filter((t) => t.status === 'open').length,
    peakHours: [
      { label: '8a', value: 22 }, { label: '10a', value: 41 }, { label: '12p', value: 96 },
      { label: '2p', value: 63 }, { label: '4p', value: 38 }, { label: '6p', value: 57 },
      { label: '8p', value: 108 }, { label: '10p', value: 74 },
    ],
    statusDist,
  });
}

export async function getRestaurantPerformance() {
  if (API_ENABLED) return api.get<AdminRestaurant[]>('/admin/analytics/restaurants');
  return delay(
    [...store.restaurants]
      .filter((r) => r.status === RestaurantStatus.APPROVED)
      .sort((a, b) => b.revenueToday - a.revenueToday),
  );
}

// ── Restaurants ─────────────────────────────────────────────────────────
export async function getRestaurants(filter?: RestaurantStatus) {
  if (API_ENABLED) {
    return api.get<AdminRestaurant[]>(`/admin/restaurants${filter ? `?status=${filter}` : ''}`);
  }
  return delay(filter ? store.restaurants.filter((r) => r.status === filter) : [...store.restaurants]);
}

export async function approveRestaurant(id: string) {
  if (API_ENABLED) return api.post<AdminRestaurant>(`/admin/restaurants/${id}/approve`);
  const r = store.restaurants.find((x) => x.id === id);
  if (r) { r.status = RestaurantStatus.APPROVED; logAudit(store, 'Approved restaurant', r.name); }
  return delay(r);
}
export async function rejectRestaurant(id: string, reason: string) {
  if (API_ENABLED) return api.post(`/admin/restaurants/${id}/reject`, { reason });
  const r = store.restaurants.find((x) => x.id === id);
  if (r) { store.restaurants = store.restaurants.filter((x) => x.id !== id); logAudit(store, `Rejected restaurant (${reason})`, r.name); }
  return delay({ ok: true });
}
export async function setRestaurantStatus(id: string, status: RestaurantStatus) {
  if (API_ENABLED) {
    const path = status === RestaurantStatus.SUSPENDED ? 'suspend' : 'reactivate';
    return api.patch<AdminRestaurant>(`/admin/restaurants/${id}/${path}`);
  }
  const r = store.restaurants.find((x) => x.id === id);
  if (r) { r.status = status; logAudit(store, status === RestaurantStatus.SUSPENDED ? 'Suspended restaurant' : 'Reactivated restaurant', r.name); }
  return delay(r);
}

// ── Students ────────────────────────────────────────────────────────────
export async function getStudents() {
  if (API_ENABLED) return api.get<AdminStudent[]>('/admin/students');
  return delay([...store.students]);
}
export async function setStudentBlocked(id: string, blocked: boolean) {
  if (API_ENABLED) return api.patch<AdminStudent>(`/admin/students/${id}/${blocked ? 'block' : 'unblock'}`);
  const s = store.students.find((x) => x.id === id);
  if (s) { s.status = blocked ? 'blocked' : 'active'; logAudit(store, blocked ? 'Blocked student' : 'Unblocked student', s.name); }
  return delay(s);
}

// ── Carts ───────────────────────────────────────────────────────────────
export async function getCarts() {
  if (API_ENABLED) return api.get<FoodCart[]>('/admin/carts');
  return delay([...store.carts]);
}
export async function setCartStatus(id: string, status: CartStatus) {
  if (API_ENABLED) return api.patch(`/admin/carts/${id}/status`, { status });
  const c = store.carts.find((x) => x.id === id);
  if (c) { c.status = status; logAudit(store, `Set cart ${status}`, c.label); }
  return delay(c);
}
export async function createCart(label: string) {
  if (API_ENABLED) return api.post<FoodCart>('/admin/carts', { label });
  const cart: FoodCart = { id: `cart-${store.cartSeq++}`, label, status: CartStatus.AVAILABLE, currentZoneId: null };
  store.carts.push(cart);
  logAudit(store, 'Created cart', label);
  return delay(cart);
}

// ── Zones & hostels ─────────────────────────────────────────────────────
export async function getHostels() {
  if (API_ENABLED) return api.get<AdminHostel[]>('/hostels');
  return delay([...store.hostels]);
}
export async function getZones() {
  if (API_ENABLED) return api.get<AdminZone[]>('/zones');
  return delay([...store.zones]);
}

// ── Live orders ─────────────────────────────────────────────────────────
export async function getLiveOrders() {
  if (API_ENABLED) return api.get<AdminLiveOrder[]>('/admin/orders/live');
  return delay([...store.liveOrders].sort((a, b) => b.elapsedMin - a.elapsedMin));
}

// ── Payments ────────────────────────────────────────────────────────────
export async function getPayments() {
  if (API_ENABLED) return api.get<AdminPayment[]>('/admin/payments');
  return delay([...store.payments]);
}

// ── Audit ───────────────────────────────────────────────────────────────
export async function getAuditLog() {
  if (API_ENABLED) return api.get<AuditEntry[]>('/admin/audit-logs');
  return delay([...store.audit]);
}

// ── Support ─────────────────────────────────────────────────────────────
export async function getTickets() {
  if (API_ENABLED) return api.get<SupportTicket[]>('/admin/support/tickets');
  return delay([...store.tickets]);
}
export async function resolveTicket(id: string) {
  if (API_ENABLED) return api.patch<SupportTicket>(`/admin/support/tickets/${id}/resolve`);
  const t = store.tickets.find((x) => x.id === id);
  if (t) { t.status = 'resolved'; logAudit(store, 'Resolved ticket', t.code); }
  return delay(t);
}

// ── Notifications broadcast ─────────────────────────────────────────────
export async function broadcast(audience: string, message: string) {
  if (API_ENABLED) return api.post('/admin/notifications/broadcast', { audience, message });
  logAudit(store, `Broadcast to ${audience}`, message.slice(0, 40));
  return delay({ ok: true });
}
