'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, RefreshCw, AlertTriangle, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

function PaymentFailedPageContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const getReasonMessage = () => {
    switch (reason) {
      case 'cancelled':
        return {
          title: 'پرداخت لغو شد',
          message: 'پرداخت توسط شما لغو شد. در صورت نیاز می‌توانید دوباره تلاش کنید.',
          icon: <XCircle className="h-6 w-6" />
        };
      case 'not_found':
        return {
          title: 'اطلاعات پرداخت یافت نشد',
          message: 'اطلاعات پرداخت شما در سیستم یافت نشد. لطفاً با پشتیبانی تماس بگیرید.',
          icon: <AlertTriangle className="h-6 w-6" />
        };
      case 'verification_failed':
        return {
          title: 'تایید پرداخت ناموفق',
          message: 'تایید پرداخت ناموفق بود. اگر مبلغ از حساب شما کسر شده، طی 24-48 ساعت برگشت داده می‌شود.',
          icon: <AlertTriangle className="h-6 w-6" />
        };
      default:
        return {
          title: 'پرداخت ناموفق',
          message: 'پرداخت ناموفق بود. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.',
          icon: <XCircle className="h-6 w-6" />
        };
    }
  };

  const reasonInfo = getReasonMessage();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Failed Card */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="text-center p-4 md:p-6">
              <div className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <div className="text-red-600 dark:text-red-400">
                  {reasonInfo.icon}
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl text-red-600 dark:text-red-400">
                {reasonInfo.title}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2">
                {reasonInfo.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 space-y-4">
              {/* Important Notes */}
              <div className="p-4 md:p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  نکات مهم
                </h4>
                <ul className="text-xs sm:text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                    <span>اگر مبلغ از حساب شما کسر شده، طی 24-48 ساعت به صورت خودکار برگشت داده می‌شود</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                    <span>در صورت مشکل یا سوال، با پشتیبانی تماس بگیرید</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                    <span>می‌توانید دوباره تلاش کنید یا از روش پرداخت دیگری استفاده کنید</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                    <span>اطمینان حاصل کنید که اطلاعات کارت بانکی شما صحیح است</span>
                  </li>
                </ul>
              </div>

              {/* Support Section */}
              <div className="p-4 md:p-6 bg-muted rounded-lg border">
                <h4 className="font-semibold text-sm sm:text-base mb-3">نیاز به کمک دارید؟</h4>
                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>ایمیل: support@lms-bozorgani.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>تلفن: 021-12345678</span>
                  </div>
                </div>
              </div>

              {/* Common Issues */}
              <div className="p-4 md:p-6 bg-card border rounded-lg">
                <h4 className="font-semibold text-sm sm:text-base mb-3">مشکلات رایج و راه‌حل‌ها</h4>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <p className="font-medium mb-1">مشکل: موجودی کافی نیست</p>
                    <p className="text-muted-foreground">راه‌حل: اطمینان حاصل کنید که موجودی حساب شما کافی است</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">مشکل: اطلاعات کارت اشتباه است</p>
                    <p className="text-muted-foreground">راه‌حل: اطلاعات کارت بانکی خود را دوباره بررسی کنید</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">مشکل: اتصال به اینترنت قطع شد</p>
                    <p className="text-muted-foreground">راه‌حل: اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="default"
                  className="flex-1 text-sm sm:text-base"
                  onClick={() => window.history.back()}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تلاش مجدد
                </Button>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    <ArrowLeft className="h-4 w-4 ml-2" />
                    بازگشت به صفحه اصلی
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    داشبورد
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


export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        در حال بارگذاری...
      </div>
    }>
      <PaymentFailedPageContent />
    </Suspense>
  );
}
