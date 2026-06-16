'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, BookOpen, Calendar, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { paymentsAPI } from '@/lib/api';

function PaymentSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    // Refresh after 3 seconds to update enrollment status
    const timer = setTimeout(() => {
      router.refresh();
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await paymentsAPI.getById(paymentId!);
      const paymentData = response.data?.data?.payment || response.data?.data;
      setPayment(paymentData);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'stripe':
        return 'کارت بانکی (Stripe)';
      case 'zarinpal':
        return 'زرین‌پال';
      default:
        return method;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Card */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="text-center p-4 md:p-6">
              <div className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl text-green-600 dark:text-green-400">
                پرداخت موفق!
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                پرداخت شما با موفقیت انجام شد و در دوره ثبت‌نام شدید
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : payment && payment.course ? (
                <>
                  {/* Course Info */}
                  <div className="p-4 md:p-6 bg-muted rounded-lg border-2 border-green-200 dark:border-green-800">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {payment.course.thumbnail && (
                        <div className="relative w-full sm:w-32 h-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={payment.course.thumbnail}
                            alt={payment.course.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg mb-2">{payment.course.title}</h3>
                        {payment.course.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {payment.course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      جزئیات پرداخت
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 md:p-4 bg-card border rounded-lg">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">مبلغ پرداختی</p>
                        <p className="font-bold text-base sm:text-lg">
                          {payment.amount.toLocaleString('fa-IR')} {payment.currency === 'IRR' ? 'تومان' : 'دلار'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">روش پرداخت</p>
                        <p className="font-semibold text-sm sm:text-base">{getPaymentMethodName(payment.paymentMethod)}</p>
                      </div>
                      {payment.transactionId && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">شماره تراکنش</p>
                          <p className="font-mono text-xs sm:text-sm break-all">{payment.transactionId}</p>
                        </div>
                      )}
                      {payment.paidAt && (
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">تاریخ پرداخت</p>
                          <p className="text-sm sm:text-base">{formatDate(payment.paidAt)}</p>
                        </div>
                      )}
                      {paymentId && (
                        <div className="sm:col-span-2">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">شناسه پرداخت</p>
                          <p className="font-mono text-xs sm:text-sm break-all">{paymentId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-sm sm:text-base mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      مراحل بعدی
                    </h4>
                    <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground list-disc list-inside">
                      <li>اکنون می‌توانید به دوره دسترسی داشته باشید</li>
                      <li>از داشبورد خود به دوره‌های ثبت‌نام شده دسترسی داشته باشید</li>
                      <li>پیشرفت خود را در داشبورد پیگیری کنید</li>
                    </ul>
                  </div>
                </>
              ) : (
                paymentId && (
                  <div className="p-3 md:p-4 bg-muted rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">شناسه پرداخت:</p>
                    <p className="font-mono text-xs sm:text-sm break-all">{paymentId}</p>
                  </div>
                )
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {payment?.course?._id && (
                  <Link href={`/courses/${payment.course._id}`} className="flex-1">
                    <Button className="w-full text-sm sm:text-base">
                      <BookOpen className="h-4 w-4 ml-2" />
                      مشاهده دوره
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard" className="flex-1">
                  <Button variant="default" className="w-full text-sm sm:text-base">
                    <ArrowLeft className="h-4 w-4 ml-2" />
                    رفتن به داشبورد
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    صفحه اصلی
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        در حال بارگذاری...
      </div>
    }>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
