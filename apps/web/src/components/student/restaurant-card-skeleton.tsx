import { Skeleton } from '@campus-bytes/ui';

export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-1 flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-pill" />
          <Skeleton className="h-5 w-20 rounded-pill" />
        </div>
      </div>
    </div>
  );
}
