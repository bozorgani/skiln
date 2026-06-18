'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { coursesAPI } from '@/lib/api';
import { getAdminImageUrl } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  DollarSign, 
  FileText, 
  Search,
  Eye,
  EyeOff,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

export default function CoursesPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll({ limit: 100, includeUnpublished: 'true' });
      
      // Debug: Log full response structure
      
      // Try different possible response structures
      // Backend returns: { success, message, data: { courses: [...] } }
      // Axios wraps it in response.data, so we need response.data.data
      let coursesData = [];
      
      if (response.data) {
        // Case 1: response.data.data.courses (most common - from sendResponse)
        if (response.data.data?.courses && Array.isArray(response.data.data.courses)) {
          coursesData = response.data.data.courses;
        }
        // Case 2: response.data.data is directly an array
        else if (Array.isArray(response.data.data)) {
          coursesData = response.data.data;
        }
        // Case 3: response.data.courses (if controller doesn't wrap in data)
        else if (Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
        }
        // Case 4: response.data is directly an array
        else if (Array.isArray(response.data)) {
          coursesData = response.data;
        }
        // Case 5: Check if there's a results array
        else if (response.data.data?.results && Array.isArray(response.data.data.results)) {
          coursesData = response.data.data.results;
        }
        // Case 6: Check if there's a items array
        else if (response.data.data?.items && Array.isArray(response.data.data.items)) {
          coursesData = response.data.data.items;
        }
      }
      
      
      if (coursesData.length === 0) {
      }
      
      setCourses(coursesData);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorTitle = 'خطا در بارگذاری دوره‌ها';
      let errorDescription = 'لطفاً دوباره تلاش کنید';
      
      if (error.response?.status === 401) {
        errorDescription = 'احراز هویت ناموفق بود. لطفاً دوباره وارد شوید.';
      } else if (error.response?.status === 403) {
        errorDescription = 'شما دسترسی لازم برای مشاهده دوره‌ها را ندارید.';
      } else if (error.response?.data?.message) {
        errorDescription = error.response.data.message;
      } else if (error.message) {
        errorDescription = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorDescription,
      });
      
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string, courseTitle: string) => {
    if (!confirm(`آیا از حذف دوره "${courseTitle}" اطمینان دارید؟ این عمل قابل بازگشت نیست.`)) {
      return;
    }

    try {
      await coursesAPI.delete(courseId);
      toast({
        variant: 'success',
        title: 'موفقیت آمیز',
        description: 'دوره با موفقیت حذف شد',
      });
      loadCourses();
    } catch (error: any) {
      const errorDescription = error.response?.data?.message || error.message || 'خطا در حذف دوره';
      toast({
        variant: 'destructive',
        title: 'خطا در حذف دوره',
        description: errorDescription,
      });
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(search.toLowerCase()) ||
                         course.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    totalStudents: courses.reduce((acc, c) => acc + (c.students?.length || 0), 0),
    totalRevenue: courses.reduce((acc, c) => acc + (c.price || 0) * (c.students?.length || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">در حال بارگذاری دوره‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">مدیریت دوره‌ها</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            مدیریت و ویرایش دوره‌های آموزشی
          </p>
        </div>
        <Link href="/courses/new">
          <Button className="gap-2 gradient-primary shadow-glow hover:shadow-glow-sm w-full sm:w-auto h-11 sm:h-auto">
            <Plus className="h-4 w-4" />
            دوره جدید
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">کل دوره‌ها</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.total}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10 flex-shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-all duration-300 animate-slide-up delay-75">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">منتشر شده</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.published}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-green-500/10 flex-shrink-0">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-all duration-300 animate-slide-up delay-150">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">پیش‌نویس</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.draft}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10 flex-shrink-0">
                <EyeOff className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-all duration-300 animate-slide-up delay-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">دانشجویان</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats.totalStudents}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-purple-500/10 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="animate-slide-up delay-300">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در دوره‌ها..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 h-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="rounded-xl"
              >
                همه ({stats.total})
              </Button>
              <Button
                variant={filterStatus === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('published')}
                className="rounded-xl"
              >
                <Eye className="h-4 w-4 ml-1" />
                منتشر شده ({stats.published})
              </Button>
              <Button
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('draft')}
                className="rounded-xl"
              >
                <EyeOff className="h-4 w-4 ml-1" />
                پیش‌نویس ({stats.draft})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="animate-slide-up delay-400">
          <CardContent className="py-12 sm:py-16 text-center">
            {courses.length === 0 ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">هنوز دوره‌ای ایجاد نشده است</h3>
                <p className="text-muted-foreground mb-6">اولین دوره آموزشی خود را ایجاد کنید</p>
                <Link href="/courses/new">
                  <Button className="gap-2 gradient-primary shadow-glow hover:shadow-glow-sm">
                    <Plus className="h-4 w-4" />
                    ایجاد اولین دوره
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">نتیجه‌ای یافت نشد</h3>
                <p className="text-muted-foreground">لطفاً عبارت جستجوی دیگری را امتحان کنید</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course, index) => {
            const totalLessons = course.sections?.reduce((acc: number, section: any) => 
              acc + (section.lessons?.length || 0), 0) || 0;
            
            return (
              <Card 
                key={course._id || course.id}
                className="group hover:scale-[1.02] transition-all duration-300 animate-slide-up overflow-hidden"
                style={{ animationDelay: `${(index % 6) * 50}ms` }}
              >
                {/* Course Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary/20 via-purple-500/20 to-blue-500/20 overflow-hidden">
                  {course.thumbnail ? (
                    <img 
                      src={getAdminImageUrl(course.thumbnail)} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
                      course.status === 'published' 
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' 
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}>
                      {course.status === 'published' ? (
                        <>
                          <Eye className="h-3 w-3" />
                          منتشر شده
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          پیش‌نویس
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg sm:text-xl font-bold line-clamp-2 min-h-[3rem]">
                    {course.title || 'بدون عنوان'}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {course.description?.substring(0, 100) || 'بدون توضیحات'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Course Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                      <div className="p-1.5 rounded-lg bg-blue-500/10">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">قیمت</p>
                        <p className="text-sm font-bold truncate">
                          {course.price?.toLocaleString() || 'رایگان'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                      <div className="p-1.5 rounded-lg bg-purple-500/10">
                        <Users className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">دانشجویان</p>
                        <p className="text-sm font-bold truncate">
                          {course.students?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                      <div className="p-1.5 rounded-lg bg-green-500/10">
                        <FileText className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">بخش‌ها</p>
                        <p className="text-sm font-bold truncate">
                          {course.sections?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                      <div className="p-1.5 rounded-lg bg-orange-500/10">
                        <Play className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">درس‌ها</p>
                        <p className="text-sm font-bold truncate">
                          {totalLessons}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Link href={`/courses/${course._id || course.id}/edit`} className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full rounded-xl hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30"
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        ویرایش
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="rounded-xl hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                      onClick={() => handleDelete(course._id || course.id, course.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
