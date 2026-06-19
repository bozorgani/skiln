import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import VideoPlayer from '@/components/course/VideoPlayer';
import ModernLessonSidebar from '@/components/course/ModernLessonSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  Play,
  Lock,
  Trophy,
  Award
} from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';
import { calculateCourseDuration, calculateTotalLessons } from '@/lib/course-utils';

async function getLesson(courseId: string, lessonId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Cookie'] = `token=${token.value}`;
    }
    
    // ساخت lessonId کامل: courseId-sectionIndex-lessonIndex
    // lessonId از URL می‌آید که می‌تواند به صورت "sectionIndex-lessonIndex" یا "courseId-sectionIndex-lessonIndex" باشد
    let fullLessonId = lessonId;
    if (!lessonId.includes('-') || lessonId.split('-').length === 2) {
      // اگر lessonId به صورت "sectionIndex-lessonIndex" است، courseId را اضافه کن
      fullLessonId = `${courseId}-${lessonId}`;
    }
    
    const response = await fetch(`${API_URL}/courses/lessons/${fullLessonId}`, {
      headers,
      credentials: 'include',
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.data?.lesson || null;
  } catch (error) {
    return null;
  }
}

async function getLessons(courseId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Cookie'] = `token=${token.value}`;
    }
    
    const response = await fetch(`${API_URL}/courses/${courseId}/lessons`, {
      headers,
      credentials: 'include',
      next: { revalidate: 0 }, // No cache to ensure fresh enrollment status
    });
    
    if (!response.ok) {
      return { lessons: [], isEnrolled: false };
    }
    
    const data = await response.json();
    // The backend returns { success: true, message: '...', data: { lessons: [...], isEnrolled: true } }
    // sendResponse wraps data in { success, message, data }
    // So it becomes { success, message, data: { lessons: [...], isEnrolled: true } }
    return data.data || { lessons: [], isEnrolled: false };
  } catch (error) {
    return { lessons: [], isEnrolled: false };
  }
}

async function getCourse(courseId: string) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies.length > 0 
      ? allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
      : '';
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      headers,
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.data?.course || data.data || null;
  } catch (error) {
    return null;
  }
}

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return null;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token.value}`,
      },
      credentials: 'include',
      next: { revalidate: 300 },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.data?.user || null;
  } catch (error) {
    return null;
  }
}

async function getEnrollment(courseId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return null;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${API_URL}/enrollments/${courseId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token.value}`,
      },
      credentials: 'include',
      next: { revalidate: 0 }, // No cache to ensure fresh data
    });
    
    if (!response.ok) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
      }
      return null;
    }
    
    const data = await response.json();
    return data.data?.enrollment || null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
    }
    return null;
  }
}

