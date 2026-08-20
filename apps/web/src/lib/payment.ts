import type { CreateOrderDto, Order } from '@campus-bytes/types';
import { API_ENABLED } from './api-config';
import { api } from './api-client';
import { ApiError } from './api-client';

/**
 * Checkout entry point.
 *
 * Phase 8: when the API is live, this creates a real order via POST /orders —
 * the server validates the one-restaurant rule and prices it authoritatively.
 * Payment stays `pending`; Razorpay capture-gating arrives in Phase 10, at which
 * point this flow will open Razorpay before the order is confirmed. Until the
 * API is enabled it returns `not_implemented` (never fakes a paid order).
 */
export type CheckoutResult =
  | { status: 'ok'; orderCode: string }
  | { status: 'not_implemented' }
  | { status: 'failed'; reason: string };

export async function startCheckout(
  input: CreateOrderDto & { amount: number },
): Promise<CheckoutResult> {
  if (!API_ENABLED) return { status: 'not_implemented' };
  try {
    const order = await api.post<Order>('/orders', {
      restaurantId: input.restaurantId,
      items: input.items,
      notes: input.notes,
      deliveryZoneId: input.deliveryZoneId,
      deliveryHostelId: input.deliveryHostelId,
      deliveryRoomId: input.deliveryRoomId,
    });
    return { status: 'ok', orderCode: order.code };
  } catch (e) {
    return { status: 'failed', reason: e instanceof ApiError ? e.message : 'Could not place order' };
  }
}
