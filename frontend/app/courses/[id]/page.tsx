import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PurchaseButton from '@/components/course/PurchaseButton';
import { Clock, Users, BookOpen, Play, Lock, CheckCircle2, Award, Globe, TrendingUp, Star, User as UserIcon, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';
import { calculateCourseDuration, calculateTotalLessons, getCoursePricing } from '@/lib/course-utils';
import DescriptionBox from '@/components/course/DescriptionBox';
import FAQSection from '@/components/course/FAQSection';
import CourseReviews from '@/components/course/CourseReviews';

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return null;
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Cookie: `token=${token.value}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      next: { revalidate: 300 },
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.user || null;
  } catch (error) {
    return null;
  }
}

async function getCourse(id: string) {
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
    
    const response = await fetch(`${API_URL}/courses/${id}`, {
      headers,
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    // Response format: { data: { course: {...} } }
    return data.data?.course || data.data || null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching course:', error);
    }
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
      next: { revalidate: 10 }, // Reduce cache time to 10 seconds for faster enrollment updates
    });
    
    if (!response.ok) {
      return { lessons: [], isEnrolled: false };
    }
    
    const data = await response.json();
    return {
      lessons: data.data?.lessons || [],
      isEnrolled: data.data?.isEnrolled || false
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching lessons:', error);
    }
    return { lessons: [], isEnrolled: false };
  }
}

const formatLevel = (level: string) => {
  switch (level) {
    case 'Beginner':
      return 'مبتدی';
    case 'Intermediate':
      return 'متوسط';
    case 'Advanced':
      return 'پیشرفته';
    default:
      return level;
  }
};

const formatCategory = (category: string) => {
  const categories: { [key: string]: string } = {
    'General': 'عمومی',
    'Programming': 'برنامه‌نویسی',
    'Design': 'طراحی',
    'Business': 'کسب‌وکار',
    'Marketing': 'بازاریابی',
    'Photography': 'عکاسی',
    'Music': 'موسیقی',
  };
  return categories[category] || category;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    return {
      title: 'دوره یافت نشد',
    };
  }

  const courseUrl = `https://www.skiln.ir/courses/${id}`;
  const courseImage = getImageUrl(course.thumbnail);
  const courseDescription = course.description || course.shortDescription || `دوره ${course.title} در پلتفرم آموزش آنلاین Skiln`;

  return {
    title: course.title,
    description: courseDescription,
    keywords: [
      course.title,
      formatCategory(course.category || 'General'),
      formatLevel(course.level || 'Beginner'),
      'دوره آموزشی',
      'آموزش آنلاین',
      'Skiln',
    ],
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      url: courseUrl,
      siteName: 'Skiln',
      title: course.title,
      description: courseDescription,
      images: [
        {
          url: courseImage,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: courseDescription,
      images: [courseImage],
    },
    alternates: {
      canonical: courseUrl,
    },
  };
}


export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  const { lessons, isEnrolled } = await getLessons(id);
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  if (!course) {
    notFound();
  }

  // محاسبه مدت زمان و تعداد درس‌ها از sections
  const courseDuration = calculateCourseDuration(course);
  const totalLessons = calculateTotalLessons(course) || lessons.length || 0;
  const { originalPrice, finalPrice, discountPercent, hasDiscount } = getCoursePricing(course);
  // شمارش درس‌های رایگان (isFree یا isPreview)
  const previewLessons = course.sections?.reduce((count: number, section: any) => {
    const sectionFree = section.isFree || false;
    return count + (section.lessons || []).filter((lesson: any) => 
      sectionFree || lesson.isFree || lesson.isPreview
    ).length;
  }, 0) || 0;

  // Structured Data (JSON-LD) for Course
  const courseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || course.shortDescription || '',
    provider: {
      '@type': 'Organization',
      name: 'Skiln',
      url: 'https://www.skiln.ir',
    },
    image: getImageUrl(course.thumbnail),
    url: `https://www.skiln.ir/courses/${id}`,
    courseCode: course._id,
    educationalLevel: formatLevel(course.level || 'Beginner'),
    inLanguage: 'fa',
    aggregateRating: course.ratings?.average
      ? {
          '@type': 'AggregateRating',
          ratingValue: course.ratings.average,
          ratingCount: course.ratings.count || 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: finalPrice,
      priceCurrency: 'IRR',
      availability: 'https://schema.org/InStock',
      url: `https://www.skiln.ir/courses/${id}`,
    },
    numberOfCredits: totalLessons,
    timeRequired: courseDuration ? `PT${courseDuration}M` : undefined,
    coursePrerequisites: course.prerequisites || [],
  };

  // Breadcrumb Structured Data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: 'https://www.skiln.ir',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'دوره‌ها',
        item: 'https://www.skiln.ir',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: formatCategory(course.category || 'General'),
        item: `https://www.skiln.ir/?category=${course.category || 'General'}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: course.title,
        item: `https://www.skiln.ir/courses/${id}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-6 md:space-y-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-primary transition-colors font-medium">
                خانه
              </Link>
              <span className="text-border">/</span>
              <Link href="/" className="hover:text-primary transition-colors font-medium">
                دوره‌ها
              </Link>
              <span className="text-border">/</span>
              <span className="text-foreground font-semibold">{course.category ? formatCategory(course.category) : 'عمومی'}</span>
            </nav>

            {/* Course Header */}
            <div className="space-y-6">
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                    {course.title}
                  </h1>
                  {course.shortDescription && (
                    <div className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl line-clamp-2">
                      {course.shortDescription}
                    </div>
                  )}
                </div>

                {/* Course Stats - Modern Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-4 border-t">
                  {course.ratings && course.ratings.average > 0 && (
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10 border border-yellow-200/50 dark:border-yellow-800/30 group hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />
                        <span className="font-black text-xl text-foreground">
                          {course.ratings.average.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        ({course.ratings.count || 0} نظر)
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 group hover:shadow-lg transition-all duration-300">
                    <Users className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="font-black text-xl text-foreground">{course.studentsEnrolled || 0}</span>
                    <span className="text-xs text-muted-foreground font-medium">دانشجو</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border border-green-200/50 dark:border-green-800/30 group hover:shadow-lg transition-all duration-300">
                    <BookOpen className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <span className="font-black text-xl text-foreground">{totalLessons}</span>
                    <span className="text-xs text-muted-foreground font-medium">درس</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200/50 dark:border-purple-800/30 group hover:shadow-lg transition-all duration-300">
                    <Clock className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                    <span className="font-black text-xl text-foreground">{courseDuration}</span>
                    <span className="text-xs text-muted-foreground font-medium">دقیقه</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-200/50 dark:border-orange-800/30 group hover:shadow-lg transition-all duration-300">
                    <TrendingUp className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                    <span className="font-black text-sm text-primary">
                      {formatLevel(course.level || 'Beginner')}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">سطح</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Description Box */}
            <Card className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border-2 mb-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 sm:justify-start justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary hidden sm:flex"></div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-primary dark:text-white text-center sm:text-right">
                    توضیحات
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-4 sm:px-8 md:px-10">
                <DescriptionBox content={course.description || course.shortDescription || ''} />
              </CardContent>
            </Card>

            {/* What You'll Learn */}
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl">آنچه در این دوره یاد خواهید گرفت</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm md:text-base">مهارت‌های عملی و کاربردی</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm md:text-base">درک عمیق از مفاهیم</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm md:text-base">پروژه‌های عملی و تمرین</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm md:text-base">گواهینامه تکمیل دوره</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Content - Sections & Lessons */}
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 via-transparent to-indigo-500/5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-xl md:text-2xl mb-2 flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-primary" />
                      محتوای دوره
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      {totalLessons} درس در {course.sections?.length || 0} جلسه • {courseDuration} دقیقه مجموع
                      {previewLessons > 0 && ` • ${previewLessons} درس پیش‌نمایش`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {!course.sections || course.sections.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                      <BookOpen className="h-12 w-12 text-primary opacity-50" />
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">
                      هنوز محتوایی برای این دوره در دسترس نیست.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {course.sections.map((section: any, sectionIndex: number) => {
                      const sectionLessons = section.lessons || [];
                      const sectionDuration = sectionLessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0);
                      let lessonCounter = 0;
                      
                      // شمارش درس‌های قبل از این section
                      for (let i = 0; i < sectionIndex; i++) {
                        if (course.sections[i]?.lessons) {
                          lessonCounter += course.sections[i].lessons.length;
                        }
                      }

                      return (
                        <div key={sectionIndex} className="space-y-3">
                          {/* Section Header */}
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 group">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white font-bold text-sm shadow-lg">
                                {sectionIndex + 1}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-foreground">{section.title}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {sectionLessons.length} درس • {sectionDuration} دقیقه
                                </p>
                              </div>
                            </div>
                            <Play className="h-5 w-5 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {/* Lessons in Section */}
                          <div className="space-y-2 pr-4 md:pr-6">
                            {sectionLessons.map((lesson: any, lessonIndex: number) => {
                              lessonCounter++;
                              // بررسی دسترسی: اگر جلسه رایگان است یا درس رایگان است یا کاربر ثبت‌نام کرده یا admin است
                              const isSectionFree = section.isFree || false;
                              const isLessonFree = lesson.isFree || lesson.isPreview || false;
                              const canAccess = isEnrolled || isAdmin || isSectionFree || isLessonFree || (course?.price === 0);
                              const isLocked = !canAccess;
                              
                              return (
                                <div
                                  key={lessonIndex}
                                  className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                                    isLocked 
                                      ? 'bg-muted/30 border-muted/50 opacity-70' 
                                      : 'bg-background border-border/50 hover:border-primary/50 hover:bg-accent/50 hover:shadow-md cursor-pointer hover:-translate-x-1'
                                  }`}
                                >
                                  {/* Number Badge */}
                                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm flex-shrink-0 transition-all duration-300 shadow-md ${
                                    isLocked 
                                      ? 'bg-muted text-muted-foreground' 
                                      : 'bg-gradient-to-br from-primary/10 to-indigo-500/10 text-primary group-hover:from-primary group-hover:to-indigo-600 group-hover:text-white group-hover:scale-110'
                                  }`}>
                                    {lessonCounter}
                                  </div>

                                  {/* Lesson Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      <h4 className={`font-semibold text-base truncate ${
                                        isLocked ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'
                                      }`}>
                                        {lesson.title}
                                      </h4>
                                      {isLocked && (
                                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      )}
                                    </div>
                                    {lesson.description && (
                                      <div className="text-sm text-muted-foreground mb-1.5 whitespace-pre-line line-clamp-2">
                                        {lesson.description}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{lesson.duration || 0} دقیقه</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  <div className="flex-shrink-0">
                                    {canAccess ? (
                                      <Link href={`/courses/${id}/lessons/${lesson._id || `${id}-${sectionIndex}-${lessonIndex}`}`}>
                                        <Button 
                                          size="sm" 
                                          variant="default"
                                          className="hidden sm:flex rounded-xl shadow-md hover:shadow-lg transition-all"
                                        >
                                          <Play className="h-4 w-4 ml-2" />
                                          تماشا
                                        </Button>
                                        <Button 
                                          size="icon" 
                                          variant="default"
                                          className="sm:hidden rounded-xl"
                                        >
                                          <Play className="h-4 w-4" />
                                        </Button>
                                      </Link>
                                    ) : (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 bg-muted/50 rounded-xl">
                                        <Lock className="h-4 w-4" />
                                        <span className="hidden sm:inline">قفل</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Enrollment CTA */}
                {!isEnrolled && !isAdmin && course.sections && course.sections.length > 0 && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-purple-500/10 border-2 border-primary/20 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-50"></div>
                    <div className="relative flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold mb-2 text-foreground">برای دسترسی به تمام دروس ثبت‌نام کنید</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {previewLessons > 0 && `${previewLessons} درس پیش‌نمایش در دسترس است. `}
                          با ثبت‌نام به تمام {totalLessons} درس در {course.sections.length} جلسه دسترسی پیدا می‌کنید.
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Award className="h-4 w-4" />
                          <span>گواهینامه تکمیل دوره پس از اتمام</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructor Info */}
            {course.instructor && (
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl md:text-2xl">درباره مدرس</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">
                        {typeof course.instructor === 'object' ? course.instructor.name : 'مدرس دوره'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        مدرس حرفه‌ای با سال‌ها تجربه در آموزش
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{course.studentsEnrolled || 0} دانشجو</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>دوره‌های متعدد</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span>امتیاز عالی</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Sticky */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-20 space-y-4">
              {/* Course Image */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 shadow-lg">
                <Image
                  src={getImageUrl(course.thumbnail)}
                  alt={`تصویر دوره ${course.title} - Skiln`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                  quality={90}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8BtJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//Z"
                  unoptimized={course.thumbnail?.startsWith('data:')}
                />
              </div>

              {/* Purchase Card */}
              <Card className="border-2 shadow-xl">
                <CardHeader className="pb-4 border-b">
                  {isEnrolled ? (
                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
                      <CardTitle className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        شما در این دوره ثبت‌نام کرده‌اید
                      </CardTitle>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      {finalPrice === 0 ? (
                        <CardTitle className="text-2xl md:text-3xl font-bold text-primary">رایگان</CardTitle>
                      ) : (
                        <div className="space-y-1">
                          {hasDiscount && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground line-through">{originalPrice.toLocaleString('fa-IR')} تومان</span>
                              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-bold">{discountPercent}% تخفیف</span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-2">
                            <CardTitle className="text-2xl md:text-3xl font-bold">
                              {finalPrice.toLocaleString('fa-IR')}
                            </CardTitle>
                            <span className="text-base text-muted-foreground">تومان</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <PurchaseButton courseId={id} course={course} isEnrolled={isEnrolled} />

                  {/* Course Features */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">دسترسی مادام‌العمر</p>
                        <p className="text-xs text-muted-foreground">به محتوای دوره</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">گواهینامه تکمیل</p>
                        <p className="text-xs text-muted-foreground">پس از اتمام دوره</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">زبان فارسی</p>
                        <p className="text-xs text-muted-foreground">با زیرنویس</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">یادگیری در هر زمان</p>
                        <p className="text-xs text-muted-foreground">بدون محدودیت زمانی</p>
                      </div>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">سطح دوره:</span>
                      <span className="font-semibold">{formatLevel(course.level || 'Beginner')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">دسته‌بندی:</span>
                      <span className="font-semibold">{formatCategory(course.category || 'General')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">تعداد دروس:</span>
                      <span className="font-semibold">{totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">مدت زمان:</span>
                      <span className="font-semibold">{courseDuration} دقیقه</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">دانشجویان:</span>
                      <span className="font-semibold">{course.studentsEnrolled || 0} نفر</span>
                    </div>
                    {course.ratings && course.ratings.count > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">امتیاز:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">
                            {course.ratings.average.toFixed(1)} ({course.ratings.count})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <section className="mt-8 md:mt-12">
          <Card className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl md:text-3xl font-bold text-primary dark:text-white text-center sm:text-right mb-5">
                سوالات متداول
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <FAQSection />
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 md:mt-12">
          <CourseReviews
            courseId={id}
            isEnrolled={isEnrolled}
            isAdmin={isAdmin}
            initialRating={course.ratings}
          />
        </section>
      </main>
    </div>
  );
}
