'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { getStudentProfile } from '@/data/client';

/**
 * Home/top header. The delivery address here is DISPLAY-ONLY — students change
 * it from Profile → Delivery Address or during checkout, never from Home. No
 * address form/modal is mounted here.
 */
export function StudentTopBar() {
  const { data } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });
  const loc = data?.deliveryLocation ?? null;
  const label = loc
    ? loc.type === 'hostel' && loc.roomNo
      ? `${loc.name}, Room ${loc.roomNo}`
      : loc.name
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="flex w-full items-center gap-2 overflow-hidden px-3 py-2.5 sm:gap-3 sm:px-4 md:px-6">
        {/* Left: logo + address. Takes remaining space and shrinks/truncates. */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link href="/" aria-label="CampusBytes home" className="shrink-0">
            <Logo size={28} />
          </Link>

          {/* Display-only delivery address (no form/modal on Home). */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-2xs font-medium uppercase tracking-wide text-ink-400">
                Delivery address
              </span>
              {label ? (
                <span className="truncate text-sm font-semibold text-ink-900">{label}</span>
              ) : (
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink-900">
                  <span className="truncate">Not added</span>
                  <Link
                    href="/delivery-address?next=/"
                    className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Add
                  </Link>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Right: fixed action icons — never shrink, always tappable. */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
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