async function getProgress(courseId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return null;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${API_URL}/progress/${courseId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token.value}`,
      },
      credentials: 'include',
      next: { revalidate: 30 },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.data?.progress || null;
  } catch (error) {
    return null;
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const lesson = await getLesson(id, lessonId);
  const lessonsData = await getLessons(id);
  // Extract lessons array and isEnrolled from the response
  const lessons = Array.isArray(lessonsData) ? lessonsData : (lessonsData?.lessons || []);
  const isEnrolledFromLessons = lessonsData?.isEnrolled || false;
  const enrollment = await getEnrollment(id);
  const progress = await getProgress(id);
  const course = await getCourse(id);
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  
  // Merge progress data into enrollment for backward compatibility
  if (enrollment && progress) {
    enrollment.progress = progress;
  }

  if (!lesson || !course) {
    notFound();
  }
  
  // پیدا کردن درس فعلی بر اساس _id یا ساخت lessonId کامل
  const fullLessonId = lessonId.includes('-') ? lessonId : `${id}-${lessonId}`;
  const currentIndex = lessons.findIndex((l: any) => 
    l._id === lessonId || 
    l._id === fullLessonId ||
    `${l.sectionIndex}-${l.lessonIndex}` === lessonId ||
    `${id}-${l.sectionIndex}-${l.lessonIndex}` === fullLessonId
  );
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;

  // Check if current lesson is completed
  const isCurrentLessonCompleted = progress?.completedLessons?.some(
    (completedId: string) => {
      const completedStr = completedId.toString();
      return completedStr === lessonId || 
             completedStr === fullLessonId;
    }
  ) || false;

  // Check if current lesson is free/preview or course is free
  const isSectionFree = lesson.sectionIsFree || false;
  const isCurrentLessonFree = lesson.isFree || lesson.isPreview || isSectionFree || false;
  const isCourseFree = course?.price === 0 || false;
  
  // Use isEnrolledFromLessons if enrollment is not available
  // enrollment is truthy if it exists (object), or use isEnrolledFromLessons boolean
  const finalIsEnrolled = !!enrollment || isEnrolledFromLessons || false;
  
  
  const canAccessCurrentLesson = isCurrentLessonFree || isCourseFree || finalIsEnrolled || isAdmin;

  // Check if previous lesson is completed (for sequential access)
  const prevLessonCompleted = prevLesson ? (
    progress?.completedLessons?.some(
      (id: string) => id.toString() === prevLesson._id
    ) || false
  ) : true; // If no previous lesson, allow access

  // Check if next lesson can be accessed
  // Rule: User must complete current lesson (or it's free) to access next lesson
  // Exception: Free lessons can be accessed directly
  const isNextSectionFree = nextLesson?.sectionIsFree || false;
  const isNextLessonFree = nextLesson?.isFree || nextLesson?.isPreview || isNextSectionFree || false;
  const canAccessNextLessonBase = isNextLessonFree || isCourseFree || finalIsEnrolled || isAdmin;
  
  // Can navigate to next if:
  // 1. Admin can always navigate
  // 2. Next lesson is free (can access directly)
  // 3. Course is free (can access directly)
  // 4. Current lesson is completed AND next lesson is accessible
  // 5. Current lesson is free AND next lesson is accessible (sequential free lessons)
  const canNavigateToNext = isAdmin || (
    canAccessNextLessonBase && (
      isNextLessonFree ||
      isCourseFree ||
      isCurrentLessonCompleted ||
      isCurrentLessonFree
    )
  );

  // Calculate course stats
  const courseDuration = calculateCourseDuration(course);
  const totalLessons = calculateTotalLessons(course);
  
  // Check if course is completed
  const isCourseCompleted = progress?.completionPercentage === 100;
  const hasCertificate = progress?.certificateIssued || false;

  // Get video URL - از content استفاده می‌کنیم که لینک ویدیو است
  const videoUrl = lesson.content || lesson.videoUrl || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link 
              href={`/courses/${id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowRight className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">بازگشت به دوره</span>
              <span className="sm:hidden">بازگشت</span>
            </Link>
            
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <div className="hidden md:flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                  <Image
                    src={getImageUrl(course.thumbnail)}
                    alt={course.title}
                    fill
                    className="object-cover"
                    unoptimized={course.thumbnail?.startsWith('data:')}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-sm truncate">{course.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{totalLessons} درس • {courseDuration} دقیقه</span>
                  </div>
                </div>
              </div>
              
              {enrollment && !isAdmin && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary">
                    {enrollment.progress?.completedLessons?.length || 0}/{totalLessons}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - Video Player */}
          <div className="lg:col-span-8 space-y-6">
            {/* Video Player Card */}
            <Card className="border-2 shadow-xl overflow-hidden bg-gradient-to-br from-card via-card to-muted/20">
              <CardContent className="p-0">
                {/* Video Container */}
                <div className="relative bg-black aspect-video">
                  {videoUrl ? (
                    <VideoPlayer
                      url={videoUrl}
                      lessonId={lesson._id}
                      courseId={id}
                      enrollment={enrollment}
                      lesson={lesson}
                      course={course}
                      nextLesson={nextLesson}
                      nextLessonId={canNavigateToNext ? (nextLesson?._id || null) : null}
                      autoNavigate={canNavigateToNext}
                      isAdmin={isAdmin}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold mb-2">ویدیو در دسترس نیست</p>
                        <p className="text-sm text-muted-foreground">
                          لطفاً لینک ویدیو را در پنل مدیریت تنظیم کنید
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lesson Title & Info */}
                <div className="p-4 md:p-6 border-t border-border/50">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-xl md:text-2xl font-bold mb-2 text-foreground">
                        {lesson.title}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          <span>درس {currentIndex + 1} از {lessons.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{lesson.duration || 0} دقیقه</span>
                        </div>
                        {(isSectionFree || isCurrentLessonFree) && (
                          <div className="flex items-center gap-1.5 text-green-600 font-bold">
                            <span>•</span>
                            <span>رایگان</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isCurrentLessonCompleted && !isAdmin && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-bold">تکمیل شد</span>
                      </div>
                    )}
                  </div>

                  {/* Course Completed Message */}
                  {isCourseCompleted && hasCertificate && currentIndex === lessons.length - 1 && (
                    <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-green-500/30 shadow-lg">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                          <Trophy className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            تبریک! دوره شما تکمیل شد
                          </h3>
                          <p className="text-sm md:text-base text-muted-foreground mb-4">
                            شما با موفقیت تمام درس‌های این دوره را تکمیل کردید. اکنون می‌توانید گواهینامه خود را دریافت کنید.
                          </p>
                          <Link href={`/certificates/${id}`}>
                            <Button 
                              className="gap-2 rounded-xl bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                              <Trophy className="h-4 w-4" />
                              <span>دریافت گواهینامه</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lesson Description */}
                  {lesson.description && (
                    <div className="prose dark:prose-invert max-w-none text-sm md:text-base mb-6">
                      <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                        <h3 className="text-base md:text-lg font-bold mb-2 flex items-center gap-2">
                          <Play className="h-4 w-4 text-primary" />
                          درباره این درس
                        </h3>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                          {lesson.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row-reverse items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border/50">
                    {nextLesson ? (
                      canNavigateToNext ? (
                        <Link href={`/courses/${id}/lessons/${nextLesson._id}`} className="w-full sm:w-auto">
                          <Button 
                            className="w-full sm:w-auto gap-2 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/90 hover:via-indigo-600/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all"
                          >
                            <ArrowRight className="h-4 w-4" />
                            <span>درس بعدی</span>
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          disabled
                          variant="outline"
                          className="w-full sm:w-auto gap-2 rounded-xl opacity-50 cursor-not-allowed"
                        >
                          <Lock className="h-4 w-4" />
                          <span>درس بعدی (قفل)</span>
                        </Button>
                      )
                    ) : (
                      <div className="w-full sm:w-auto">
                        {progress?.completionPercentage === 100 && progress?.certificateIssued ? (
                          <Link href={`/certificates/${id}`}>
                            <Button 
                              className="w-full gap-2 rounded-xl bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                              <Trophy className="h-4 w-4" />
                              <span>دریافت گواهینامه</span>
                            </Button>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600">
                            <Trophy className="h-4 w-4" />
                            <span className="text-sm font-bold">آخرین درس</span>
                          </div>
                        )}
                      </div>
                    )}

                    {prevLesson ? (
                      <Link href={`/courses/${id}/lessons/${prevLesson._id}`} className="w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto gap-2 rounded-xl border-2 hover:border-primary transition-all"
                        >
                          <span>درس قبلی</span>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <div className="hidden sm:block" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-20">
              <ModernLessonSidebar
                courseId={id}
                course={course}
                lessons={lessons}
                currentLessonId={lessonId}
                enrollment={enrollment || (finalIsEnrolled ? { progress: progress || {}, enrolled: true } : null)}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
