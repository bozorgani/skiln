'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminAPI } from '@/lib/api';
import { Users, BookOpen, DollarSign, Ticket, TrendingUp, ArrowUpRight, Activity, Eye } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      const statsData = response.data?.data || response.data || {};
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      // Set default stats on error
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        openTickets: 0,
        publishedCourses: 0,
        activeUsers: 0,
        todayPayments: 0,
        users: { total: 0, admin: 0, teacher: 0, student: 0 },
        courses: { total: 0, published: 0, draft: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <TrendingUp className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">در حال بارگذاری آمار...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'کاربران کل',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'تعداد کل کاربران',
      color: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'دوره‌ها',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      description: 'تعداد کل دوره‌ها',
      color: 'from-green-500 to-emerald-600',
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'درآمد کل',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      description: 'مجموع درآمد',
      color: 'from-amber-500 to-orange-600',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      change: '+23%',
      trend: 'up',
    },
    {
      title: 'تیکت‌های باز',
      value: stats?.openTickets || 0,
      icon: Ticket,
      description: 'تیکت‌های در انتظار پاسخ',
      color: 'from-red-500 to-rose-600',
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10',
      change: '-5%',
      trend: 'down',
    },
  ];

  const additionalStats = [
    {
      title: 'دوره‌های منتشر شده',
      value: stats?.publishedCourses || stats?.courses?.published || 0,
      icon: Eye,
      change: '+3',
      trend: 'up',
    },
    {
      title: 'کاربران فعال',
      value: stats?.activeUsers || 0,
      icon: Activity,
      change: '+15',
      trend: 'up',
    },
    {
      title: 'پرداخت‌های امروز',
      value: stats?.todayPayments || 0,
      icon: TrendingUp,
      change: '+28%',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">داشبورد مدیریت</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          خوش آمدید به پنل مدیریت سیستم LMS
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title}
              className={`group hover:scale-[1.02] transition-all duration-300 animate-slide-up overflow-hidden ${
                index === 0 ? 'delay-0' : 
                index === 1 ? 'delay-75' : 
                index === 2 ? 'delay-150' : 'delay-200'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-baseline justify-between mb-2 gap-2">
                  <div className="text-2xl sm:text-3xl font-bold truncate">{stat.value}</div>
                  <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                    stat.trend === 'up' 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    <ArrowUpRight className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    {stat.change}
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Stats and Info Cards */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Additional Stats Card */}
        <Card className="lg:col-span-1 animate-slide-up delay-300">
          <CardHeader>
            <CardTitle>آمار تکمیلی</CardTitle>
            <CardDescription>اطلاعات آماری سیستم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {additionalStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={stat.title}
                    className="flex items-center justify-between p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors duration-300"
                    style={{ animationDelay: `${(index + 4) * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                        <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      stat.trend === 'up' 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}>
                      <ArrowUpRight className={`h-3 w-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                      {stat.change}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="animate-slide-up delay-300">
          <CardHeader>
            <CardTitle>وضعیت سیستم</CardTitle>
            <CardDescription>سرویس‌های فعال</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">وضعیت API</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">همه سرویس‌ها فعال</p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 flex-shrink-0 mr-2">آنلاین</span>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">وضعیت دیتابیس</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">اتصال برقرار</p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 flex-shrink-0 mr-2">متصل</span>
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate">آپتایم سیستم</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">99.9%</p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0 mr-2">عالی</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="animate-slide-up delay-300">
          <CardHeader>
            <CardTitle>دسترسی سریع</CardTitle>
            <CardDescription>عملیات‌های پرکاربرد</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button className="p-3 sm:p-4 rounded-xl bg-accent/50 hover:bg-accent hover:scale-105 transition-all duration-300 text-right border border-border/50 hover:border-primary/30">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1 sm:mb-2 mx-auto sm:mx-0" />
                <p className="text-xs sm:text-sm font-medium">کاربران</p>
              </button>
              <button className="p-3 sm:p-4 rounded-xl bg-accent/50 hover:bg-accent hover:scale-105 transition-all duration-300 text-right border border-border/50 hover:border-primary/30">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1 sm:mb-2 mx-auto sm:mx-0" />
                <p className="text-xs sm:text-sm font-medium">دوره‌ها</p>
              </button>
              <button className="p-3 sm:p-4 rounded-xl bg-accent/50 hover:bg-accent hover:scale-105 transition-all duration-300 text-right border border-border/50 hover:border-primary/30">
                <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1 sm:mb-2 mx-auto sm:mx-0" />
                <p className="text-xs sm:text-sm font-medium">تیکت‌ها</p>
              </button>
              <button className="p-3 sm:p-4 rounded-xl bg-accent/50 hover:bg-accent hover:scale-105 transition-all duration-300 text-right border border-border/50 hover:border-primary/30">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1 sm:mb-2 mx-auto sm:mx-0" />
                <p className="text-xs sm:text-sm font-medium">گزارش‌ها</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
