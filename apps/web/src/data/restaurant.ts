import {
  CartStatus,
  OrderStatus,
  canTransition,
  type FoodCart,
} from '@campus-bytes/types';
import { API_ENABLED } from '@/lib/api-config';
import { api } from '@/lib/api-client';

/**
 * Restaurant Panel data layer — in-memory, mutable, API-shaped.
 *
 * Represents the currently signed-in restaurant (Vista Colline). Every function
 * mirrors a planned endpoint in PRD §14.5 so Phase 7 replaces the bodies with
 * real HTTP calls without touching any screen.
 *
 * State lives on `globalThis` so it survives module re-evaluation under Next's
 * bundling (a single shared instance across server/client graphs) — the same
 * pattern used for singletons like Prisma in Next.js.
 */

export const CURRENT_RESTAURANT = {
  id: 'r-vista',
  name: 'Vista Colline',
  cuisine: 'Chai · Snacks · Combos',
};

export interface RestaurantOrderItem {
  name: string;
  quantity: number;
  price: number;
  isVeg: boolean;
}

export interface RestaurantOrder {
  id: string;
  code: string;
  studentName: string;
  studentId2?: string | null; // university student ID
  hostelName: string;
  roomNo: string;
  // Approved delivery-location snapshot (works for hostel/gate/university).
  deliveryType?: string | null;
  deliveryLocationName?: string | null;
  deliveryRoomNo?: string | null;
  deliveryInstructions?: string | null;
  items: RestaurantOrderItem[];
  itemTotal: number;
  notes: string | null;
  status: OrderStatus;
  prepTimeMin: number | null;
  rejectionReason: string | null;
  cartId: string | null;
  cartLabel: string | null;
  placedAt: string;
  acceptedAt: string | null;
}

const LATENCY = 250;
const delay = <T>(v: T, ms = LATENCY): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms));
const nowIso = (offsetMin = 0) => new Date(Date.now() + offsetMin * 60000).toISOString();
const sum = (items: RestaurantOrderItem[]) => items.reduce((s, i) => s + i.price * i.quantity, 0);

interface Store {
  orders: RestaurantOrder[];
  history: RestaurantOrder[];
  carts: FoodCart[];
  paused: boolean;
  manuallyClosed: boolean;
  seq: number;
}

function makeOrder(
  seq: { n: number },
  p: Partial<RestaurantOrder> & Pick<RestaurantOrder, 'items' | 'status'>,
): RestaurantOrder {
  return {
    id: p.id ?? `ord-${seq.n++}`,
    code: p.code ?? `CB${1050 + seq.n}`,
    studentName: p.studentName ?? 'Student',
    studentId2: p.studentId2 ?? null,
    hostelName: p.hostelName ?? 'Larimar Hostel',
    roomNo: p.roomNo ?? '000',
    deliveryType: p.deliveryType ?? 'hostel',
    deliveryLocationName: p.deliveryLocationName ?? p.hostelName ?? 'Larimar',
    deliveryRoomNo: p.deliveryRoomNo ?? p.roomNo ?? '000',
    deliveryInstructions: p.deliveryInstructions ?? null,
    items: p.items,
    itemTotal: sum(p.items),
    notes: p.notes ?? null,
    status: p.status,
    prepTimeMin: p.prepTimeMin ?? null,
    rejectionReason: p.rejectionReason ?? null,
    cartId: p.cartId ?? null,
    cartLabel: p.cartLabel ?? null,
    placedAt: p.placedAt ?? nowIso(),
    acceptedAt: p.acceptedAt ?? null,
  };
}

