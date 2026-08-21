'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { getAccessToken } from './auth-store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? '';

const ORDER_EVENTS = [
  'ORDER_CREATED',
  'ORDER_ACCEPTED',
  'ORDER_REJECTED',
  'ORDER_PREPARING',
  'ORDER_READY',
  'ORDER_OUT_FOR_DELIVERY',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
] as const;

/**
 * Subscribe to live order events over the authenticated Socket.IO connection.
 * The server joins rooms from the JWT only, so each client receives just its own
 * events (student → their orders, restaurant → its orders, admin → all). On any
 * event we invalidate the given react-query keys so the UI updates instantly —
 * no polling. Auto-reconnects; listeners are cleaned up on unmount.
 *
 * `onEvent` is an optional side-effect (e.g. chime/toast for a new order).
 */
export function useOrderRealtime(queryKeys: QueryKey[], onEvent?: (event: string, payload: unknown) => void) {
  const qc = useQueryClient();
  const keysSig = JSON.stringify(queryKeys);

  useEffect(() => {
    if (!WS_URL) return; // realtime disabled (no backend configured)
    const token = getAccessToken();
    if (!token) return;

    const socket: Socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const handler = (event: string) => (payload: unknown) => {
      queryKeys.forEach((k) => void qc.invalidateQueries({ queryKey: k }));
      onEvent?.(event, payload);
    };
    const bound = ORDER_EVENTS.map((ev) => {
      const fn = handler(ev);
      socket.on(ev, fn);
      return [ev, fn] as const;
    });

    return () => {
      bound.forEach(([ev, fn]) => socket.off(ev, fn));
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, keysSig]);
}
