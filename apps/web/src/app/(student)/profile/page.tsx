'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronRight, HelpCircle, LogOut, MapPin, Receipt, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@campus-bytes/ui';
import { getStudentProfile } from '@/data/client';
import { DeliveryLocationPicker } from '@/components/student/delivery-location-picker';
import { logout } from '@/lib/auth-api';

const MENU = [
  { icon: Receipt, label: 'Order history', href: '/orders' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: HelpCircle, label: 'Help & support', href: '/profile' },
];

const TYPE_LABEL: Record<string, string> = {
  hostel: 'Hostel',
  gate: 'Gate',
  university: 'University Location',
};

export default function ProfilePage() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });
  const studentName = data?.name ?? 'Student';
  const loc = data?.deliveryLocation ?? null;
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 md:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">Profile</h1>

      <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-peach text-brand-700">
          <User className="h-7 w-7" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">{studentName}</p>
          <p className="text-sm text-ink-600">{data?.email ?? '—'}</p>
        </div>
      </div>

      {/* Delivery location — approved campus locations only (no free-text address). */}
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display font-semibold text-ink-900">
            <MapPin className="h-4 w-4 text-brand-600" /> Delivery Location
          </h2>
          <button
            type="button"
            className="text-sm font-medium text-brand-600"
            onClick={() => setPickerOpen(true)}
          >
            {loc ? 'Change' : 'Add Location'}
          </button>
        </div>
        {loc ? (
          <div className="mt-2 text-sm">
            <p className="text-ink-500">
              Category: <span className="text-ink-800">{TYPE_LABEL[loc.type] ?? loc.type}</span>
            </p>
            <p className="text-ink-500">
              Location: <span className="font-medium text-ink-900">{loc.name}</span>
              {loc.type === 'hostel' && loc.roomNo ? ` · Room ${loc.roomNo}` : ''}
            </p>
            {loc.instructions && <p className="mt-1 text-xs italic text-ink-600">“{loc.instructions}”</p>}
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-500">
            No delivery location set. Add an approved campus location to place orders.
          </p>
        )}
      </div>
      <DeliveryLocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} current={loc} />

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {MENU.map((item, i) => (
          <Link
            key={item.label + i}
            href={item.href}
            className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 hover:bg-surface-cream"
          >
            <item.icon className="h-5 w-5 text-ink-600" />
            <span className="flex-1 text-sm font-medium text-ink-900">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-ink-400" />
          </Link>
        ))}
      </div>

      <Button variant="outline" className="text-error" block onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Log out
      </Button>

      <p className="pb-4 text-center text-2xs text-ink-400">Campus Bytes · v0.1 · NIMS University</p>
    </div>
  );
}
