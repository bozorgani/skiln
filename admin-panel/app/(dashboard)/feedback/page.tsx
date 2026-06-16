'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reviewsAPI } from '@/lib/api';
import { Star, Check, X } from 'lucide-react';

export default function FeedbackPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getAll({ limit: 100 });
      const reviewsData = response.data?.data?.reviews || response.data?.data?.data?.reviews || [];
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
      const errorMessage = error.response?.data?.message || 'خطا در بارگذاری نظرات';
      alert(errorMessage); // In production, use toast notification
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id: string, isApproved: boolean) => {
    try {
      await reviewsAPI.moderate(id, isApproved);
      await loadReviews();
    } catch (error: any) {
      console.error('Error moderating review:', error);
      const errorMessage = error.response?.data?.message || 'خطا در تایید/رد نظر';
      alert(errorMessage); // In production, use toast notification
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <Star className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">در حال بارگذاری نظرات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">نظرات و بازخوردها</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          مدیریت نظرات کاربران
        </p>
      </div>

      <Card className="animate-slide-up delay-200">
        <CardHeader>
          <CardTitle>لیست نظرات</CardTitle>
          <CardDescription>
            تعداد کل نظرات: {reviews.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">نظری یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {reviews.map((review, index) => (
                <Card 
                  key={review.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{review.title || 'بدون عنوان'}</CardTitle>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < (review.rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <CardDescription className="mt-2 line-clamp-2 text-sm">
                          {review.content || 'بدون محتوا'}
                        </CardDescription>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0 ${
                        review.isApproved 
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {review.isApproved ? 'تایید شده' : 'در انتظار تایید'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-border/50">
                      <div className="text-sm text-muted-foreground">
                        از: {review.user?.name || 'نامشخص'}
                      </div>
                      {!review.isApproved && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModerate(review.id, true)}
                            className="flex-1 sm:flex-none rounded-xl hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"
                          >
                            <Check className="h-4 w-4 ml-2" />
                            تایید
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModerate(review.id, false)}
                            className="flex-1 sm:flex-none rounded-xl hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                          >
                            <X className="h-4 w-4 ml-2" />
                            رد
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

