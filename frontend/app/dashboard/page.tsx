'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { enrollmentsAPI, certificatesAPI, usersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getImageUrl } from '@/lib/image-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Download, 
  Play, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  User,
  Settings,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Redirect admin users to admin panel
  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      router.replace('/admin');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Don't load data if user is admin (will be redirected)
    if (user && user.role !== 'admin') {
      loadData();
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollmentsResponse, statsResponse] = await Promise.all([
        enrollmentsAPI.getMyCourses(),
        usersAPI.getStats(),
      ]);
      
      const enrollmentsData = enrollmentsResponse.data?.data?.enrollments || [];
      setEnrollments(enrollmentsData);
      setStats(statsResponse.data?.data || null);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading data:', error);
      }
      toast({
        title: 'خطا',
        description: error.response?.data?.message || 'بارگذاری اطلاعات ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (courseId: string) => {
    try {
      const response = await certificatesAPI.download(courseId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${courseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'موفق',
        description: 'گواهینامه دانلود شد',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.message || 'دانلود گواهینامه ناموفق بود',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setProfileLoading(true);
      await usersAPI.updateProfile(profileData);
      toast({
        title: 'موفق',
        description: 'پروفایل با موفقیت به‌روزرسانی شد',
        variant: 'success',
      });
      setShowProfileModal(false);
      // Refresh user data
      if (window.location) {
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.message || 'به‌روزرسانی پروفایل ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Filter enrollments based on active tab and search query
  const filteredEnrollments = enrollments
    .filter((enrollment) => enrollment.course) // Filter out enrollments without course
    .filter((enrollment) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const courseTitle = enrollment.course?.title?.toLowerCase() || '';
        if (!courseTitle.includes(query)) {
          return false;
        }
      }

      // Filter by tab
      const totalLessons = enrollment.course?.lessons?.length || 0;
      const completedLessons = enrollment.progress?.completedLessons?.length || 0;
      const progress = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      if (activeTab === 'in-progress') {
        return progress > 0 && progress < 100;
      } else if (activeTab === 'completed') {
        return progress === 100;
      } else if (activeTab === 'not-started') {
        return progress === 0;
      }
      return true; // 'all' tab
    });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <main className="container mx-auto px-4 py-4 md:py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-6 md:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                داشبورد من
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground font-medium">
                خوش آمدید، <span className="text-primary font-semibold">{user?.name}</span>! 👋
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowProfileModal(true)}
              className="w-full sm:w-auto border-2 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
            >
              <User className="h-4 w-4 ml-2" />
              <span className="font-semibold">پروفایل</span>
            </Button>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 relative z-10">
                  <CardTitle className="text-xs sm:text-sm font-semibold">کل دوره‌ها</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 relative z-10">
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                    {stats.stats?.totalCourses || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">دوره‌های ثبت‌نام شده</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 relative z-10">
                  <CardTitle className="text-xs sm:text-sm font-semibold">در حال یادگیری</CardTitle>
                  <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 relative z-10">
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.stats?.inProgressCourses || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">دوره‌های در حال پیشرفت</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 relative z-10">
                  <CardTitle className="text-xs sm:text-sm font-semibold">تکمیل شده</CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 relative z-10">
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stats.stats?.completedCourses || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">دوره‌های تمام شده</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-yellow-500/20 transition-colors"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 relative z-10">
                  <CardTitle className="text-xs sm:text-sm font-semibold">گواهینامه‌ها</CardTitle>
                  <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                    <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 relative z-10">
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {stats.stats?.certificatesCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">گواهینامه‌های دریافت شده</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Overall Progress */}
          {stats && stats.stats && (
            <Card className="mb-6 md:mb-8 border-2 bg-gradient-to-br from-primary/5 to-indigo-500/5 overflow-hidden relative group hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-indigo-500/20 rounded-lg border border-primary/30">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  پیشرفت کلی
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4 md:space-y-5">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="font-semibold">پیشرفت کل دوره‌ها</span>
                    <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                      {stats.stats.totalProgress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3 sm:h-4 overflow-hidden shadow-inner">
                    <div
                      className="h-3 sm:h-4 rounded-full bg-gradient-to-r from-primary via-indigo-600 to-purple-600 transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                      style={{ width: `${stats.stats.totalProgress || 0}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-muted-foreground gap-2 sm:gap-0 font-medium">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {stats.stats.completedLessons || 0} از {stats.stats.totalLessons || 0} درس تکمیل شده
                    </span>
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {stats.stats.studyStreak || 0} روز پیوسته
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search and Filter */}
        <div className="mb-4 md:mb-6 animate-fade-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="جستجو در دوره‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-12 border-2 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm py-2">
              همه
              <span className="mr-1">({enrollments.filter(e => e.course).length})</span>
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs sm:text-sm py-2">
              <span className="hidden md:inline">در حال یادگیری</span>
              <span className="md:hidden">یادگیری</span>
              <span className="mr-1">({enrollments.filter(e => {
                const progress = e.course?.lessons?.length > 0 
                  ? Math.round((e.progress?.completedLessons?.length || 0) / e.course.lessons.length * 100)
                  : 0;
                return progress > 0 && progress < 100;
              }).length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm py-2">
              <span className="hidden md:inline">تکمیل شده</span>
              <span className="md:hidden">تکمیل</span>
              <span className="mr-1">({enrollments.filter(e => {
                const progress = e.course?.lessons?.length > 0 
                  ? Math.round((e.progress?.completedLessons?.length || 0) / e.course.lessons.length * 100)
                  : 0;
                return progress === 100;
              }).length})</span>
            </TabsTrigger>
            <TabsTrigger value="not-started" className="text-xs sm:text-sm py-2">
              <span className="hidden md:inline">شروع نشده</span>
              <span className="md:hidden">جدید</span>
              <span className="mr-1">({enrollments.filter(e => {
                const progress = e.course?.lessons?.length > 0 
                  ? Math.round((e.progress?.completedLessons?.length || 0) / e.course.lessons.length * 100)
                  : 0;
                return progress === 0;
              }).length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredEnrollments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    {activeTab === 'all' && 'هنوز دوره‌ای ثبت‌نام نشده'}
                    {activeTab === 'in-progress' && 'دوره‌ای در حال یادگیری ندارید'}
                    {activeTab === 'completed' && 'دوره‌ای تکمیل نشده'}
                    {activeTab === 'not-started' && 'همه دوره‌ها شروع شده‌اند'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all' && 'با ثبت‌نام در یک دوره، یادگیری را شروع کنید'}
                    {activeTab === 'in-progress' && 'یک دوره را شروع کنید تا در اینجا نمایش داده شود'}
                    {activeTab === 'completed' && 'یک دوره را تکمیل کنید تا در اینجا نمایش داده شود'}
                    {activeTab === 'not-started' && 'همه دوره‌های شما شروع شده‌اند!'}
                  </p>
                  {activeTab === 'all' && (
                    <Link href="/">
                      <Button>مشاهده دوره‌ها</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredEnrollments.map((enrollment) => {
                  const course = enrollment.course;
                  
                  // Calculate progress from backend progress data and course sections
                  const totalLessons = enrollment.progress?.totalLessons || course.sections?.reduce((sum: number, section: any) => sum + (section.lessons?.length || 0), 0) || course.lessons?.length || 0;
                  const completedLessons = Array.isArray(enrollment.progress?.completedLessons) ? enrollment.progress.completedLessons.length : 0;
                  const progress = typeof enrollment.progress?.completionPercentage === 'number'
                    ? enrollment.progress.completionPercentage
                    : totalLessons > 0 
                      ? Math.round((completedLessons / totalLessons) * 100)
                      : 0;
                  const isCompleted = progress === 100;

                  // Get last accessed date
                  const lastAccessed = enrollment.progress?.updatedAt 
                    ? new Date(enrollment.progress.updatedAt).toLocaleDateString('fa-IR')
                    : null;

                  return (
                    <Card key={enrollment._id || `${user?.id || user?._id}-${course._id}`} className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/50 group hover-lift">
                      <Link href={`/courses/${course._id}`}>
                        <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-indigo-500/20">
                          <Image
                            src={getImageUrl(course.thumbnail)}
                            alt={course.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          {isCompleted && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                              ✓ تکمیل شده
                            </div>
                          )}
                        </div>
                      </Link>
                      <CardHeader className="p-4">
                        <CardTitle className="line-clamp-2 text-sm sm:text-base">{course.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {completedLessons} از {totalLessons} درس تکمیل شده
                        </CardDescription>
                        {lastAccessed && (
                          <CardDescription className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            آخرین مشاهده: {lastAccessed}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="mb-3 md:mb-4">
                          <div className="flex justify-between text-xs sm:text-sm mb-2">
                            <span>پیشرفت</span>
                            <span className="font-bold">{progress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            href={`/courses/${course._id}/lessons`}
                            className="flex-1"
                          >
                            <Button className="w-full" size="sm">
                              <Play className="h-4 w-4 ml-2" />
                              {progress === 0 ? 'شروع' : 'ادامه'}
                            </Button>
                          </Link>
                          {isCompleted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDownloadCertificate(course._id);
                              }}
                              title="دانلود گواهینامه"
                              className="w-full sm:w-auto"
                            >
                              <Award className="h-4 w-4 ml-2 sm:ml-0" />
                              <span className="sm:hidden">گواهینامه</span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Recent Activity Section */}
        {stats && stats.lastAccessed && stats.lastAccessed.length > 0 && (
          <Card className="mt-6 md:mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                آخرین دوره‌های مشاهده شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 md:space-y-3">
                {stats.lastAccessed.slice(0, 5).map((enrollment: any) => (
                  <Link
                    key={enrollment._id}
                    href={`/courses/${enrollment.course._id}`}
                    className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="relative h-12 w-12 md:h-16 md:w-16 flex-shrink-0">
                      <Image
                        src={enrollment.course.thumbnail || '/img/cr1.webp'}
                        alt={enrollment.course.title}
                        fill
                        className="object-cover rounded"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm sm:text-base">{enrollment.course.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {enrollment.progress?.completionPercentage || 0}% تکمیل شده
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="hidden sm:flex">
                      <Play className="h-4 w-4" />
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">ویرایش پروفایل</DialogTitle>
              <DialogDescription className="text-sm">
                اطلاعات پروفایل خود را تغییر دهید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4 py-3 md:py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">نام</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="نام خود را وارد کنید"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">ایمیل</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="ایمیل خود را وارد کنید"
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowProfileModal(false)}
                disabled={profileLoading}
                className="w-full sm:w-auto"
              >
                انصراف
              </Button>
              <Button onClick={handleUpdateProfile} disabled={profileLoading} className="w-full sm:w-auto">
                {profileLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  'ذخیره تغییرات'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
