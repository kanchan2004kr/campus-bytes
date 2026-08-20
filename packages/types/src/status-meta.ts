import { CartStatus, OrderStatus } from './enums';

export type StatusTone = 'info' | 'warning' | 'success' | 'error' | 'brand' | 'muted';

/** UI presentation metadata for order statuses — single source for labels + tones. */
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  [OrderStatus.PLACED]: { label: 'Order placed', tone: 'info' },
  [OrderStatus.ACCEPTED]: { label: 'Accepted', tone: 'info' },
  [OrderStatus.PREPARING]: { label: 'Preparing', tone: 'warning' },
  [OrderStatus.READY]: { label: 'Ready', tone: 'brand' },
  [OrderStatus.OUT_FOR_DELIVERY]: { label: 'Out for delivery', tone: 'brand' },
  [OrderStatus.DELIVERED]: { label: 'Delivered', tone: 'success' },
  [OrderStatus.REJECTED]: { label: 'Rejected', tone: 'error' },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', tone: 'error' },
};

export const CART_STATUS_META: Record<CartStatus, { label: string; tone: StatusTone }> = {
  [CartStatus.AVAILABLE]: { label: 'Available', tone: 'success' },
  [CartStatus.BUSY]: { label: 'Busy', tone: 'warning' },
  [CartStatus.OFFLINE]: { label: 'Offline', tone: 'muted' },
};
