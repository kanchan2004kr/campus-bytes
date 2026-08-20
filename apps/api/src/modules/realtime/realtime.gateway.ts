import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

/**
 * Realtime transport (Socket.IO). Order events are emitted through RealtimeService,
 * which delegates here. Channels mirror PRD §14.9:
 *   order:{orderId} · restaurant:{id}:orders · admin:live
 *
 * Auth handshake + Redis adapter are wired in Phase 11; the emit surface is ready now.
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('Realtime');

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    const { orderId, restaurantId, admin } = client.handshake.query;
    if (typeof orderId === 'string') void client.join(`order:${orderId}`);
    if (typeof restaurantId === 'string') void client.join(`restaurant:${restaurantId}:orders`);
    if (admin === '1') void client.join('admin:live');
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`socket disconnected: ${client.id}`);
  }

  emitToOrder(orderId: string, event: string, payload: unknown): void {
    this.server?.to(`order:${orderId}`).emit(event, payload);
  }

  emitToRestaurant(restaurantId: string, event: string, payload: unknown): void {
    this.server?.to(`restaurant:${restaurantId}:orders`).emit(event, payload);
  }

  emitToAdmin(event: string, payload: unknown): void {
    this.server?.to('admin:live').emit(event, payload);
  }
}
