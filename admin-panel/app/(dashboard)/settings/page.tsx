'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">تنظیمات</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          تنظیمات سیستم
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            تنظیمات سیستم
          </CardTitle>
          <CardDescription>
            این بخش در حال توسعه است
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            تنظیمات سیستم به زودی اضافه خواهد شد.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

