import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { coursesAPI, lessonsAPI } from '@/lib/api';
import LessonSidebar from '@/components/course/LessonSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

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
      next: { revalidate: 300 }, // Revalidate every 5 minutes
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

async function getCourse(id: string) {
  try {
    const response = await coursesAPI.getById(id);
    return response.data.data.course;
  } catch (error) {
    return null;
  }
}

async function getLessons(courseId: string) {
  try {
    const response = await lessonsAPI.getByCourse(courseId);
    const data = response.data.data;
    // Return lessons array and enrollment status
    return {
      lessons: data.lessons || [],
      isEnrolled: data.isEnrolled || false
    };
  } catch (error) {
    return { lessons: [], isEnrolled: false };
  }
}

export default async function LessonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  const { lessons, isEnrolled } = await getLessons(id);
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  
  // Admin has access to all lessons
  // همچنین بررسی می‌کنیم که آیا درس‌های رایگان وجود دارند
  const hasFreeLessons = lessons.some((lesson: any) => 
    lesson.isFree || lesson.isPreview || lesson.sectionIsFree
  );
  const isCourseFree = course?.price === 0 || false;
  const hasAccess = isAdmin || isEnrolled || hasFreeLessons || isCourseFree;

  if (!course) {
    notFound();
  }

  const firstLesson = lessons.length > 0 ? lessons[0] : null;

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
          {/* Lessons List */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl">{course.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  {lessons.length} درس • {course.duration} دقیقه مجموع
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {firstLesson && hasAccess ? (
                  <div className="text-center py-8 md:py-12">
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      {isAdmin ? 'مشاهده اولین درس' : 'آماده شروع یادگیری هستید؟'}
                    </p>
                    <Link href={`/courses/${id}/lessons/${firstLesson._id}`}>
                      <Button size="lg" className="text-sm sm:text-base">
                        <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                        {isAdmin ? 'مشاهده اولین درس' : 'شروع اولین درس'}
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

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <LessonSidebar
              courseId={id}
              lessons={lessons}
              currentLessonId={firstLesson?._id || ''}
              enrollment={isEnrolled ? { progress: { completedLessons: [] } } : null}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </main>
    </div>
  );
}


