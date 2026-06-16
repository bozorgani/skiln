'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchAndFilterProps {
  categories?: string[];
  levels?: string[];
  onSearchChange?: (search: string) => void;
  onFilterChange?: (filters: { category?: string; level?: string }) => void;
}

export default function SearchAndFilter({
  categories = ['توسعه وب', 'برنامه‌نویسی', 'طراحی', 'کسب و کار', 'بازاریابی'],
  levels = ['Beginner', 'Intermediate', 'Advanced'],
  onSearchChange,
  onFilterChange,
}: SearchAndFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [category, setCategory] = useState(searchParams?.get('category') || '');
  const [level, setLevel] = useState(searchParams?.get('level') || '');
  const [showFilters, setShowFilters] = useState(false);
  const lastCategoryRef = useRef(category);
  const lastLevelRef = useRef(level);

  const debouncedSearch = useDebounce(search, 500);

  // Handle debounced search when callbacks are provided
  useEffect(() => {
    if (onSearchChange && debouncedSearch) {
      const currentSearch = searchParams?.get('search') || '';
      // Only call if search actually changed (not from URL)
      if (debouncedSearch !== currentSearch) {
        onSearchChange(debouncedSearch);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Auto-update URL when category or level changes (but not for search - user must press Enter or Search button)
  useEffect(() => {
    // Only call if category or level actually changed
    const categoryChanged = category !== lastCategoryRef.current;
    const levelChanged = level !== lastLevelRef.current;
    
    if (!categoryChanged && !levelChanged) {
      return;
    }
    
    // Update refs
    lastCategoryRef.current = category;
    lastLevelRef.current = level;
    
    // If callbacks are provided, use them instead of URL updates
    if (onFilterChange) {
      onFilterChange({ category: category || undefined, level: level || undefined });
      return;
    }
    
    // If category or level changed, update URL immediately
    const currentSearch = searchParams?.get('search') || '';
    const params = new URLSearchParams();
    if (currentSearch) params.set('search', currentSearch); // Keep current search
    if (category) params.set('category', category);
    if (level) params.set('level', level);
    params.set('page', '1');
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, level]);

  const handleSearch = useCallback(() => {
    // If callbacks are provided, use them instead of URL updates
    if (onSearchChange || onFilterChange) {
      if (onSearchChange) {
        onSearchChange(debouncedSearch);
      }
      if (onFilterChange) {
        onFilterChange({ 
          search: debouncedSearch || undefined,
          category: category || undefined, 
          level: level || undefined 
        });
      }
      return;
    }
    
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (category) params.set('category', category);
    if (level) params.set('level', level);
    params.set('page', '1'); // Reset to first page
    router.push(`/?${params.toString()}`);
  }, [debouncedSearch, category, level, router, onSearchChange, onFilterChange]);

  const handleClear = () => {
    setSearch('');
    setCategory('');
    setLevel('');
    
    // If callbacks are provided, use them instead of URL updates
    if (onSearchChange || onFilterChange) {
      if (onSearchChange) {
        onSearchChange('');
      }
      if (onFilterChange) {
        onFilterChange({});
      }
      return;
    }
    
    router.push('/');
  };

  const hasFilters = search || category || level;

  return (
    <Card className="mb-6 md:mb-8">
      <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
        <div className="space-y-3 md:space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی دوره‌ها..."
              className="pr-10 pl-10 text-sm sm:text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              فیلترها
              {hasFilters && (
                <span className="mr-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {[search, category, level].filter(Boolean).length}
                </span>
              )}
            </Button>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="w-full sm:w-auto">
                پاک کردن همه
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t">
              <div>
                <label className="text-xs sm:text-sm font-medium mb-2 block">دسته‌بندی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 sm:h-10 px-3 rounded-md border border-input bg-background text-xs sm:text-sm"
                >
                  <option value="">همه دسته‌بندی‌ها</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium mb-2 block">سطح</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full h-9 sm:h-10 px-3 rounded-md border border-input bg-background text-xs sm:text-sm"
                >
                  <option value="">همه سطوح</option>
                  {levels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl === 'Beginner' ? 'مبتدی' : lvl === 'Intermediate' ? 'متوسط' : 'پیشرفته'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              {search && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-secondary rounded-full">
                  <span className="hidden sm:inline">جستجو: </span>
                  <span className="truncate max-w-[150px] sm:max-w-none">{search}</span>
                  <button
                    onClick={() => setSearch('')}
                    className="mr-1 hover:text-destructive flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-secondary rounded-full">
                  <span className="hidden sm:inline">دسته‌بندی: </span>
                  <span>{category}</span>
                  <button
                    onClick={() => setCategory('')}
                    className="mr-1 hover:text-destructive flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {level && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-secondary rounded-full">
                  <span className="hidden sm:inline">سطح: </span>
                  <span>{level === 'Beginner' ? 'مبتدی' : level === 'Intermediate' ? 'متوسط' : 'پیشرفته'}</span>
                  <button
                    onClick={() => setLevel('')}
                    className="mr-1 hover:text-destructive flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Search Button */}
          <Button onClick={handleSearch} className="w-full sm:w-auto text-sm sm:text-base">
            <Search className="h-4 w-4 ml-2" />
            جستجو
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