function seed(): Store {
  const seq = { n: 0 };
  const orders: RestaurantOrder[] = [
    makeOrder(seq, {
      code: 'CB1048',
      studentName: 'Aarav Mehta',
      hostelName: 'Larimar Hostel',
      roomNo: '811',
      items: [
        { name: 'Masala Maggie', quantity: 2, price: 60, isVeg: true },
        { name: 'Masala Chai', quantity: 2, price: 20, isVeg: true },
      ],
      notes: 'Extra spicy, no capsicum',
      status: OrderStatus.PLACED,
      placedAt: nowIso(-1),
    }),
    makeOrder(seq, {
      code: 'CB1047',
      studentName: 'Priya Nair',
      hostelName: 'Vista Hostel',
      roomNo: '204',
      items: [{ name: 'Paneer Tikka Roll', quantity: 1, price: 110, isVeg: true }],
      status: OrderStatus.PLACED,
      placedAt: nowIso(-3),
    }),
    makeOrder(seq, {
      code: 'CB1045',
      studentName: 'Rohan Das',
      hostelName: 'LG Hostel',
      roomNo: '512',
      items: [
        { name: 'Chole Bhature Combo', quantity: 1, price: 140, isVeg: true },
        { name: 'Cold Coffee', quantity: 1, price: 90, isVeg: true },
      ],
      notes: 'Call on arrival',
      status: OrderStatus.PREPARING,
      prepTimeMin: 15,
      placedAt: nowIso(-9),
      acceptedAt: nowIso(-8),
    }),
    makeOrder(seq, {
      code: 'CB1044',
      studentName: 'Sana Kapoor',
      hostelName: 'Larimar Hostel',
      roomNo: '733',
      items: [{ name: 'Aloo Paratha (2 pcs)', quantity: 2, price: 80, isVeg: true }],
      status: OrderStatus.READY,
      prepTimeMin: 12,
      placedAt: nowIso(-16),
      acceptedAt: nowIso(-15),
    }),
  ];

  const history: RestaurantOrder[] = [
    makeOrder(seq, {
      code: 'CB1039',
      studentName: 'Kabir Singh',
      roomNo: '811',
      items: [{ name: 'Masala Maggie', quantity: 1, price: 60, isVeg: true }],
      status: OrderStatus.DELIVERED,
      prepTimeMin: 10,
      placedAt: nowIso(-180),
      cartId: 'cart-01',
      cartLabel: 'Campus Cart #01',
    }),
    makeOrder(seq, {
      code: 'CB1036',
      studentName: 'Neha Verma',
      roomNo: '145',
      items: [{ name: 'Chole Bhature Combo', quantity: 2, price: 140, isVeg: true }],
      status: OrderStatus.DELIVERED,
      prepTimeMin: 18,
      placedAt: nowIso(-240),
      cartId: 'cart-03',
      cartLabel: 'Campus Cart #03',
    }),
    makeOrder(seq, {
      code: 'CB1031',
      studentName: 'Imran Khan',
      roomNo: '609',
      items: [{ name: 'Paneer Tikka Roll', quantity: 1, price: 110, isVeg: true }],
      status: OrderStatus.REJECTED,
      rejectionReason: 'Item out of stock',
      placedAt: nowIso(-300),
    }),
  ];

  return {
    orders,
    history,
    carts: [
      { id: 'cart-01', label: 'Campus Cart #01', status: CartStatus.AVAILABLE, currentZoneId: null },
      { id: 'cart-02', label: 'Campus Cart #02', status: CartStatus.BUSY, currentZoneId: null },
      { id: 'cart-03', label: 'Campus Cart #03', status: CartStatus.AVAILABLE, currentZoneId: null },
    ],
    paused: false,
    manuallyClosed: false,
    seq: 1052,
  };
}

const g = globalThis as unknown as { __cbRestaurantStore?: Store };
const store: Store = g.__cbRestaurantStore ?? (g.__cbRestaurantStore = seed());

// ── Queries ─────────────────────────────────────────────────────────────
export async function getLiveOrders(): Promise<RestaurantOrder[]> {
  if (API_ENABLED) return api.get<RestaurantOrder[]>('/restaurant/orders/live');
  return delay([...store.orders].sort((a, b) => a.placedAt.localeCompare(b.placedAt)));
}

