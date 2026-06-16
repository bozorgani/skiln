'use client';

import { Suspense } from 'react';
import SearchAndFilter from './SearchAndFilter';

export default function SearchAndFilterClient() {
  return (
    <Suspense fallback={<div className="mb-8 h-32 bg-muted animate-pulse rounded-lg" />}>
      <SearchAndFilter />
    </Suspense>
  );
}

