'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, ExternalLink, Shield, CheckCircle2 } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface ZarinpalCheckoutProps {
  zarinpalUrl: string;
  paymentId: string;
  courseId: string;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ZarinpalCheckout({
  zarinpalUrl,
  paymentId,
  courseId,
  amount,
  onSuccess,
  onCancel
}: ZarinpalCheckoutProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Redirect to Zarinpal payment page
      // After payment, Zarinpal will redirect back to our callback URL
      window.location.href = zarinpalUrl;
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در هدایت به صفحه پرداخت',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Zarinpal Info Card */}
      <div className="p-4 md:p-6 border rounded-lg bg-card space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg mb-1">پرداخت از طریق زرین‌پال</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              پس از کلیک بر روی دکمه پرداخت، به صفحه امن زرین‌پال هدایت می‌شوید
            </p>
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">مبلغ قابل پرداخت:</span>
          <span className="text-lg sm:text-xl font-bold">{amount.toLocaleString('fa-IR')} تومان</span>
        </div>
      </div>

      {/* Features */}
      <div className="p-4 md:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-sm sm:text-base">مزایای پرداخت با زرین‌پال</h4>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <span>پرداخت امن از طریق درگاه معتبر زرین‌پال</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <span>پشتیبانی از تمامی کارت‌های بانکی ایران</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <span>دریافت فوری دسترسی به دوره پس از پرداخت</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <span>پشتیبانی از پرداخت با کیف پول الکترونیکی</span>
          </li>
        </ul>
      </div>

      {/* Payment Process Info */}
      <div className="p-3 md:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <strong>نکته:</strong> پس از تکمیل پرداخت در صفحه زرین‌پال، به صورت خودکار به این صفحه بازمی‌گردید.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          onClick={handlePayment}
          className="flex-1 w-full sm:w-auto"
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              در حال هدایت...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 ml-2" />
              <span className="hidden sm:inline">پرداخت از طریق زرین‌پال</span>
              <span className="sm:hidden">پرداخت</span>
            </>
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
            size="lg"
          >
            انصراف
          </Button>
        )}
      </div>
    </div>
  );
}
