'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface TestPaymentCheckoutProps {
  testPaymentUrl: string;
  paymentId: string;
  orderId: string;
  courseId: string;
  amount: number;
  onSuccess: (result?: any) => void;
  onCancel?: () => void;
}

export default function TestPaymentCheckout({
  testPaymentUrl,
  paymentId,
  orderId,
  courseId,
  amount,
  onSuccess,
  onCancel
}: TestPaymentCheckoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleTestPayment = async () => {
    setProcessing(true);
    setSimulating(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await paymentsAPI.completeTestPayment({
        orderId,
        paymentId,
        courseId,
        amount,
      });

      const result = response.data;
      
      toast({
        title: 'پرداخت موفق',
        description: `مبلغ ${amount.toLocaleString('fa-IR')} تومان با موفقیت پرداخت شد (حالت تست)`,
        variant: 'success',
      });

      // Wait a bit before calling onSuccess to show the success message
      setTimeout(() => {
        setSimulating(false);
        setProcessing(false);
        onSuccess(result?.data || result);
      }, 500);

    } catch (error: any) {
      setSimulating(false);
      setProcessing(false);
      toast({
        title: 'خطا در پرداخت',
        description: error.message || error.response?.data?.message || 'خطا در انجام پرداخت تست',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 text-center border-2 border-dashed border-yellow-400 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
        <h3 className="font-bold text-lg mb-2">پرداخت تست (Mock Payment)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          مبلغ {amount.toLocaleString('fa-IR')} تومان
        </p>
        <div className="text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-yellow-700 dark:text-yellow-300">
            ⚠️ توجه: این یک پرداخت تست است
          </p>
          <p>
            در حالت تست، هیچ مبلغی از حساب شما کسر نمی‌شود.
            برای استفاده از درگاه‌های واقعی، لطفاً تنظیمات پرداخت را در پنل مدیریت فعال کنید.
          </p>
        </div>
      </div>

      {simulating ? (
        <div className="p-4 border rounded-lg bg-muted space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>در حال شبیه‌سازی پرداخت...</span>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>بررسی موجودی</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>تایید پرداخت</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={processing}
            >
              انصراف
            </Button>
          )}
          <Button
            onClick={handleTestPayment}
            disabled={processing}
            className="flex-1 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white"
          >
            <CreditCard className="h-4 w-4 ml-2" />
            پرداخت تست (موفق)
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        <p>این پرداخت برای تست سیستم است و هیچ مبلغ واقعی دریافت نمی‌شود</p>
      </div>
    </div>
  );
}

