import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { loadEnv } from '../../config/env';
import type { AuthUser } from '../../common/auth/auth.types';

/**
 * Realtime transport (Socket.IO). Rooms are joined ONLY from the verified JWT —
 * never from client-supplied query params — so a restaurant can only ever receive
 * its own orders, a student only their own, and admins the live feed.
 *   student:{userId} · restaurant:{restaurantId}:orders · admin:live
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('Realtime');
  private readonly secret = loadEnv().jwt.accessSecret;

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);
    let user: AuthUser;
    try {
      user = await this.jwt.verifyAsync<AuthUser>(token ?? '', { secret: this.secret });
    } catch {
      client.disconnect(true); // reject unauthenticated sockets
      return;
    }
    // Join rooms strictly from the authenticated identity.
    if (user.role === 'student') void client.join(`student:${user.sub}`);
    if (user.role === 'restaurant' && user.restaurantId) {
      void client.join(`restaurant:${user.restaurantId}:orders`);
    }
    if (user.role === 'admin') void client.join('admin:live');
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`socket disconnected: ${client.id}`);
  }

  emitToStudent(studentId: string, event: string, payload: unknown): void {
    this.server?.to(`student:${studentId}`).emit(event, payload);
  }

  emitToRestaurant(restaurantId: string, event: string, payload: unknown): void {
    this.server?.to(`restaurant:${restaurantId}:orders`).emit(event, payload);
  }

  emitToAdmin(event: string, payload: unknown): void {
    this.server?.to('admin:live').emit(event, payload);
  }
}
