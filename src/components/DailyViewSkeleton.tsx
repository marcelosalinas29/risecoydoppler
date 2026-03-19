import { Skeleton } from '@/components/ui/skeleton';

const DailyViewSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-5 w-64" />
    <div className="overflow-x-auto">
      <div className="min-w-[900px] space-y-1">
        <Skeleton className="h-8 w-full rounded" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded" />
        ))}
      </div>
    </div>
  </div>
);

export default DailyViewSkeleton;
