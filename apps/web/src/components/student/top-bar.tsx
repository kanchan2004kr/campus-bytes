'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { getStudentProfile } from '@/data/client';

export function StudentTopBar() {
  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });
  const deliverTo = { hostelName: data?.hostelName ?? '—', roomNo: data?.roomNo ?? '—' };
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Campus Bytes home">
            <Logo showWordmark={false} size={30} className="md:hidden" />
            <Logo size={30} className="hidden md:inline-flex" />
          </Link>
          <button className="flex items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-surface-cream">
            <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="flex flex-col leading-tight">
              <span className="text-2xs font-medium uppercase tracking-wide text-ink-400">
                Deliver to
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold text-ink-900">
                {deliverTo.hostelName} · Room {deliverTo.roomNo}
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
              </span>
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-surface-cream"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-bg" />
          </Link>
          <Link
            href="/profile"
            aria-label="Profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-peach text-brand-700 transition-colors hover:bg-brand-100"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