export async function getRestaurantSummary(): Promise<{
  newCount: number; preparingCount: number; readyCount: number;
  todaysOrders: number; todaysRevenue: number; avgPrepMin?: number; paused: boolean; isOpen: boolean;
}> {
  if (API_ENABLED) return api.get('/restaurant/orders/summary');
  const delivered = store.history.filter((o) => o.status === OrderStatus.DELIVERED);
  const revenue = delivered.reduce((s, o) => s + o.itemTotal, 0);
  const withPrep = [...store.orders, ...store.history].filter((o) => o.prepTimeMin);
  return delay({
    newCount: store.orders.filter((o) => o.status === OrderStatus.PLACED).length,
    preparingCount: store.orders.filter((o) => o.status === OrderStatus.PREPARING).length,
    readyCount: store.orders.filter((o) => o.status === OrderStatus.READY).length,
    todaysOrders: delivered.length + store.orders.length,
    todaysRevenue: revenue + store.orders.reduce((s, o) => s + o.itemTotal, 0),
    avgPrepMin: Math.round(withPrep.reduce((s, o) => s + (o.prepTimeMin ?? 0), 0) / Math.max(1, withPrep.length)),
    paused: store.paused,
    isOpen: !store.paused && !store.manuallyClosed,
  });
}

export async function getOrderHistory(): Promise<RestaurantOrder[]> {
  if (API_ENABLED) return api.get<RestaurantOrder[]>('/restaurant/orders/history');
  return delay([...store.history].sort((a, b) => b.placedAt.localeCompare(a.placedAt)));
}

export async function getCarts(): Promise<FoodCart[]> {
  if (API_ENABLED) return api.get<FoodCart[]>('/restaurant/carts');
  return delay([...store.carts]);
}

