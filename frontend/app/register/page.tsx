'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Phone, Shield, UserPlus, BookOpen, Sparkles, User, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^09\d{9}$/, 'شماره موبایل باید به فرمت 09xxxxxxxxx باشد'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  code: z.string().length(4, 'کد تایید باید ۴ رقم باشد'),
});

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const redirectUrl = searchParams.get('redirect') || '/';
  const phoneFromQuery = searchParams.get('phone');
  const [step, setStep] = useState<'phone' | 'register'>(phoneFromQuery ? 'register' : 'phone');
  const [phoneNumber, setPhoneNumber] = useState(phoneFromQuery || '');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const codeSentRef = useRef(false);

  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    formState: { errors: phoneErrors },
  } = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: phoneFromQuery || '',
    },
  });

  const {
    register: registerForm,
    handleSubmit: handleSubmitForm,
    formState: { errors: formErrors },
    reset: resetForm,
    getValues: getFormValues,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      code: '',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // If phone number is provided in query, automatically send code
  useEffect(() => {
    if (phoneFromQuery && phoneFromQuery.match(/^09\d{9}$/) && !codeSentRef.current) {
      codeSentRef.current = true;
      // Auto-send code if phone is provided
      authAPI.sendCode(phoneFromQuery)
        .then(() => {
          setTimeLeft(120);
          toast({
            title: 'موفق',
            description: 'کد تایید ارسال شد. کد: 1234',
            variant: 'success',
          });
        })
        .catch((error: any) => {
          codeSentRef.current = false; // Reset on error so user can retry
          toast({
            title: 'خطا',
            description: error.response?.data?.message || 'ارسال کد تایید ناموفق بود',
            variant: 'destructive',
          });
        });
    }
  }, [phoneFromQuery, toast]);

  useEffect(() => {
    if (!mounted) return;
    
    if (timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft, mounted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onSendCode = async (data: z.infer<typeof phoneSchema>) => {
    setSendingCode(true);
    try {
      await authAPI.sendCode(data.phoneNumber);
      setPhoneNumber(data.phoneNumber);
      resetForm();
      setTimeLeft(120);
      setStep('register');
      toast({
        title: 'موفق',
        description: 'کد تایید ارسال شد. کد: 1234',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.message || 'ارسال کد تایید ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setSendingCode(false);
    }
  };

  const onResendCode = async () => {
    if (sendingCode) return;
    
    setSendingCode(true);
    try {
      await authAPI.sendCode(phoneNumber);
      setTimeLeft(120);
      const currentName = getFormValues('name');
      resetForm({ 
        name: currentName || '', 
        code: '' 
      });
      toast({
        title: 'موفق',
        description: 'کد تایید مجدداً ارسال شد. کد: 1234',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.message || 'ارسال مجدد کد تایید ناموفق بود',
        variant: 'destructive',
      });
    } finally {
      setSendingCode(false);
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    setLoading(true);
    try {
      const response = await authAPI.verifyCode(phoneNumber, data.code, data.name);
      
      toast({
        title: 'موفق',
        description: 'حساب کاربری با موفقیت ایجاد شد',
        variant: 'success',
      });
      
      checkAuth().catch(() => {});
      
      window.location.href = redirectUrl;
    } catch (error: any) {
      setLoading(false);
      
      // اگر کاربر قبلاً ثبت نام کرده باشد، به صفحه ورود هدایت کن
      if (error.response?.data?.code === 'USER_ALREADY_EXISTS') {
        toast({
          title: 'خطا',
          description: 'این شماره موبایل قبلاً ثبت شده است. لطفاً از صفحه ورود استفاده کنید.',
          variant: 'destructive',
        });
        setTimeout(() => {
          router.push(`/login?phone=${phoneNumber}`);
        }, 1500);
      } else if (error.response?.data?.code === 'ADMIN_PHONE_REGISTRATION_NOT_ALLOWED') {
        toast({
          title: 'خطا',
          description: 'این شماره برای پنل مدیریت است. لطفاً از پنل مدیریت استفاده کنید.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'خطا',
          description: error.response?.data?.message || 'ثبت نام ناموفق بود',
          variant: 'destructive',
        });
      }
    }
  };

  const handleBackToPhone = () => {
    resetForm();
    setTimeLeft(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setStep('phone');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <main className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 shadow-lg shadow-primary/30 mb-6 transform hover:scale-110 transition-transform duration-300">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              {step === 'phone' ? 'شروع سفر یادگیری' : 'تکمیل اطلاعات'}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
              {step === 'phone' 
                ? 'امروز ثبت نام کنید و به هزاران دوره دسترسی پیدا کنید'
                : 'اطلاعات خود را تکمیل کنید و حساب کاربری خود را ایجاد کنید'
              }
            </p>
          </div>

          {/* Main Card */}
          <Card className="border-0 shadow-2xl shadow-primary/10 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 backdrop-saturate-150 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Gradient Top Border */}
            <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>
            
            {step === 'phone' ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CardHeader className="space-y-3 pb-6 pt-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl md:text-3xl font-bold">ایجاد حساب کاربری جدید</CardTitle>
                      <CardDescription className="text-base mt-1">
                        شماره موبایل خود را وارد کنید
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 pb-8">
                  <form onSubmit={handleSubmitPhone(onSendCode as any)} className="space-y-6">
                    <div className="space-y-3">
                      <label htmlFor="phoneNumber" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Phone className="h-4 w-4 text-primary" />
                        شماره موبایل
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
                          <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="09123456789"
                            className="pr-12 h-14 text-base dir-ltr text-left border-2 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            maxLength={11}
                            {...registerPhone('phoneNumber')}
                          />
                        </div>
                      </div>
                      {phoneErrors.phoneNumber && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                          <span className="text-destructive text-sm">•</span>
                          <p className="text-sm text-destructive">{String(phoneErrors.phoneNumber?.message || '')}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        شماره موبایل باید با 09 شروع شود و 11 رقم باشد
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]" 
                      disabled={sendingCode}
                    >
                      {sendingCode ? (
                        <span className="flex items-center gap-2">
                          <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          در حال ارسال...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          ارسال کد تایید
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <CardHeader className="space-y-3 pb-6 pt-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl md:text-3xl font-bold">تکمیل اطلاعات</CardTitle>
                      <CardDescription className="text-base mt-1">
                        نام خود را وارد کرده و کد تایید را وارد کنید
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 pb-8">
                  <form onSubmit={handleSubmitForm(onRegister)} className="space-y-6">
                    <div className="space-y-3">
                      <label htmlFor="name" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <User className="h-4 w-4 text-primary" />
                        نام کامل
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="نام و نام خانوادگی خود را وارد کنید"
                            className="pr-12 h-14 text-base border-2 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            {...registerForm('name')}
                          />
                        </div>
                      </div>
                      {formErrors.name && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                          <span className="text-destructive text-sm">•</span>
                          <p className="text-sm text-destructive">{String(formErrors.name?.message || '')}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="code" className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Shield className="h-4 w-4 text-primary" />
                        کد تایید
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <Shield className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
                          <Input
                            id="code"
                            type="text"
                            placeholder="1234"
                            className="pr-12 h-16 text-2xl dir-ltr text-center tracking-[0.5em] font-bold border-2 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm"
                            maxLength={4}
                            {...registerForm('code')}
                          />
                        </div>
                      </div>
                      {formErrors.code && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                          <span className="text-destructive text-sm">•</span>
                          <p className="text-sm text-destructive">{formErrors.code.message}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <p className="text-xs text-muted-foreground">
                            کد تایید: <span className="font-mono font-bold text-primary text-sm">1234</span>
                          </p>
                        </div>
                        {mounted && timeLeft > 0 ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                            <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                            <p className="text-xs font-semibold text-primary">
                              {formatTime(timeLeft)}
                            </p>
                          </div>
                        ) : mounted && timeLeft === 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onResendCode}
                            disabled={sendingCode}
                            className="h-auto px-3 py-1.5 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 transition-all duration-200"
                          >
                            {sendingCode ? (
                              <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                در حال ارسال...
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <RotateCcw className="h-3 w-3" />
                                ارسال مجدد
                              </span>
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]" 
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          در حال ایجاد حساب...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          ایجاد حساب کاربری
                        </span>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-11 text-sm hover:bg-muted/80 transition-all duration-200"
                      onClick={handleBackToPhone}
                    >
                      تغییر شماره موبایل
                    </Button>
                  </form>
                </CardContent>
              </div>
            )}

            <CardFooter className="flex flex-col gap-4 pt-6 pb-8 border-t border-border/50 bg-muted/30">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>قبلاً حساب کاربری دارید؟</span>
              </div>
              <Link href="/login" className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-base font-semibold border-2 hover:bg-gradient-to-r hover:from-primary hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  ورود به حساب کاربری
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <p className="text-xs text-muted-foreground">
              با ثبت نام، شما با{' '}
              <Link href="/terms" className="text-primary hover:underline font-medium transition-colors">
                شرایط استفاده
              </Link>
              {' '}و{' '}
              <Link href="/privacy" className="text-primary hover:underline font-medium transition-colors">
                حریم خصوصی
              </Link>
              {' '}ما موافقت می‌کنید
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        در حال بارگذاری...
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
