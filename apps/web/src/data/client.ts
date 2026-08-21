import type { FoodItem, MenuCategory, Order, Restaurant } from '@campus-bytes/types';
import { CATEGORIES, FOOD_ITEMS, HOSTELS, ORDERS, RESTAURANTS } from './seed';
import { API_ENABLED } from '@/lib/api-config';
import { api } from '@/lib/api-client';

/**
 * Typed data-access client for the Student panel.
 *
 * Dual-mode: when API_ENABLED (NEXT_PUBLIC_API_URL set) it calls the real NestJS
 * API; otherwise it serves the in-memory seed (so the UI works with no backend).
 * Signatures match the planned REST endpoints (PRD §14) — the UI never changes.
 */

const LATENCY = 350;
const delay = <T>(value: T, ms = LATENCY): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const campusInfo = {
  deliverTo: { hostelName: 'Larimar Hostel', roomNo: '811' },
  studentName: 'Kabir',
};

export interface DeliveryLocation {
  type: 'hostel' | 'gate' | 'university';
  name: string;
  roomNo: string | null;
  instructions: string | null;
}

export interface StudentProfile {
  name: string;
  email: string;
  hostelName: string | null;
  roomNo: string | null;
  deliveryLocation: DeliveryLocation | null;
}

// In-memory delivery location for demo mode (no backend) so the selector persists
// within the session. Real mode always reads/writes the backend.
let demoDeliveryLocation: DeliveryLocation | null = null;

/** GET /students/me — the signed-in student's profile (drives greeting + deliver-to). */
export async function getStudentProfile(): Promise<StudentProfile> {
  if (API_ENABLED) return api.get<StudentProfile>('/students/me');
  return delay({
    name: 'Kabir',
    email: 'student@nims.dev',
    hostelName: 'Larimar Hostel',
    roomNo: '811',
    deliveryLocation: demoDeliveryLocation,
  });
}

/** PUT /students/me/delivery-location — save the approved campus delivery location. */
export async function saveDeliveryLocation(input: {
  type: 'hostel' | 'gate' | 'university';
  name: string;
  roomNo?: string;
  instructions?: string;
}): Promise<StudentProfile> {
  if (API_ENABLED) return api.put<StudentProfile>('/students/me/delivery-location', input);
  demoDeliveryLocation = {
    type: input.type,
    name: input.name,
    roomNo: input.roomNo?.trim() || null,
    instructions: input.instructions?.trim() || null,
  };
  return getStudentProfile();
}

/** GET /restaurants — approved + non-paused only (business rule). */
export async function getRestaurants(): Promise<Restaurant[]> {
  if (API_ENABLED) return api.get<Restaurant[]>('/restaurants');
  return delay(RESTAURANTS.filter((r) => r.status === 'approved'));
}

export async function getTopPicks(): Promise<Restaurant[]> {
  if (API_ENABLED) return api.get<Restaurant[]>('/restaurants');
  const picks = RESTAURANTS.filter((r) => r.status === 'approved').sort(
    (a, b) => b.avgRating - a.avgRating,
  );
  return delay(picks);
}

/** GET /restaurants/:id */
export async function getRestaurant(id: string): Promise<Restaurant | null> {
  if (API_ENABLED) return api.get<Restaurant>(`/restaurants/${id}`).catch(() => null);
  return delay(RESTAURANTS.find((r) => r.id === id) ?? null);
}

/** GET /restaurants/:id/menu */
export async function getMenu(
  restaurantId: string,
): Promise<{ categories: MenuCategory[]; items: FoodItem[] }> {
  if (API_ENABLED) {
    return api.get<{ categories: MenuCategory[]; items: FoodItem[] }>(`/restaurants/${restaurantId}/menu`);
  }
  return delay({
    categories: CATEGORIES.filter((c) => c.restaurantId === restaurantId).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    ),
    items: FOOD_ITEMS.filter((i) => i.restaurantId === restaurantId),
  });
}

/** GET /restaurants/search?q= */
export async function searchFood(
  query: string,
): Promise<{ items: FoodItem[]; restaurants: Restaurant[] }> {
  const q = query.trim();
  if (q.length < 2) return delay({ items: [], restaurants: [] }, 120);
  if (API_ENABLED) {
    return api.get<{ items: FoodItem[]; restaurants: Restaurant[] }>(
      `/restaurants/search?q=${encodeURIComponent(q)}`,
    );
  }
  const ql = q.toLowerCase();
  const items = FOOD_ITEMS.filter((i) => i.isAvailable && i.name.toLowerCase().includes(ql));
  const restaurants = RESTAURANTS.filter(
    (r) =>
      r.status === 'approved' &&
      (r.name.toLowerCase().includes(ql) || (r.cuisine ?? '').toLowerCase().includes(ql)),
  );
  return delay({ items, restaurants }, 200);
}

/** GET /orders (auth) */
export async function getOrders(): Promise<Order[]> {
  if (API_ENABLED) return api.get<Order[]>('/orders');
  return delay([...ORDERS].sort((a, b) => b.placedAt.localeCompare(a.placedAt)));
}

/** GET /orders/:id (auth) */
export async function getOrder(id: string): Promise<Order | null> {
  if (API_ENABLED) return api.get<Order>(`/orders/${id}`).catch(() => null);
  return delay(ORDERS.find((o) => o.id === id || o.code === id) ?? null);
}

/** GET /hostels */
export async function getHostels() {
  if (API_ENABLED) return api.get('/hostels');
  return delay(HOSTELS);
}

export function restaurantNameById(id: string): string {
  return RESTAURANTS.find((r) => r.id === id)?.name ?? 'Restaurant';
}