export interface SalesReport {
  todaysRevenue: number;
  todaysOrders: number;
  avgOrderValue: number;
  completionRate: number;
  ordersByHour: { label: string; value: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
}

export async function getSales(): Promise<SalesReport> {
  if (API_ENABLED) return api.get<SalesReport>('/restaurant/orders/sales');
  const all = [...store.orders, ...store.history];
  const delivered = store.history.filter((o) => o.status === OrderStatus.DELIVERED);
  const rejected = store.history.filter((o) => o.status === OrderStatus.REJECTED);
  const revenue = delivered.reduce((s, o) => s + o.itemTotal, 0);
  const completed = delivered.length;
  const total = completed + rejected.length;

  const ordersByHour = [
    { label: '8a', value: 4 },
    { label: '10a', value: 7 },
    { label: '12p', value: 18 },
    { label: '2p', value: 12 },
    { label: '4p', value: 6 },
    { label: '6p', value: 9 },
    { label: '8p', value: 21 },
    { label: '10p', value: 14 },
  ];

  const itemMap = new Map<string, { qty: number; revenue: number }>();
  for (const o of all) {
    for (const it of o.items) {
      const cur = itemMap.get(it.name) ?? { qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += it.price * it.quantity;
      itemMap.set(it.name, cur);
    }
  }
  const topItems = [...itemMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return delay({
    todaysRevenue: revenue + store.orders.reduce((s, o) => s + o.itemTotal, 0),
    todaysOrders: delivered.length + store.orders.length,
    avgOrderValue: completed ? Math.round(revenue / completed) : 0,
    completionRate: total ? Math.round((completed / total) * 100) : 100,
    ordersByHour,
    topItems,
  });
}

// ── Mutations (state-machine enforced) ──────────────────────────────────
function find(id: string) {
  const o = store.orders.find((x) => x.id === id);
  if (!o) throw new Error('Order not found');
  return o;
}

function moveToHistory(o: RestaurantOrder) {
  const idx = store.orders.findIndex((x) => x.id === o.id);
  if (idx >= 0) {
    store.orders.splice(idx, 1);
    store.history.unshift(o);
  }
}

export async function acceptOrder(id: string, prepTimeMin: number) {
  if (API_ENABLED) return api.post(`/restaurant/orders/${id}/accept`, { prepTimeMin });
  const o = find(id);
  if (!canTransition(o.status, OrderStatus.ACCEPTED)) throw new Error('Invalid transition');
  o.status = OrderStatus.PREPARING;
  o.prepTimeMin = prepTimeMin;
  o.acceptedAt = nowIso();
  return delay(o);
}

export async function rejectOrder(id: string, reason: string) {
  if (API_ENABLED) return api.post(`/restaurant/orders/${id}/reject`, { reason });
  const o = find(id);
  if (!canTransition(o.status, OrderStatus.REJECTED)) throw new Error('Invalid transition');
  o.status = OrderStatus.REJECTED;
  o.rejectionReason = reason;
  moveToHistory(o);
  return delay(o);
}

export async function markReady(id: string) {
  if (API_ENABLED) return api.post(`/restaurant/orders/${id}/ready`);
  const o = find(id);
  if (!canTransition(o.status, OrderStatus.READY)) throw new Error('Invalid transition');
  o.status = OrderStatus.READY;
  return delay(o);
}

export async function assignCart(id: string, cartId: string) {
  if (API_ENABLED) return api.post<RestaurantOrder>(`/restaurant/orders/${id}/assign-cart`, { cartId });
  const o = find(id);
  if (!canTransition(o.status, OrderStatus.OUT_FOR_DELIVERY)) throw new Error('Invalid transition');
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) throw new Error('Cart not found');
  if (cart.status !== CartStatus.AVAILABLE) throw new Error('Cart not available');
  cart.status = CartStatus.BUSY;
  o.status = OrderStatus.OUT_FOR_DELIVERY;
  o.cartId = cart.id;
  o.cartLabel = cart.label;
  return delay(o);
}

export async function markDelivered(id: string) {
  if (API_ENABLED) return api.post(`/restaurant/orders/${id}/delivered`);
  const o = find(id);
  if (!canTransition(o.status, OrderStatus.DELIVERED)) throw new Error('Invalid transition');
  o.status = OrderStatus.DELIVERED;
  const cart = store.carts.find((c) => c.id === o.cartId);
  if (cart) cart.status = CartStatus.AVAILABLE;
  moveToHistory(o);
  return delay(o);
}

export async function setPaused(next: boolean) {
  if (API_ENABLED) return api.patch('/restaurant/status', { paused: next });
  store.paused = next;
  return delay({ paused: store.paused, isOpen: !store.paused && !store.manuallyClosed });
}

// ── Demo affordance (replaced by WebSocket push in Phase 11) ─────────────
const DEMO_STUDENTS = [
  { studentName: 'Diya Sharma', hostelName: 'Vista Hostel', roomNo: '318' },
  { studentName: 'Karan Patel', hostelName: 'LP Hostel', roomNo: '106' },
  { studentName: 'Ananya Rao', hostelName: 'Larimar Hostel', roomNo: '922' },
];
const DEMO_ITEMS: RestaurantOrderItem[][] = [
  [{ name: 'Masala Maggie', quantity: 1, price: 60, isVeg: true }, { name: 'Masala Chai', quantity: 1, price: 20, isVeg: true }],
  [{ name: 'Chole Bhature Combo', quantity: 1, price: 140, isVeg: true }],
  [{ name: 'Paneer Tikka Roll', quantity: 2, price: 110, isVeg: true }],
];

export async function simulateIncomingOrder(): Promise<RestaurantOrder> {
  const who = DEMO_STUDENTS[Math.floor(Math.random() * DEMO_STUDENTS.length)]!;
  const what = DEMO_ITEMS[Math.floor(Math.random() * DEMO_ITEMS.length)]!;
  store.seq += 1;
  const order = makeOrder({ n: store.seq }, {
    ...who,
    code: `CB${store.seq}`,
    items: what,
    status: OrderStatus.PLACED,
    placedAt: nowIso(),
  });
  store.orders.push(order);
  return delay(order, 50);
}
