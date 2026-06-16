'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Banknote, ExternalLink, Loader2 } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface IDPayCheckoutProps {
  idpayUrl: string;
  paymentId: string;
  courseId: string;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function IDPayCheckout({
  idpayUrl,
  paymentId,
  courseId,
  amount,
  onSuccess,
  onCancel
}: IDPayCheckoutProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handlePay = () => {
    if (!idpayUrl) {
      toast({
        title: 'خطا',
        description: 'لینک پرداخت در دسترس نیست',
        variant: 'destructive',
      });
      return;
    }

    // Redirect to IDPay payment page
    window.location.href = idpayUrl;
  };

  return (
    <div className="space-y-4">
      <div className="p-6 text-center border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <Banknote className="h-12 w-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
        <h3 className="font-bold text-lg mb-2">پرداخت از طریق آیدی پی</h3>
        <p className="text-sm text-muted-foreground mb-4">
          مبلغ {amount.toLocaleString('fa-IR')} تومان
        </p>
        <p className="text-xs text-muted-foreground">
          پس از کلیک بر روی دکمه زیر، به صفحه پرداخت آیدی پی هدایت می‌شوید
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
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
        >
          <ExternalLink className="h-4 w-4 ml-2" />
          انتقال به آیدی پی
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        <p>🔒 پرداخت شما از طریق درگاه امن آیدی پی انجام می‌شود</p>
      </div>
    </div>
  );
}

