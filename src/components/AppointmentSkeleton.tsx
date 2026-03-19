import { Skeleton } from '@/components/ui/skeleton';

const AppointmentSkeleton = () => (
  <div className="p-4 space-y-4 max-w-2xl mx-auto">
    {/* Patient card */}
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
    {/* Report */}
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-40 w-full rounded" />
      <Skeleton className="h-10 w-full" />
    </div>
    {/* Images */}
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export default AppointmentSkeleton;
