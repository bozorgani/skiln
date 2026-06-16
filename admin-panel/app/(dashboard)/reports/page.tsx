'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">گزارش‌ها و آمار</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          گزارش‌های تحلیلی سیستم
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            گزارش‌های آماری
          </CardTitle>
          <CardDescription>
            این بخش در حال توسعه است
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            گزارش‌های تحلیلی و نمودارها به زودی اضافه خواهند شد.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

