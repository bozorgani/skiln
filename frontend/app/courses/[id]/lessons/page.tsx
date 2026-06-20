import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import LessonSidebar from '@/components/course/LessonSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getCookieHeader() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies.length > 0
    ? allCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ')
    : '';
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const cookieHeader = await getCookieHeader();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
}

async function getCurrentUser() {
  try {
    const response = await apiFetch('/auth/me');
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.user || data.data || null;
  } catch {
    return null;
  }
}

async function getCourse(id: string) {
  try {
    const response = await apiFetch(`/courses/${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.course || data.data || null;
  } catch {
    return null;
  }
}

async function getLessons(courseId: string) {
  try {
    const response = await apiFetch(`/courses/${courseId}/lessons`);
    if (!response.ok) return { lessons: [], isEnrolled: false };
    const data = await response.json();
    return {
      lessons: data.data?.lessons || [],
      isEnrolled: data.data?.isEnrolled || false,
    };
  } catch {
    return { lessons: [], isEnrolled: false };
  }
}

async function getProgress(courseId: string) {
  try {
    const response = await apiFetch(`/progress/${courseId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.progress || data.data || null;
  } catch {
    return null;
  }
}

function getContinueLesson(lessons: any[], progress: any) {
  if (!lessons.length) return null;

  const completedSet = new Set((progress?.completedLessons || []).map((lessonId: any) => lessonId.toString()));
  const lastWatchedLesson = progress?.lastWatchedLesson;

  if (lastWatchedLesson && !completedSet.has(lastWatchedLesson)) {
    const lastLesson = lessons.find((lesson: any) => lesson._id === lastWatchedLesson);
    if (lastLesson?.canAccess !== false) return lastLesson;
  }

  const firstIncomplete = lessons.find((lesson: any) => !completedSet.has(lesson._id) && lesson.canAccess !== false);
  if (firstIncomplete) return firstIncomplete;

  if (lastWatchedLesson) {
    const lastLesson = lessons.find((lesson: any) => lesson._id === lastWatchedLesson);
    if (lastLesson?.canAccess !== false) return lastLesson;
  }

  return lessons.find((lesson: any) => lesson.canAccess !== false) || lessons[0];
}

export default async function LessonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  const { lessons, isEnrolled } = await getLessons(id);
  const progress = await getProgress(id);
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const hasFreeLessons = lessons.some((lesson: any) =>
    lesson.isFree || lesson.isPreview || lesson.sectionIsFree
  );
  const isCourseFree = course?.price === 0 || false;
  const hasAccess = isAdmin || isEnrolled || hasFreeLessons || isCourseFree;
  const continueLesson = getContinueLesson(lessons, progress);
  const completedCount = Array.isArray(progress?.completedLessons) ? progress.completedLessons.length : 0;
  const totalLessons = progress?.totalLessons || lessons.length;
  const progressPercent = progress?.completionPercentage || 0;
  const hasStarted = progressPercent > 0 || !!progress?.lastWatchedLesson || completedCount > 0;
  const isCompleted = totalLessons > 0 && completedCount >= totalLessons;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <Link href={`/courses/${id}`} className="text-primary hover:underline text-sm sm:text-base flex items-center gap-2">
            <span className="hidden sm:inline">←</span>
            <span>بازگشت به دوره</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl">{course.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  {lessons.length} درس • {course.duration || 0} دقیقه مجموع
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {continueLesson && hasAccess ? (
                  <div className="text-center py-8 md:py-12 space-y-5">
                    <div className="mx-auto max-w-md space-y-3">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2">
                        {isCompleted ? <CheckCircle2 className="h-7 w-7" /> : hasStarted ? <RotateCcw className="h-7 w-7" /> : <Play className="h-7 w-7" />}
                      </div>
                      <p className="text-foreground font-bold text-lg">
                        {isAdmin
                          ? 'مشاهده درس‌ها'
                          : isCompleted
                            ? 'دوره را کامل کرده‌اید'
                            : hasStarted
                              ? 'ادامه یادگیری از جایی که مانده‌اید'
                              : 'آماده شروع یادگیری هستید؟'}
                      </p>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {hasStarted && !isCompleted
                          ? `پیشرفت فعلی شما ${progressPercent}% است. ادامه از: ${continueLesson.title}`
                          : isCompleted
                            ? 'می‌توانید برای مرور، آخرین درس مشاهده‌شده را دوباره ببینید.'
                            : 'اولین درس در دسترس را شروع کنید.'}
                      </p>
                      {totalLessons > 0 && (
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                        </div>
                      )}
                    </div>
                    <Link href={`/courses/${id}/lessons/${continueLesson._id}`}>
                      <Button size="lg" className="text-sm sm:text-base">
                        <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                        {isAdmin
                          ? 'مشاهده درس'
                          : isCompleted
                            ? 'مرور درس'
                            : hasStarted
                              ? 'ادامه یادگیری'
                              : 'شروع اولین درس'}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      {hasAccess
                        ? 'هنوز درسی در دسترس نیست'
                        : 'لطفاً در این دوره ثبت‌نام کنید تا به دروس دسترسی داشته باشید'}
                    </p>
                    {!hasAccess && (
                      <Link href={`/courses/${id}`}>
                        <Button className="text-sm sm:text-base">ثبت‌نام کنید</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <LessonSidebar
              courseId={id}
              lessons={lessons}
              currentLessonId={continueLesson?._id || ''}
              enrollment={isEnrolled || isAdmin ? { progress: progress || { completedLessons: [] } } : null}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
