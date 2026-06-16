'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeCheckoutProps {
  clientSecret: string;
  paymentId: string;
  courseId: string;
  amount: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

function CheckoutForm({
  clientSecret,
  paymentId,
  courseId,
  amount,
  onSuccess,
  onCancel
}: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('لطفاً اطلاعات کارت را وارد کنید');
      setLoading(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'خطا در پرداخت');
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Verify payment on backend
        await paymentsAPI.verify(paymentId, paymentIntent.id);
        
        toast({
          title: 'موفق',
          description: 'پرداخت با موفقیت انجام شد!',
        });
        
        onSuccess();
      } else {
        setError('پرداخت ناموفق بود');
        setLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'خطا در پرداخت');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Input Section */}
      <div className="p-4 md:p-6 border rounded-lg bg-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <label className="text-sm sm:text-base font-medium">
            اطلاعات کارت بانکی
          </label>
        </div>
        
        <div className="p-3 md:p-4 border-2 rounded-lg bg-background focus-within:border-primary transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: 'hsl(var(--foreground))',
                  fontFamily: 'var(--font-vazir), system-ui, sans-serif',
                  '::placeholder': {
                    color: 'hsl(var(--muted-foreground))',
                  },
                },
                invalid: {
                  color: 'hsl(var(--destructive))',
                },
              },
            }}
            onChange={(e) => {
              setCardComplete(e.complete);
              if (e.error) {
                setError(e.error.message);
              } else {
                setError(null);
              }
            }}
          />
        </div>
        
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </p>
          </div>
        )}

        {/* Amount Display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">مبلغ قابل پرداخت:</span>
          <span className="text-lg sm:text-xl font-bold">{amount.toLocaleString('fa-IR')} تومان</span>
        </div>
      </div>

      {/* Security Features */}
      <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-muted-foreground">
            <p className="font-medium mb-1">پرداخت امن با Stripe</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>اطلاعات کارت شما ذخیره نمی‌شود</li>
              <li>پرداخت به صورت رمزگذاری شده انجام می‌شود</li>
              <li>پشتیبانی از تمامی کارت‌های بین‌المللی</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          type="submit"
          className="flex-1 w-full sm:w-auto"
          disabled={!stripe || loading || !cardComplete}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              در حال پردازش...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 ml-2" />
              پرداخت امن
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
    </form>
  );
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  const options: StripeElementsOptions = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: 'hsl(var(--primary))',
        colorBackground: 'hsl(var(--background))',
        colorText: 'hsl(var(--foreground))',
        colorDanger: 'hsl(var(--destructive))',
        fontFamily: 'var(--font-vazir), system-ui, sans-serif',
        borderRadius: '0.5rem',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
