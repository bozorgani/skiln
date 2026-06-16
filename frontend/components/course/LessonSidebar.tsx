'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Lock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface LessonSidebarProps {
  courseId: string;
  lessons: any[];
  currentLessonId: string;
  enrollment: any;
  isAdmin?: boolean;
}

export default function LessonSidebar({
  courseId,
  lessons,
  currentLessonId,
  enrollment,
  isAdmin: isAdminProp,
}: LessonSidebarProps) {
  const { user } = useAuth();
  const isAdmin = isAdminProp || user?.role === 'admin';
  const isCompleted = (lessonId: string) => {
    if (!enrollment) return false;
    return enrollment.progress?.completedLessons?.some(
      (id: string) => id.toString() === lessonId.toString()
    );
  };

  return (
    <Card className="sticky top-20 lg:top-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <CardHeader className="sticky top-0 bg-card z-10 border-b">
        <CardTitle className="text-base sm:text-lg">محتوای دوره</CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <div className="space-y-1">
          {lessons.map((lesson, index) => {
            const isCurrent = lesson._id === currentLessonId;
            const completed = !isAdmin && isCompleted(lesson._id);
            // بررسی دسترسی: اگر جلسه رایگان است یا درس رایگان است یا کاربر ثبت‌نام کرده یا admin است
            const isSectionFree = lesson.sectionIsFree || false;
            const isLessonFree = lesson.isFree || lesson.isPreview || false;
            // enrollment is truthy if it exists (object), so we check !!enrollment
            const canAccess = isAdmin || isSectionFree || isLessonFree || !!enrollment;

            return (
              <Link
                key={lesson._id}
                href={canAccess ? `/courses/${courseId}/lessons/${lesson._id}` : '#'}
                className={cn(
                  'flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-colors',
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent',
                  !canAccess && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex-shrink-0">
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  ) : canAccess ? (
                    <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{lesson.title}</p>
                  <p className="text-xs opacity-70">{lesson.duration} دقیقه</p>
                </div>
              </Link>
            );
          })}
        </div>

        {enrollment && !isAdmin && (
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground mb-2">پیشرفت</div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${enrollment.progress?.completionPercentage || 0}%`,
                }}
              />
            </div>
            <p className="text-sm mt-2">
              {enrollment.progress?.completionPercentage || 0}% تکمیل شده
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


