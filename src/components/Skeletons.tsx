import React from 'react';

const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
);

export const SkeletonBase = ({ className }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded ${className}`}>
    <Shimmer />
  </div>
);

export const SkeletonCard = () => (
  <div className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
    <SkeletonBase className="h-32 w-full rounded-xl" />
    <div className="space-y-2">
      <SkeletonBase className="h-4 w-3/4 rounded" />
      <SkeletonBase className="h-4 w-1/2 rounded" />
    </div>
  </div>
);

export const SkeletonList = ({ items = 3 }: { items?: number }) => (
  <div className="space-y-4">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
        <SkeletonBase className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-3 w-1/3 rounded" />
          <SkeletonBase className="h-3 w-1/4 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonWorkout = () => (
  <div className="space-y-6 p-4">
    <SkeletonBase className="h-8 w-1/2 rounded-lg" />
    <div className="grid grid-cols-1 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <SkeletonBase className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <SkeletonBase className="h-3 w-1/2 rounded" />
            <SkeletonBase className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
