'use client';

import { useQuery } from '@tanstack/react-query';
import { OrderStatus } from '@campus-bytes/types';
import { useEffect, useRef } from 'react';
import { toast } from '@campus-bytes/ui';
import { getLiveOrders } from '@/data/restaurant';
import { useOrderRealtime } from '@/lib/realtime';

/**
 * Watches live orders and fires a chime + toast when a new PLACED order arrives.
 * Realtime: a Socket.IO ORDER_* event instantly refetches the live-orders query;
 * the 20s poll is only a reconnect fallback.
 */
export function NewOrderWatcher() {
  // Instant updates over the authenticated socket (restaurant only receives its
  // own restaurant's events). Refetch on any order event.
  useOrderRealtime([['r-orders']]);

  const { data } = useQuery({
    queryKey: ['r-orders'],
    queryFn: getLiveOrders,
    refetchInterval: 20000,
  });
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!data) return;
    const placedIds = data.filter((o) => o.status === OrderStatus.PLACED).map((o) => o.id);

    // First run: record baseline without alerting.
    if (seen.current === null) {
      seen.current = new Set(placedIds);
      return;
    }
    const fresh = placedIds.filter((id) => !seen.current!.has(id));
    if (fresh.length > 0) {
      playChime();
      const order = data.find((o) => o.id === fresh[0]);
      toast({
        tone: 'info',
        title: `New order · ${order?.code ?? ''}`,
        description: `${order?.studentName ?? 'A student'} · ${order?.hostelName ?? ''}`,
        duration: 6000,
      });
    }
    seen.current = new Set(placedIds);
  }, [data]);

  return null;
}

function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [880, 1174];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.32);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio not available — silent fallback */
  }
}
