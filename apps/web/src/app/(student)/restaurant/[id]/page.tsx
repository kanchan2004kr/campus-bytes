'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Star, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, EmptyState, ErrorState, Skeleton } from '@campus-bytes/ui';
import { getMenu, getRestaurant } from '@/data/client';
import { FoodCard } from '@/components/student/food-card';
import { CartBar } from '@/components/student/cart-bar';

export default function RestaurantDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const restaurantQuery = useQuery({ queryKey: ['restaurant', id], queryFn: () => getRestaurant(id) });
  const menuQuery = useQuery({ queryKey: ['menu', id], queryFn: () => getMenu(id) });

  const r = restaurantQuery.data;

  if (restaurantQuery.isError) {
    return (
      <div className="p-6">
        <ErrorState onRetry={() => restaurantQuery.refetch()} />
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* Header image */}
      <div className="relative aspect-[16/9] w-full bg-surface-cream md:aspect-[21/9]">
        {restaurantQuery.isLoading ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : (
          r?.coverUrl && (
            <Image src={r.coverUrl} alt={r.name} fill priority className="object-cover" sizes="100vw" />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
        <Link
          href="/food"
          aria-label="Back"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-bg/90 text-ink-900 shadow-sm backdrop-blur hover:bg-bg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      {/* Restaurant meta card overlapping the image */}
      <div className="relative -mt-8 px-4 md:px-6">
        <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
          {restaurantQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : r ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink-900">{r.name}</h1>
                  <p className="mt-0.5 text-sm text-ink-600">{r.cuisine}</p>
                </div>
                <span className="flex items-center gap-1 rounded-md bg-success-soft px-2 py-1 text-sm font-semibold text-success">
                  <Star className="h-4 w-4 fill-success text-success" />
                  {r.avgRating.toFixed(1)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={r.isOpen && !r.isPaused ? 'success' : 'error'} size="sm">
                  {r.isOpen && !r.isPaused ? 'Open now' : 'Closed'}
                </Badge>
                <Badge tone="neutral" size="sm">
                  <Clock className="h-3 w-3" /> {r.prepTimeMin} min prep
                </Badge>
                {r.deliveryAvailable && (
                  <Badge tone="brand" size="sm">
                    <Truck className="h-3 w-3" /> Cart delivery
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="Outlet not found" description="This outlet may no longer be available." />
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="mt-6 px-4 md:px-6">
        {menuQuery.isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-24 w-24 rounded-md" />
              </div>
            ))}
          </div>
        ) : menuQuery.isError ? (
          <ErrorState onRetry={() => menuQuery.refetch()} />
        ) : (
          menuQuery.data?.categories.map((cat) => {
            const items = menuQuery.data.items.filter((i) => i.categoryId === cat.id);
            if (items.length === 0) return null;
            return (
              <section key={cat.id} className="mb-6">
                <h2 className="mb-1 font-display text-lg font-semibold text-ink-900">{cat.name}</h2>
                <div className="divide-y divide-line">
                  {items.map((item) => (
                    <FoodCard key={item.id} item={item} restaurantName={r?.name ?? ''} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      <CartBar />
    </div>
  );
}
