'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building2, ExternalLink, Loader2 } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface PayirCheckoutProps {
  payirUrl: string;
  paymentId: string;
  courseId: string;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function PayirCheckout({
  payirUrl,
  paymentId,
  courseId,
  amount,
  onSuccess,
  onCancel
}: PayirCheckoutProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handlePay = () => {
    if (!payirUrl) {
      toast({
        title: 'خطا',
        description: 'لینک پرداخت در دسترس نیست',
        variant: 'destructive',
      });
      return;
    }

    // Redirect to Pay.ir payment page
    window.location.href = payirUrl;
  };

  return (
    <div className="space-y-4">
      <div className="p-6 text-center border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
        <h3 className="font-bold text-lg mb-2">پرداخت از طریق پی‌ایر</h3>
        <p className="text-sm text-muted-foreground mb-4">
          مبلغ {amount.toLocaleString('fa-IR')} تومان
        </p>
        <p className="text-xs text-muted-foreground">
          پس از کلیک بر روی دکمه زیر، به صفحه پرداخت پی‌ایر هدایت می‌شوید
        </p>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            انصراف
          </Button>
        )}
        <Button
          onClick={handlePay}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <ExternalLink className="h-4 w-4 ml-2" />
          انتقال به پی‌ایر
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        <p>🔒 پرداخت شما از طریق درگاه امن پی‌ایر انجام می‌شود</p>
      </div>
    </div>
  );
}

