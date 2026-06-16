'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/contexts/CartContext';
import { coursesAPI, paymentsAPI, enrollmentsAPI, couponsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowRight, CheckCircle2, Award, Globe, Clock, Lock, Trash2, ShoppingBag } from 'lucide-react';
import PaymentDialog from '@/components/payment/PaymentDialog';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, removeFromCart, clearCart, totalPrice } = useCart();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret?: string;
    paymentId: string;
    orderId?: string;
    zarinpalUrl?: string;
    payirUrl?: string;
    idpayUrl?: string;
    testPaymentUrl?: string;
  } | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponResult, setCouponResult] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    originalAmount: number;
  } | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push(`/login?redirect=/checkout`);
      return;
    }

    // Load course data
    if (user && items.length > 0) {
      loadCourses();
    } else if (user && items.length === 0) {
      setLoading(false);
    }
  }, [user, authLoading, items.length, router]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursePromises = items.map((item) => coursesAPI.getById(item.courseId));
      const responses = await Promise.all(coursePromises);
      const coursesData = responses.map((res) => res.data.data.course);
      setCourses(coursesData);

      // Check enrollments
      const enrollmentPromises = items.map((item) =>
        enrollmentsAPI.getEnrollment(item.courseId).catch(() => null)
      );
      const enrollmentResponses = await Promise.all(enrollmentPromises);
      const enrolled = new Set<string>();
      enrollmentResponses.forEach((res, index) => {
        if (res?.data?.enrollment) {
          enrolled.add(items[index].courseId);
        }
      });
      setEnrolledCourses(enrolled);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری اطلاعات دوره‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // اگر سبد خرید تغییر کند، نتیجه کد تخفیف را ریست کن
  useEffect(() => {
    setCouponResult(null);
    setCouponError(null);
  }, [items.length]);

  const handleRemoveFromCart = (courseId: string) => {
    removeFromCart(courseId);
    toast({
      title: 'حذف شد',
      description: 'دوره از سبد خرید حذف شد',
      variant: 'success',
    });
  };

  const handlePurchase = async () => {
    if (!user) {
      router.push(`/login?redirect=/checkout`);
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'خطا',
        description: 'سبد خرید خالی است',
        variant: 'destructive',
      });
      return;
    }

    // Filter out enrolled courses
    const coursesToPurchase = items.filter((item) => !enrolledCourses.has(item.courseId));

    if (coursesToPurchase.length === 0) {
      toast({
        title: 'توجه',
        description: 'شما در تمام این دوره‌ها ثبت‌نام کرده‌اید',
        variant: 'destructive',
      });
      return;
    }

    // Check if all courses are free
    const allFree = coursesToPurchase.every((item) => item.price === 0);
    
    if (allFree) {
      // Enroll in all free courses
      setProcessing(true);
      try {
        for (const item of coursesToPurchase) {
          await enrollmentsAPI.enroll(item.courseId);
        }
        toast({
          title: 'موفق',
          description: `با موفقیت در ${coursesToPurchase.length} دوره ثبت‌نام شدید!`,
          variant: 'success',
        });
        clearCart();
        router.push('/dashboard');
      } catch (error: any) {
        toast({
          title: 'خطا',
          description: error.response?.data?.message || 'خطا در ثبت‌نام',
          variant: 'destructive',
        });
      } finally {
        setProcessing(false);
      }
      return;
    }

    // For paid courses, we'll handle one at a time for now
    // In the future, we can implement a multi-course payment
    if (coursesToPurchase.length > 1) {
      toast({
        title: 'توجه',
        description: 'در حال حاضر امکان پرداخت چند دوره به صورت همزمان وجود ندارد. لطفاً یک دوره را انتخاب کنید.',
        variant: 'destructive',
      });
      return;
    }

    const courseToPurchase = coursesToPurchase[0];
    setProcessing(true);
    try {
      const payload: any = { courseId: courseToPurchase.courseId };
      if (couponResult?.code) {
        payload.couponCode = couponResult.code;
      }

      // ایجاد درخواست پرداخت
      const response = await paymentsAPI.createIntent(
        courseToPurchase.courseId,
        couponResult?.code
      );
      const { data } = response.data;

      if (!data.paymentRequired) {
        toast({
          title: 'موفق',
          description: 'با موفقیت ثبت‌نام شدید!',
          variant: 'success',
        });
        removeFromCart(courseToPurchase.courseId);
        router.refresh();
        return;
      }

      if (!data.clientSecret && !data.zarinpalUrl && !data.payirUrl && !data.idpayUrl && !data.testPaymentUrl) {
        toast({
          title: 'خطا',
          description: 'هیچ روش پرداختی در حال حاضر فعال نیست. لطفاً با پشتیبانی تماس بگیرید.',
          variant: 'destructive',
        });
        return;
      }

      setPaymentData({
        clientSecret: data.clientSecret,
        paymentId: data.paymentId || data.orderId,
        orderId: data.orderId,
        zarinpalUrl: data.zarinpalUrl,
        payirUrl: data.payirUrl,
        idpayUrl: data.idpayUrl,
        testPaymentUrl: data.testPaymentUrl,
      });
      setPaymentDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.message || 'خطا در ایجاد درخواست پرداخت',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = (result?: any) => {
    if (paymentData && items.length > 0) {
      const courseId = items[0].courseId;
      removeFromCart(courseId);
    }
    toast({
      title: 'موفق',
      description: 'پرداخت انجام شد و ثبت‌نام شدید!',
      variant: 'success',
    });
    router.refresh();
    setPaymentDialogOpen(false);

    const successPaymentId =
      result?.payment?.paymentId ||
      result?.payment?._id ||
      result?.paymentId ||
      paymentData?.paymentId;

    setPaymentData(null);

    if (successPaymentId) {
      router.push(`/payment/success?paymentId=${successPaymentId}`);
    } else {
      router.push('/dashboard');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-bold mb-2">سبد خرید شما خالی است</h2>
              <p className="text-muted-foreground mb-6">دوره‌های مورد نظر خود را به سبد خرید اضافه کنید</p>
              <Link href="/">
                <Button>مشاهده دوره‌ها</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const coursesToPurchase = items.filter(
    (item) => !enrolledCourses.has(item.courseId)
  );
  const totalToPay = coursesToPurchase.reduce(
    (sum, item) => sum + item.price,
    0
  );
  const finalTotal =
    couponResult && couponResult.finalAmount >= 0
      ? couponResult.finalAmount
      : totalToPay;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('لطفاً کد تخفیف را وارد کنید');
      return;
    }

    if (coursesToPurchase.length === 0) {
      setCouponError('دوره‌ای برای اعمال کد تخفیف وجود ندارد');
      return;
    }

    const courseToPurchase = coursesToPurchase[0];

    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await couponsAPI.validate({
        code: couponCode.trim(),
        courseId: courseToPurchase.courseId,
        amount: courseToPurchase.price,
      });

      const result = response.data?.data;

      if (!result) {
        setCouponError('نتیجه‌ای برای این کد تخفیف یافت نشد');
        setCouponResult(null);
        return;
      }

      setCouponResult({
        code: result.code,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        originalAmount: result.originalAmount,
      });

      toast({
        title: 'کد تخفیف اعمال شد',
        description: `مبلغ تخفیف: ${result.discountAmount.toLocaleString(
          'fa-IR'
        )} تومان`,
        variant: 'success',
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'کد تخفیف نامعتبر است یا قابل استفاده نیست';
      setCouponError(message);
      setCouponResult(null);
      toast({
        title: 'خطا در کد تخفیف',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">سبد خرید</h1>
            <p className="text-muted-foreground">لطفاً دوره‌های خود را بررسی و پرداخت را تکمیل کنید</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => {
                const course = courses.find((c) => c?._id === item.courseId);
                const isEnrolled = enrolledCourses.has(item.courseId);
                
                return (
                  <Card key={item.courseId} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative w-24 h-16 sm:w-32 sm:h-20 rounded-lg overflow-hidden border flex-shrink-0">
                          <Image
                            src={item.thumbnail || '/img/cr1.webp'}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2">{item.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <span>{item.price === 0 ? 'رایگان' : `${item.price.toLocaleString('fa-IR')} تومان`}</span>
                              </div>
                              {isEnrolled && (
                                <span className="inline-block px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs rounded-md">
                                  ثبت‌نام شده
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFromCart(item.courseId)}
                              className="flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="border-2 shadow-xl sticky top-20">
                <CardHeader className="border-b">
                  <CardTitle>خلاصه سفارش</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">تعداد دوره:</span>
                      <span className="font-semibold">{items.length} دوره</span>
                    </div>
                    {coursesToPurchase.length < items.length && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>ثبت‌نام شده:</span>
                        <span>{items.length - coursesToPurchase.length} دوره</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">قابل پرداخت:</span>
                      <span className="font-semibold">
                        {coursesToPurchase.length} دوره
                      </span>
                    </div>
                    {/* Coupon input */}
                    {coursesToPurchase.length > 0 && (
                      <div className="pt-3 border-t space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          کد تخفیف
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="مثلاً: SKILN20"
                            className="text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading}
                          >
                            {couponLoading ? 'در حال بررسی...' : 'اعمال کد'}
                          </Button>
                        </div>
                        {couponError && (
                          <p className="text-xs text-destructive">{couponError}</p>
                        )}
                        {couponResult && couponResult.discountAmount > 0 && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">
                            کد <span className="font-bold">{couponResult.code}</span> اعمال شد.
                            تخفیف:{' '}
                            <span className="font-bold">
                              {couponResult.discountAmount.toLocaleString('fa-IR')} تومان
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">مجموع نهایی:</span>
                        <span className="font-bold text-xl text-primary">
                          {finalTotal === 0
                            ? 'رایگان'
                            : `${finalTotal.toLocaleString('fa-IR')} تومان`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  {coursesToPurchase.length === 0 ? (
                    <Button className="w-full" size="lg" disabled>
                      تمام دوره‌ها ثبت‌نام شده
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePurchase}
                      className="w-full"
                      size="lg"
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          در حال پردازش...
                        </>
                      ) : (
                        <>
                          {totalToPay === 0 ? 'ثبت‌نام رایگان' : 'پرداخت'}
                          <ArrowRight className="h-4 w-4 mr-2" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Course Features */}
                  <div className="pt-4 border-t space-y-3">
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
                  </div>

                  {/* Security Notice */}
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>تمامی پرداخت‌ها به صورت امن و رمزگذاری شده انجام می‌شود</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      {paymentData && coursesToPurchase.length > 0 && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          clientSecret={paymentData.clientSecret}
          paymentId={paymentData.paymentId}
          orderId={paymentData.orderId}
          courseId={coursesToPurchase[0].courseId}
          amount={finalTotal}
          zarinpalUrl={paymentData.zarinpalUrl}
          payirUrl={paymentData.payirUrl}
          idpayUrl={paymentData.idpayUrl}
          testPaymentUrl={paymentData.testPaymentUrl}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

