'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { blogAPI } from '@/lib/api';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await blogAPI.getAll({ limit: 100 });
      const postsData = response.data?.data?.posts || response.data?.data?.data?.posts || [];
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      const errorMessage = error.response?.data?.message || 'خطا در بارگذاری پست‌ها';
      alert(errorMessage); // In production, use toast notification
      setPosts([]);
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
          </div>
          <p className="mt-4 text-muted-foreground font-medium">در حال بارگذاری پست‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">مدیریت وبلاگ</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            مدیریت پست‌های وبلاگ
          </p>
        </div>
        <Link href="/blog/new" className="w-full sm:w-auto">
          <Button className="gap-2 gradient-primary shadow-glow hover:shadow-glow-sm w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            پست جدید
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card className="animate-slide-up delay-200">
          <CardContent className="py-12 sm:py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">هنوز پستی ایجاد نشده است</h3>
            <p className="text-muted-foreground mb-6">اولین پست وبلاگ خود را ایجاد کنید</p>
            <Link href="/blog/new">
              <Button className="gap-2 gradient-primary shadow-glow hover:shadow-glow-sm">
                <Plus className="h-4 w-4" />
                ایجاد اولین پست
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Card 
              key={post.id}
              className="group hover:scale-[1.02] transition-all duration-300 animate-slide-up overflow-hidden"
              style={{ animationDelay: `${(index % 6) * 50}ms` }}
            >
              <CardHeader>
                <CardTitle className="text-base sm:text-lg line-clamp-2 min-h-[3rem]">{post.title || 'بدون عنوان'}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm">
                  {post.excerpt || post.content?.substring(0, 100) || 'بدون توضیحات'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">وضعیت:</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      post.isPublished 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                        : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                    }`}>
                      {post.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">بازدید:</span>
                    <span className="font-semibold">{post.views || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Link href={`/blog/${post.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30">
                      <Edit className="h-4 w-4 ml-2" />
                      ویرایش
                    </Button>
                  </Link>
                  <Button variant="outline" size="icon" className="rounded-xl hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

