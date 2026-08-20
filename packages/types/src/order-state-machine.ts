import { OrderStatus } from './enums';

/**
 * Forward-only order state machine (PRD §16, WebFlow §6).
 *
 * The single source of truth for which transitions are legal. Both the API
 * (enforcement) and the web UI (which actions to show) consume this — never
 * hardcode transitions elsewhere. Admin override is handled separately and is
 * always audit-logged.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.REJECTED,
  OrderStatus.CANCELLED,
];

/** The visible "happy path" timeline shown to students in order tracking. */
export const ORDER_TIMELINE: readonly OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

/** Students may cancel only while the order is still PLACED (before restaurant accepts). */
export function isCancellableByStudent(status: OrderStatus): boolean {
  return status === OrderStatus.PLACED;
}
