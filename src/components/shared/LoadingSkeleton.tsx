import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex w-64 flex-col gap-4 border-r border-border p-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      {/* Content area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-border px-6 flex items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-[24px]" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}
