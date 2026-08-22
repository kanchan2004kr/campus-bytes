'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@campus-bytes/ui';
import { getRestaurants, getTopPicks } from '@/data/client';
import { Hero } from '@/components/student/hero';
import { SearchBar } from '@/components/student/search-bar';
import { CampusStats } from '@/components/student/campus-stats';
import { SectionHeader } from '@/components/student/section-header';
import { RestaurantCard } from '@/components/student/restaurant-card';
import { RestaurantCardSkeleton } from '@/components/student/restaurant-card-skeleton';

export default function StudentHomePage() {
  const restaurantsQuery = useQuery({ queryKey: ['restaurants'], queryFn: getRestaurants });
  const topPicksQuery = useQuery({ queryKey: ['top-picks'], queryFn: getTopPicks });

  const restaurants = restaurantsQuery.data ?? [];
  // Don't repeat the "Top picks" outlets in the "All campus outlets" grid.
  const topIds = new Set((topPicksQuery.data ?? []).slice(0, 4).map((r) => r.id));
  const otherOutlets = restaurants.filter((r) => !topIds.has(r.id));
  const openCount = restaurants.filter((r) => r.isOpen && !r.isPaused).length;
  const avgWait = openCount
    ? Math.round(
        restaurants.filter((r) => r.isOpen).reduce((s, r) => s + r.prepTimeMin, 0) / openCount,
      )
    : 0;

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 md:px-6 md:pt-6">
      <Hero />

      <div className="flex flex-col gap-4">
        <SearchBar />
        <CampusStats
          avgWaitMin={avgWait || 12}
          outletsOpen={openCount}
          outletsTotal={restaurants.length || 4}
          deliveryEtaMin={(avgWait || 12) + 8}
        />
      </div>

      <section>
        <SectionHeader title="Top picks for you" seeAllHref="/food" />
        {topPicksQuery.isError ? (
          <ErrorState onRetry={() => topPicksQuery.refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {topPicksQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
              : topPicksQuery.data
                  ?.slice(0, 4)
                  .map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </section>

      <section className="pb-4">
        <SectionHeader title="All campus outlets" />
        {restaurantsQuery.isError ? (
          <ErrorState onRetry={() => restaurantsQuery.refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {restaurantsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
              : otherOutlets.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </section>
    </div>
  );
}
