'use client';

import { ArrowLeft, BellRing, CheckCircle2, Truck } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@campus-bytes/ui';

const NOTIFS = [
  {
    icon: Truck,
    title: 'Order #CB1042 is out for delivery',
    body: 'Campus Cart #03 is on the way to Larimar Hostel.',
    time: '2 min ago',
    unread: true,
  },
  {
    icon: CheckCircle2,
    title: 'Order #CB1039 delivered',
    body: 'Enjoyed your meal? Rate 365 to help other students.',
    time: 'Yesterday',
    unread: false,
  },
];

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 md:px-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="text-ink-700 hover:text-ink-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-ink-900">Notifications</h1>
      </div>

      {NOTIFS.length === 0 ? (
        <EmptyState icon={BellRing} title="No notifications" description="Order updates will appear here." />
      ) : (
        <div className="flex flex-col gap-2 pb-6">
          {NOTIFS.map((n, i) => (
            <div
              key={i}
              className={`flex gap-3 rounded-lg border p-4 ${
                n.unread ? 'border-brand-200 bg-brand-50' : 'border-line bg-surface'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-brand-600 shadow-sm">
                <n.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                <p className="text-xs text-ink-600">{n.body}</p>
                <p className="mt-1 text-2xs text-ink-400">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
