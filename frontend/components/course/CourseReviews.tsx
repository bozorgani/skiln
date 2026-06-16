'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { reviewsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CourseReviewsProps {
  courseId: string;
  isEnrolled: boolean;
  isAdmin?: boolean;
  initialRating?: {
    average?: number;
    count?: number;
  };
}

export default function CourseReviews({ courseId, isEnrolled, isAdmin = false, initialRating }: CourseReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const average = useMemo(() => {
    if (initialRating?.count) return Number(initialRating.average || 0);
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;
  }, [initialRating, reviews]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getByCourse(courseId, { limit: 20 });
      setReviews(response.data?.data?.reviews || []);
    } catch (error) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      toast({ title: 'متن نظر الزامی است', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create(courseId, { rating, title: title.trim() || undefined, content: content.trim() });
      toast({
        title: 'نظر شما ثبت شد',
        description: 'پس از تأیید مدیر نمایش داده می‌شود.',
        variant: 'success',
      });
      setTitle('');
      setContent('');
      setRating(5);
    } catch (error: any) {
      toast({
        title: 'خطا در ثبت نظر',
        description: error.response?.data?.message || 'لطفاً دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              نظرات دانشجویان
            </CardTitle>
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${index < Math.round(average) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'}`}
                  />
                ))}
              </div>
              <span>{average ? average.toFixed(1) : 'بدون امتیاز'} از ۵</span>
              <span>•</span>
              <span>{initialRating?.count || reviews.length} نظر</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 bg-muted/40 rounded-xl">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-60" />
            <p className="text-muted-foreground">هنوز نظری برای این دوره ثبت نشده است.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id || review.id} className="p-4 rounded-xl border bg-card">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h4 className="font-bold">{review.title || 'نظر دانشجو'}</h4>
                    <p className="text-sm text-muted-foreground">{review.user?.name || 'کاربر Skiln'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{review.content}</p>
              </div>
            ))}
          </div>
        )}

        {user ? (
          isEnrolled || isAdmin ? (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
              <h3 className="font-bold text-lg">ثبت نظر شما</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    aria-label={`${value} ستاره`}
                  >
                    <Star className={`h-6 w-6 ${value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'}`} />
                  </button>
                ))}
              </div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان نظر (اختیاری)" />
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="تجربه خود از این دوره را بنویسید..." />
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                ثبت نظر
              </Button>
            </form>
          ) : (
            <div className="border-t pt-6 text-sm text-muted-foreground">
              برای ثبت نظر باید ابتدا در دوره ثبت‌نام کنید.
            </div>
          )
        ) : (
          <div className="border-t pt-6 text-sm text-muted-foreground">
            برای ثبت نظر لطفاً <Link className="text-primary font-bold" href="/login">وارد شوید</Link>.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
