import { Suspense, lazy } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SearchAndFilterClient from '@/components/common/SearchAndFilterClient';
import AdvancedCourseCard from '@/components/common/AdvancedCourseCard';
import { getImageUrl } from '@/lib/image-utils';
import { calculateCourseDuration } from '@/lib/course-utils';
// Dynamic imports for heavy components
const CourseCarouselSection = lazy(() => import('@/components/common/CourseCarouselSection'));
const ScrollAnimation = lazy(() => import('@/components/common/ScrollAnimation'));
const MagneticButton = lazy(() => import('@/components/common/MagneticButton'));
const HeroSection = lazy(() => import('@/components/common/HeroSection'));
const AnimatedCounter = lazy(() => import('@/components/common/AnimatedCounter'));
const RevealOnScroll = lazy(() => import('@/components/common/RevealOnScroll'));
// Lazy load icons - only import what's needed
import { 
  Star, TrendingUp, Users, Clock, BookOpen, ArrowLeft, ArrowRight, 
  Sparkles, Award, Zap, Play, CheckCircle2, Target, Rocket, 
  GraduationCap, Trophy, Heart, Shield, Globe,
  Code, Palette, Music, Camera, Briefcase, Brain, Languages, Gamepad2, 
  Flame
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getCourses(params: URLSearchParams) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies.length > 0 
      ? allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
      : '';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const url = `${API_URL}/courses?${params.toString()}`;
    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return { courses: [] };
    }
    
    const data = await response.json();
    return { courses: data.data?.courses || [] };
  } catch (error) {
    return { courses: [] };
  }
}

async function getFeaturedCourses() {
  const params = new URLSearchParams();
  params.set('limit', '6');
  params.set('sort', '-ratings.average');
  return getCourses(params);
}

async function getBestSellingCourses() {
  const params = new URLSearchParams();
  params.set('limit', '8');
  params.set('sort', '-studentsEnrolled');
  params.set('isPublished', 'true');
  return getCourses(params);
}

async function getPopularCourses() {
  const params = new URLSearchParams();
  params.set('limit', '8');
  params.set('sort', '-views');
  params.set('isPublished', 'true');
  return getCourses(params);
}

async function getNewCourses() {
  const params = new URLSearchParams();
  params.set('limit', '8');
  params.set('sort', '-createdAt');
  return getCourses(params);
}

function CourseCard({ course, index }: { course: any; index?: number }) {
  // Use AdvancedCourseCard for better UX
  return <AdvancedCourseCard course={course} index={index} />;
}

