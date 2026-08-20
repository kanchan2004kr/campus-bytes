import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

/**
 * Domain-facing realtime event surface. Order/cart flows call these; the payloads
 * and event names are stable so the frontend can subscribe in Phase 11.
 */
export const ORDER_EVENTS = {
  CREATED: 'ORDER_CREATED',
  ACCEPTED: 'ORDER_ACCEPTED',
  REJECTED: 'ORDER_REJECTED',
  PREPARING: 'ORDER_PREPARING',
  READY: 'ORDER_READY',
  OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
  DELIVERED: 'ORDER_DELIVERED',
  CANCELLED: 'ORDER_CANCELLED',
} as const;

export type OrderEvent = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger('RealtimeService');

  constructor(private readonly gateway: RealtimeGateway) {}

  /** Emit an order lifecycle event to the student, its restaurant, and admins. */
  emitOrderEvent(
    event: OrderEvent,
    order: { id: string; restaurantId: string; code: string; status: string },
  ): void {
    const payload = { event, orderId: order.id, code: order.code, status: order.status };
    this.gateway.emitToOrder(order.id, event, payload);
    this.gateway.emitToRestaurant(order.restaurantId, event, payload);
    this.gateway.emitToAdmin(event, payload);
    this.logger.debug(`${event} · order ${order.code}`);
  }
}
