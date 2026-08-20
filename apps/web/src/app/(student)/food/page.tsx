'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { EmptyState, ErrorState } from '@campus-bytes/ui';
import { getRestaurants, searchFood } from '@/data/client';
import { SearchBar } from '@/components/student/search-bar';
import { RestaurantCard } from '@/components/student/restaurant-card';
import { RestaurantCardSkeleton } from '@/components/student/restaurant-card-skeleton';
import { FoodCard } from '@/components/student/food-card';
import { restaurantNameById } from '@/data/client';

function FoodContent() {
  const params = useSearchParams();
  const q = params.get('q')?.trim() ?? '';
  const isSearching = q.length >= 2;

  const allQuery = useQuery({
    queryKey: ['restaurants'],
    queryFn: getRestaurants,
    enabled: !isSearching,
  });
  const searchQuery = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchFood(q),
    enabled: isSearching,
  });

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 md:px-6 md:pt-6">
      <div>
        <h1 className="mb-3 font-display text-2xl font-bold text-ink-900">
          {isSearching ? `Results for “${q}”` : 'Campus outlets'}
        </h1>
        <SearchBar defaultValue={q} autoFocus={isSearching} />
      </div>

      {isSearching ? (
        searchQuery.isError ? (
          <ErrorState onRetry={() => searchQuery.refetch()} />
        ) : searchQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        ) : (searchQuery.data?.items.length ?? 0) + (searchQuery.data?.restaurants.length ?? 0) === 0 ? (
          <EmptyState
            title="No matches found"
            description={`We couldn’t find anything for “${q}”. Try another dish or outlet.`}
          />
        ) : (
          <div className="flex flex-col gap-6 pb-6">
            {(searchQuery.data?.restaurants.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Outlets
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {searchQuery.data?.restaurants.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
                  ))}
                </div>
              </section>
            )}
            {(searchQuery.data?.items.length ?? 0) > 0 && (
              <section>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Dishes
                </h2>
                <div className="divide-y divide-line rounded-lg border border-line bg-surface px-4">
                  {searchQuery.data?.items.map((item) => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      restaurantName={restaurantNameById(item.restaurantId)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      ) : allQuery.isError ? (
        <ErrorState onRetry={() => allQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-6 sm:grid-cols-2">
          {allQuery.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
            : allQuery.data?.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      )}
    </div>
  );
}

export default function FoodPage() {
  return (
    <Suspense>
      <FoodContent />
    </Suspense>
  );
}
