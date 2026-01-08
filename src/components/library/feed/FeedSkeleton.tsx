/**
 * Skeleton loader for Feed cards
 * Animated placeholder while content loads
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedSkeletonProps {
  count?: number;
}

const SingleSkeleton: React.FC = () => (
  <div className="space-y-3">
    {/* Header skeleton */}
    <div className="flex items-center justify-between px-1">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    
    {/* Image skeleton - 4:5 ratio */}
    <Skeleton className="aspect-[4/5] w-full max-h-[400px] rounded-lg" />
    
    {/* Metadata skeleton */}
    <div className="flex items-center gap-3 px-1">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
    </div>
    
    {/* Actions skeleton */}
    <div className="flex items-center gap-2 px-1 pb-4 border-b border-border">
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-8 w-32 rounded-md" />
    </div>
  </div>
);

const FeedSkeleton: React.FC<FeedSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <SingleSkeleton key={index} />
      ))}
    </div>
  );
};

export default FeedSkeleton;
