'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden border-2 border-border/50">
      <Skeleton className="h-[200px] w-full rounded-none" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </Card>
  );
}
