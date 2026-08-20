/** Campus Bytes — canonical enums shared across web + api. */

export const UserRole = {
  STUDENT: 'student',
  RESTAURANT: 'restaurant',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const RestaurantStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended',
} as const;
export type RestaurantStatus = (typeof RestaurantStatus)[keyof typeof RestaurantStatus];

/**
 * Order lifecycle (WebFlow v1.1 — online payment only, COD removed).
 * An order only exists once payment is captured; it starts at PLACED.
 */
export const OrderStatus = {
  PLACED: 'placed',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** Online only — no COD anywhere in the system. */
export const PaymentMethod = {
  ONLINE: 'online',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const CartStatus = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
} as const;
export type CartStatus = (typeof CartStatus)[keyof typeof CartStatus];

export const NotificationChannel = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
