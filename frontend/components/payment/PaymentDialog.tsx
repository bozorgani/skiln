'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StripeCheckout from './StripeCheckout';
import ZarinpalCheckout from './ZarinpalCheckout';
import PayirCheckout from './PayirCheckout';
import IDPayCheckout from './IDPayCheckout';
import TestPaymentCheckout from './TestPaymentCheckout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Wallet, X, Building2, Banknote, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSecret?: string;
  paymentId: string;
  orderId?: string;
  courseId: string;
  amount: number;
  zarinpalUrl?: string;
  payirUrl?: string;
  idpayUrl?: string;
  testPaymentUrl?: string;
  onSuccess: (result?: any) => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  clientSecret,
  paymentId,
  orderId,
  courseId,
  amount,
  zarinpalUrl,
  payirUrl,
  idpayUrl,
  testPaymentUrl,
  onSuccess
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'zarinpal' | 'payir' | 'idpay' | 'test'>(
    testPaymentUrl ? 'test' : zarinpalUrl ? 'zarinpal' : payirUrl ? 'payir' : idpayUrl ? 'idpay' : 'stripe'
  );

  const handleSuccess = (result?: any) => {
    onSuccess(result);
    onOpenChange(false);
  };

  const hasStripe = !!clientSecret;
  const hasZarinpal = !!zarinpalUrl;
  const hasPayir = !!payirUrl;
  const hasIdpay = !!idpayUrl;
  const hasTest = !!testPaymentUrl;
  
  // لیست روش‌های پرداخت موجود
  const paymentMethods = [
    { id: 'stripe', name: 'کارت بانکی', icon: CreditCard, available: hasStripe },
    { id: 'zarinpal', name: 'زرین‌پال', icon: Wallet, available: hasZarinpal },
    { id: 'payir', name: 'پی‌ایر', icon: Building2, available: hasPayir },
    { id: 'idpay', name: 'آیدی پی', icon: Banknote, available: hasIdpay },
    { id: 'test', name: 'پرداخت تست', icon: AlertCircle, available: hasTest },
  ].filter(method => method.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 md:p-6 pb-0 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg sm:text-xl md:text-2xl">
                پرداخت دوره
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                لطفاً روش پرداخت خود را انتخاب کنید
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 md:p-6">
          {/* Amount Display */}
          <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base text-muted-foreground">مبلغ قابل پرداخت:</span>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                {amount.toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>

          {/* Payment Methods Tabs */}
          <Tabs 
            value={paymentMethod} 
            onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'zarinpal' | 'payir' | 'idpay' | 'test')} 
            className="mt-4"
          >
            <TabsList className={`grid w-full h-auto gap-2 ${paymentMethods.length === 2 ? 'grid-cols-2' : paymentMethods.length === 3 ? 'grid-cols-3' : paymentMethods.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <TabsTrigger 
                    key={method.id}
                    value={method.id} 
                    className="text-xs sm:text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">{method.name}</span>
                    <span className="sm:hidden">{method.name.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="stripe" className="mt-4">
              {hasStripe ? (
                <StripeCheckout
                  clientSecret={clientSecret!}
                  paymentId={paymentId}
                  courseId={courseId}
                  amount={amount}
                  onSuccess={handleSuccess}
                  onCancel={() => onOpenChange(false)}
                />
              ) : (
                <div className="p-6 text-center border rounded-lg bg-muted">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    پرداخت با کارت بانکی در حال حاضر در دسترس نیست
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="zarinpal" className="mt-4">
              {hasZarinpal ? (
                <ZarinpalCheckout
                  zarinpalUrl={zarinpalUrl!}
                  paymentId={paymentId}
                  courseId={courseId}
                  amount={amount}
                  onSuccess={handleSuccess}
                  onCancel={() => onOpenChange(false)}
                />
              ) : (
                <div className="p-6 text-center border rounded-lg bg-muted">
                  <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    پرداخت با زرین‌پال در حال حاضر در دسترس نیست
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payir" className="mt-4">
              {hasPayir ? (
                <PayirCheckout
                  payirUrl={payirUrl!}
                  paymentId={paymentId}
                  courseId={courseId}
                  amount={amount}
                  onSuccess={handleSuccess}
                  onCancel={() => onOpenChange(false)}
                />
              ) : (
                <div className="p-6 text-center border rounded-lg bg-muted">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    پرداخت با پی‌ایر در حال حاضر در دسترس نیست
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="idpay" className="mt-4">
              {hasIdpay ? (
                <IDPayCheckout
                  idpayUrl={idpayUrl!}
                  paymentId={paymentId}
                  courseId={courseId}
                  amount={amount}
                  onSuccess={handleSuccess}
                  onCancel={() => onOpenChange(false)}
                />
              ) : (
                <div className="p-6 text-center border rounded-lg bg-muted">
                  <Banknote className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    پرداخت با آیدی پی در حال حاضر در دسترس نیست
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="test" className="mt-4">
              {hasTest ? (
                <TestPaymentCheckout
                  testPaymentUrl={testPaymentUrl!}
                  paymentId={paymentId}
                  orderId={orderId || paymentId}
                  courseId={courseId}
                  amount={amount}
                  onSuccess={handleSuccess}
                  onCancel={() => onOpenChange(false)}
                />
              ) : (
                <div className="p-6 text-center border rounded-lg bg-muted">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    پرداخت تست در حال حاضر در دسترس نیست
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              🔒 تمامی پرداخت‌ها به صورت امن و رمزگذاری شده انجام می‌شود
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