function CourseCardOld({ course, index }: { course: any; index?: number }) {
  const hasDiscount = course.price > 0 && course.price < 50000;
  const originalPrice = hasDiscount ? course.price * 1.25 : course.price;
  const discountPercent = hasDiscount ? 20 : 0;

  return (
    <ScrollAnimation delay={(index || 0) * 0.1} direction="up" duration={0.6}>
      <div className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-700 border-2 border-border/50 hover:border-primary/50 hover:-translate-y-2">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-700 z-0"></div>
        
        {/* Badge */}
        {hasDiscount && (
          <div className="absolute top-5 left-5 z-20 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-2xl animate-pulse border-2 border-white/30">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {discountPercent}% تخفیف
            </span>
          </div>
        )}
        
        {/* Course Banner */}
        <Link href={`/courses/${course._id}`} className="block h-[220px] relative overflow-hidden z-10">
          <Image
            src={getImageUrl(course.thumbnail)}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-125 transition-transform duration-1000 ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
            <div className="bg-white/95 backdrop-blur-xl rounded-full p-6 shadow-2xl border-4 border-primary/50">
              <Play className="h-10 w-10 text-primary" fill="currentColor" />
            </div>
          </div>

          {/* Progress bar for enrolled users */}
          {course.progress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div 
                className="h-full bg-gradient-to-r from-primary to-indigo-600 transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
        </Link>

        {/* Course Content */}
        <div className="flex-grow p-6 relative z-10">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-black text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300 flex-1">
              <Link href={`/courses/${course._id}`} className="hover:underline decoration-2 underline-offset-4">
                {course.title}
              </Link>
            </h3>
            {course.isNew && (
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-lg whitespace-nowrap">
                جدید
              </span>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed whitespace-pre-line">
            {course.shortDescription || course.description}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm mb-5 pb-5 border-b-2 border-border/30">
            {course.instructor && (
              <div className="flex items-center gap-2 text-muted-foreground group/instructor">
                <div className="p-1.5 rounded-lg bg-primary/10 group-hover/instructor:bg-primary/20 transition-colors">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium">{typeof course.instructor === 'object' ? course.instructor.name : course.instructor}</span>
              </div>
            )}
            {course.ratings?.average > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-amber-600 dark:text-amber-400">{course.ratings.average.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({course.ratings.count || 0})</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold">{course.studentsEnrolled || 0}</span>
              </div>
              {(() => {
                const duration = calculateCourseDuration(course);
                return duration > 0 && (
                  <>
                    <span className="text-border">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-semibold">{duration} دقیقه</span>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center gap-3">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through font-medium">
                  {originalPrice.toLocaleString('fa-IR')}
                </span>
              )}
              <div className="text-left">
                <span className={`font-black text-2xl ${hasDiscount ? 'text-green-500' : 'text-primary'}`}>
                  {course.price === 0 ? (
                    'رایگان'
                  ) : (
                    <>
                      {course.price.toLocaleString('fa-IR')}
                      <span className="text-sm font-medium mr-1">تومان</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        </div>
      </div>
    </ScrollAnimation>
  );
}

function CourseSection({ 
  title, 
  subtitle, 
  icon: Icon, 
  courses, 
  seeAllLink,
  delay = 0
}: { 
  title: string; 
  subtitle?: string;
  icon: any; 
  courses: any[]; 
  seeAllLink?: string;
  delay?: number;
}) {
  if (courses.length === 0) return null;

  return (
    <ScrollAnimation delay={delay} direction="up" duration={0.8}>
      <section className="mb-20 md:mb-32">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/40 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
              <div className="relative p-5 bg-gradient-to-br from-primary via-indigo-600 to-purple-600 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform duration-500 border-2 border-white/20">
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-lg md:text-xl text-muted-foreground font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {seeAllLink && (
            <Link href={seeAllLink}>
              <MagneticButton
                variant="ghost" 
                size="lg" 
                intensity={0.2}
                className="hidden sm:flex group transition-all duration-300 hover:bg-primary/10 hover:text-primary border-2 border-transparent hover:border-primary/30"
              >
                <span className="font-bold text-base">مشاهده همه</span>
                <ArrowLeft className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:-translate-x-3" />
              </MagneticButton>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {courses.map((course: any, index: number) => (
            <AdvancedCourseCard key={course._id} course={course} index={index} />
          ))}
        </div>
      </section>
    </ScrollAnimation>
  );
}


function StatisticsSection() {
  const stats = [
    { icon: GraduationCap, value: '10,000+', label: 'دانشجو فعال', color: 'from-blue-500 to-cyan-500', delay: 0 },
    { icon: BookOpen, value: '500+', label: 'دوره آموزشی', color: 'from-purple-500 to-pink-500', delay: 0.1 },
    { icon: Users, value: '200+', label: 'مدرس حرفه‌ای', color: 'from-green-500 to-emerald-500', delay: 0.2 },
    { icon: Trophy, value: '98%', label: 'رضایت کاربران', color: 'from-orange-500 to-red-500', delay: 0.3 },
  ];

  return (
    <section className="mb-20 md:mb-32">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {stats.map((stat, index) => (
          <RevealOnScroll key={index} delay={stat.delay} direction="scale" distance={20} duration={0.6}>
            <Card className="relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-700 group hover:shadow-2xl hover:-translate-y-3 hover:scale-105">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-700`}></div>
              <CardContent className="p-8 md:p-10 relative">
                <div className={`inline-flex p-5 rounded-3xl bg-gradient-to-br ${stat.color} mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                  <stat.icon className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent">
                  <AnimatedCounter value={stat.value} duration={2000} />
                </div>
                <div className="text-base md:text-lg text-muted-foreground font-bold">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}

function CategoriesSection() {
  const categories = [
    { icon: Code, name: 'برنامه‌نویسی', color: 'from-blue-500 to-cyan-500', count: 120 },
    { icon: Palette, name: 'طراحی', color: 'from-purple-500 to-pink-500', count: 85 },
    { icon: Briefcase, name: 'کسب و کار', color: 'from-green-500 to-emerald-500', count: 95 },
    { icon: Music, name: 'موسیقی', color: 'from-orange-500 to-red-500', count: 45 },
    { icon: Camera, name: 'عکاسی', color: 'from-indigo-500 to-purple-500', count: 60 },
    { icon: Brain, name: 'روانشناسی', color: 'from-pink-500 to-rose-500', count: 40 },
    { icon: Languages, name: 'زبان', color: 'from-teal-500 to-cyan-500', count: 70 },
    { icon: Gamepad2, name: 'بازی‌سازی', color: 'from-yellow-500 to-orange-500', count: 35 },
  ];

  return (
    <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
      <section className="mb-20 md:mb-32">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-4">
              دسته‌بندی‌های محبوب
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground font-medium">
              دوره‌های متنوع در زمینه‌های مختلف
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <ScrollAnimation key={index} delay={index * 0.1} direction="scale" duration={0.6}>
              <Link
                href={`/?category=${category.name}`}
                className="group relative overflow-hidden rounded-3xl border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-15 transition-opacity duration-700`}></div>
                <CardContent className="p-8 text-center relative">
                  <div className={`inline-flex p-5 rounded-3xl bg-gradient-to-br ${category.color} mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500`}>
                    <category.icon className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <h3 className="font-black text-xl mb-2 group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-bold">
                    {category.count} دوره
                  </p>
                </CardContent>
              </Link>
            </ScrollAnimation>
          ))}
        </div>
      </section>
    </ScrollAnimation>
  );
}

function WhyChooseUsSection() {
  const features = [
    {
      icon: Award,
      title: 'کیفیت بالا',
      description: 'دوره‌های با کیفیت و به‌روز از بهترین مدرسان',
      color: 'from-yellow-400 to-orange-500',
      delay: 0,
    },
    {
      icon: Rocket,
      title: 'یادگیری سریع',
      description: 'دسترسی فوری به محتوا و یادگیری در هر زمان',
      color: 'from-blue-500 to-cyan-500',
      delay: 0.1,
    },
    {
      icon: Shield,
      title: 'ضمانت کیفیت',
      description: 'گارانتی بازگشت وجه در صورت عدم رضایت',
      color: 'from-green-500 to-emerald-500',
      delay: 0.2,
    },
    {
      icon: Globe,
      title: 'دسترسی جهانی',
      description: 'یادگیری از هر کجای دنیا با اینترنت',
      color: 'from-purple-500 to-pink-500',
      delay: 0.3,
    },
    {
      icon: Target,
      title: 'مسیر شغلی',
      description: 'دوره‌های کاربردی برای پیشرفت شغلی',
      color: 'from-indigo-500 to-purple-500',
      delay: 0.4,
    },
    {
      icon: Heart,
      title: 'پشتیبانی 24/7',
      description: 'تیم پشتیبانی همیشه در کنار شما',
      color: 'from-pink-500 to-rose-500',
      delay: 0.5,
    },
  ];

  return (
    <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
      <section className="mb-20 md:mb-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-purple-500/5 rounded-[3rem] -z-10"></div>
        <div className="p-10 md:p-16 lg:p-20 rounded-[3rem]">
          <div className="text-center mb-16">
            <ScrollAnimation delay={0} direction="scale" duration={0.8}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
                چرا ما را انتخاب کنید؟
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
                ما بهترین تجربه یادگیری را برای شما فراهم می‌کنیم
              </p>
            </ScrollAnimation>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {features.map((feature, index) => (
              <ScrollAnimation key={index} delay={feature.delay} direction="up" duration={0.6}>
                <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 group h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-3xl`}></div>
                  <CardContent className="p-8 md:p-10 relative h-full flex flex-col">
                    <div className={`inline-flex p-5 rounded-3xl bg-gradient-to-br ${feature.color} mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>
    </ScrollAnimation>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'علی احمدی',
      role: 'برنامه‌نویس',
      content: 'بهترین پلتفرم یادگیری که تا حالا استفاده کردم. دوره‌ها واقعاً کاربردی و مدرسان عالی هستند.',
      rating: 5,
      avatar: '👨‍💻',
      delay: 0,
    },
    {
      name: 'سارا محمدی',
      role: 'طراح UI/UX',
      content: 'کیفیت دوره‌ها فوق‌العاده است. از این که این پلتفرم را پیدا کردم خیلی خوشحالم.',
      rating: 5,
      avatar: '👩‍🎨',
      delay: 0.1,
    },
    {
      name: 'محمد رضایی',
      role: 'مدیر بازاریابی',
      content: 'دوره‌های کسب و کار خیلی مفید بودند. به کمک این دوره‌ها ترفیع گرفتم!',
      rating: 5,
      avatar: '👨‍💼',
      delay: 0.2,
    },
  ];

  return (
    <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
      <section className="mb-20 md:mb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
            نظرات دانشجویان
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            تجربه واقعی کاربران از دوره‌های ما
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {testimonials.map((testimonial, index) => (
            <ScrollAnimation key={index} delay={testimonial.delay} direction="up" duration={0.6}>
              <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 group h-full">
                <CardContent className="p-8 md:p-10">
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-lg font-medium">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-black text-lg">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground font-bold">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          ))}
        </div>
      </section>
    </ScrollAnimation>
  );
}

function CTASection() {
  return (
    <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
      <section className="mb-20 md:mb-32">
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 overflow-hidden relative group hover:shadow-2xl transition-all duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardContent className="p-16 md:p-24 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <ScrollAnimation delay={0.1} direction="scale" duration={0.8}>
                <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Rocket className="h-12 w-12 text-white" />
                </div>
              </ScrollAnimation>
              <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  آماده شروع یادگیری هستید؟
                </h2>
              </ScrollAnimation>
              <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
                <p className="text-2xl md:text-3xl text-muted-foreground mb-12 leading-relaxed font-medium">
                  با هزاران دوره آموزشی، مهارت‌های خود را ارتقا دهید و به اهداف خود برسید
                </p>
              </ScrollAnimation>
              <ScrollAnimation delay={0.4} direction="up" duration={0.8}>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link href="/?page=1">
                    <MagneticButton
                      size="lg" 
                      intensity={0.15}
                      className="text-xl px-14 h-16 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/90 hover:via-indigo-600/90 hover:to-purple-600/90 shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-500 border-2 border-white/30 group/btn"
                    >
                      <span className="font-black">مشاهده همه دوره‌ها</span>
                      <ArrowRight className="h-6 w-6 mr-3 transition-transform duration-300 group-hover/btn:translate-x-3" />
                    </MagneticButton>
                  </Link>
                  <Link href="/register">
                    <MagneticButton
                      size="lg" 
                      variant="outline"
                      intensity={0.15}
                      className="text-xl px-14 h-16 border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-500 font-black"
                    >
                      <span>ثبت نام رایگان</span>
                    </MagneticButton>
                  </Link>
                </div>
              </ScrollAnimation>
            </div>
          </CardContent>
        </Card>
      </section>
    </ScrollAnimation>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const hasSearchParams = params.search || params.category || params.level || params.page;
  
  const [featured, bestSelling, popular, newCourses] = await Promise.all([
    getFeaturedCourses(),
    getBestSellingCourses(),
    getPopularCourses(),
    getNewCourses(),
  ]);

  if (hasSearchParams) {
    const searchParamsObj = new URLSearchParams();
    if (typeof params.search === 'string' && params.search) {
      searchParamsObj.set('search', params.search);
    }
    if (typeof params.category === 'string' && params.category) {
      searchParamsObj.set('category', params.category);
    }
    if (typeof params.level === 'string' && params.level) {
      searchParamsObj.set('level', params.level);
    }
    const page = typeof params.page === 'string' 
      ? Number(params.page) 
      : Array.isArray(params.page) 
        ? Number(params.page[0]) 
        : 1;
    searchParamsObj.set('page', (page || 1).toString());
    searchParamsObj.set('limit', '12');
    
    const result = await getCourses(searchParamsObj);
    const courses = result.courses || [];

    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <SearchAndFilterClient />
          <section>
            {courses.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex p-8 rounded-full bg-muted mb-8">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-black mb-3">دوره‌ای یافت نشد</h3>
                <p className="text-muted-foreground text-xl mb-8 font-medium">فیلترهای خود را تغییر دهید</p>
                <Link href="/">
                  <Button variant="outline" size="lg">بازگشت به صفحه اصلی</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {courses.map((course: any, index: number) => (
                  <CourseCard key={course._id} course={course} index={index} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // Organization Structured Data
  const organizationStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Skiln',
    url: 'https://www.skiln.ir',
    logo: 'https://www.skiln.ir/icon-512x512.png',
    description: 'Skiln - پلتفرم تخصصی آموزش برنامه‌نویسی و هوش مصنوعی. یادگیری Python، JavaScript، React، Node.js، Machine Learning، Deep Learning و Data Science با بهترین مدرسان.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IR',
    },
    sameAs: [],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1000',
      bestRating: '5',
      worstRating: '1',
    },
  };

  // WebSite Structured Data
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Skiln',
    url: 'https://www.skiln.ir',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.skiln.ir/?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      {/* Enhanced Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
      
      <main className="container mx-auto px-4 py-10 md:py-16 relative z-10">
        {/* Modern Hero */}
        <Suspense fallback={<div className="h-[500px] mb-12 bg-muted animate-pulse rounded-2xl" />}>
          <HeroSection featuredCourse={featured.courses[0]} />
        </Suspense>

        {/* Statistics */}
        <StatisticsSection />

        {/* Categories */}
        <CategoriesSection />

        {/* Best Selling Courses */}
        <CourseSection
          title="پرفروش‌ترین دوره‌ها"
          subtitle="دوره‌های محبوب که بیشترین دانشجو را دارند"
          icon={TrendingUp}
          courses={bestSelling.courses}
          seeAllLink="/?sort=-studentsEnrolled"
          delay={0.1}
        />

        {/* Featured Courses - Carousel */}
        <Suspense fallback={<div className="h-[400px] mb-12 bg-muted animate-pulse rounded-2xl" />}>
          <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
            <CourseCarouselSection
              title="بهترین دوره‌ها"
              courses={featured.courses}
              seeAllLink="/?sort=-ratings.average"
              gradientColors={{
                start: 'hsl(var(--primary))',
                middle: 'hsl(var(--primary))',
                end: 'hsl(142, 76%, 36%)',
              }}
            />
          </ScrollAnimation>
        </Suspense>

        {/* Why Choose Us */}
        <WhyChooseUsSection />

        {/* Popular Courses */}
        <CourseSection
          title="محبوب‌ترین دوره‌ها"
          subtitle="دوره‌های با بیشترین بازدید"
          icon={Zap}
          courses={popular.courses}
          seeAllLink="/?sort=-views"
          delay={0.1}
        />

        {/* New Courses - Carousel */}
        <Suspense fallback={<div className="h-[400px] mb-12 bg-muted animate-pulse rounded-2xl" />}>
          <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
            <CourseCarouselSection
              title="جدیدترین دوره‌ها"
              courses={newCourses.courses}
              seeAllLink="/?sort=-createdAt"
              gradientColors={{
                start: 'hsl(var(--primary))',
                middle: 'hsl(var(--primary))',
                end: 'hsl(142, 76%, 36%)',
              }}
            />
          </ScrollAnimation>
        </Suspense>

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Final CTA */}
        <CTASection />
      </main>
    </div>
  );
}
