'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@campus-bytes/ui';
import { getStudentProfile } from '@/data/client';
import { DeliveryLocationForm } from '@/components/student/delivery-location-form';

function DeliveryAddressInner() {
  const router = useRouter();
  const params = useSearchParams();
  // Where to return after saving (defaults to profile). Only allow in-app paths.
  const nextRaw = params.get('next') ?? '/profile';
  const next = nextRaw.startsWith('/') ? nextRaw : '/profile';

  const { data, isLoading } = useQuery({ queryKey: ['student-profile'], queryFn: getStudentProfile });

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(next)}
          aria-label="Back"
          className="text-ink-700 hover:text-ink-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl font-bold text-ink-900">Delivery address</h1>
      </div>

      <p className="text-sm text-ink-600">
        Choose an approved NIMS campus location. This is saved to your profile and used for all your orders.
      </p>

      <div className="rounded-lg border border-line bg-surface p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6 text-brand-600" />
          </div>
        ) : (
          <DeliveryLocationForm
            current={data?.deliveryLocation ?? null}
            onSaved={() => router.push(next)}
          />
        )}
      </div>
    </div>
  );
}

export default function DeliveryAddressPage() {
  return (
    <Suspense fallback={null}>
      <DeliveryAddressInner />
    </Suspense>
  );
}
