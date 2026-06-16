'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Shield, Phone, KeyRound, User, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type Step = 'phone' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkAuth, setUser } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setError('شما دسترسی به پنل مدیریت ندارید');
    }
  }, [searchParams]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingCode(true);
    setError('');
    setSuccess(false);

    try {
      const response = await authAPI.sendCode(phoneNumber);
      
      if (response.data.success) {
        setStep('code');
        setCountdown(120);
        setError('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        if (response.data.data?.code) {
          setDevCode(response.data.data.code);
          console.log(`[DEV] Verification code for ${phoneNumber}: ${response.data.data.code}`);
        }
      } else {
        setError(response.data.message || 'خطا در ارسال کد تایید');
      }
    } catch (err: any) {
      console.error('Send code error:', err);
      
      let errorMessage = 'خطا در ارسال کد تایید';
      
      if (err.response?.data?.code === 'PHONE_NOT_IN_ADMIN_LIST') {
        errorMessage = 'شماره شما در لیست شماره‌های مجاز برای پنل مدیریت نیست. لطفاً با مدیر سیستم تماس بگیرید.';
      } else if (err.response?.status === 403) {
        errorMessage = 'شماره شما در لیست شماره‌های مجاز برای پنل مدیریت نیست. لطفاً با مدیر سیستم تماس بگیرید.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyCode(phoneNumber, code, name);
      
      if (!response.data.success || !response.data.data?.token) {
        throw new Error(response.data.message || 'پاسخ نامعتبر از سرور دریافت شد');
      }

      const token = response.data.data.token;
      const userData = response.data.data.user;

      console.log('[Login] Verify-code successful!');

      const tokenManager = await import('@/lib/token-manager');
      tokenManager.setToken(token);
      
      const storedToken = tokenManager.getToken();
      if (!storedToken) {
        console.error('[Login] ❌ CRITICAL: Token not stored!');
        setError('خطا در ذخیره اطلاعات ورود. لطفاً تنظیمات مرورگر را بررسی کنید.');
        setLoading(false);
        return;
      }
      
      if (!userData || userData.role !== 'admin') {
        tokenManager.removeToken();
        setError('شماره شما در لیست شماره‌های مجاز برای پنل مدیریت نیست. لطفاً با مدیر سیستم تماس بگیرید.');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      setUser(userData);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLoading(false);

      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Verify code error:', err);
      
      let errorMessage = 'کد تایید نامعتبر است';
      let isExpiredError = false;
      
      if (err.response?.data?.code === 'PHONE_NOT_IN_ADMIN_LIST') {
        errorMessage = 'شماره شما در لیست شماره‌های مجاز برای پنل مدیریت نیست. لطفاً با مدیر سیستم تماس بگیرید.';
      } else if (err.response?.status === 403) {
        errorMessage = 'شماره شما در لیست شماره‌های مجاز برای پنل مدیریت نیست. لطفاً با مدیر سیستم تماس بگیرید.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        // بررسی اگر کد منقضی شده است
        const message = err.response.data.message.toLowerCase();
        if (message.includes('expired') || message.includes('منقضی') || message.includes('not found') || message.includes('یافت نشد')) {
          isExpiredError = true;
        }
      } else if (err.message) {
        errorMessage = err.message;
        const message = err.message.toLowerCase();
        if (message.includes('expired') || message.includes('منقضی') || message.includes('not found') || message.includes('یافت نشد')) {
          isExpiredError = true;
        }
      }
      
      // اگر کد منقضی شده، تایمر را ریست کن تا کاربر بتواند کد مجدد ارسال کند
      if (isExpiredError) {
        setCountdown(0);
        setCode(''); // کد قبلی را پاک کن
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setSendingCode(true);
    setError('');

    try {
      const response = await authAPI.sendCode(phoneNumber);
      
      if (response.data.success) {
        setCountdown(120);
        setError('');
        setCode('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        
        if (response.data.data?.code) {
          setDevCode(response.data.data.code);
          console.log(`[DEV] New verification code for ${phoneNumber}: ${response.data.data.code}`);
        }
      } else {
        setError(response.data.message || 'خطا در ارسال مجدد کد');
      }
    } catch (err: any) {
      console.error('Resend code error:', err);
      setError(err.response?.data?.message || 'خطا در ارسال مجدد کد');
    } finally {
      setSendingCode(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setCode('');
    setError('');
    setDevCode('');
    setCountdown(0);
    setSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{
        backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                          linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>
      
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-pulse-slow">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background flex items-center justify-center">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">پنل مدیریت</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">LMS Bozorgani</p>
          </div>
        </div>

        <Card className="backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
          {/* Progress Indicator */}
          <div className="h-1 bg-muted relative overflow-hidden">
            <div 
              className={`h-full bg-gradient-primary transition-all duration-500 ${
                step === 'code' ? 'w-full' : 'w-1/2'
              }`}
            ></div>
          </div>

          <CardHeader className="px-6 pt-8 pb-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {step === 'phone' ? (
                <Phone className="h-6 w-6 text-primary" />
              ) : (
                <KeyRound className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gradient">
              {step === 'phone' ? 'ورود به پنل' : 'تایید کد'}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {step === 'phone' 
                ? 'شماره موبایل خود را وارد کنید تا کد تایید برای شما ارسال شود'
                : `کد تایید ارسال شده به ${phoneNumber} را وارد کنید`}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 animate-slide-up">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">کد تایید با موفقیت ارسال شد</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-slide-up">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Development Code */}
            {devCode && step === 'code' && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-slide-up">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  [Development Mode]
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-600 dark:text-blue-400">کد تایید:</p>
                  <span className="font-mono font-bold text-2xl bg-blue-500/20 px-4 py-2 rounded-lg text-blue-600 dark:text-blue-400">
                    {devCode}
                  </span>
                </div>
              </div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-semibold">
                    <Phone className="h-4 w-4 text-primary" />
                    شماره موبایل
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="09123456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                    required
                    disabled={sendingCode}
                    dir="ltr"
                    className="text-left text-lg h-14"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>فرمت:</span>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">09xxxxxxxxx</code>
                  </p>
                </div>

                {/* Helper Text */}
                {phoneNumber.length === 11 && !sendingCode && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 animate-slide-up">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-primary font-medium">شماره موبایل معتبر است. روی دکمه زیر کلیک کنید</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-16 text-lg font-bold shadow-2xl shadow-primary/40 hover:shadow-primary/50 hover:shadow-2xl group relative overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-purple-700 hover:from-primary/95 hover:via-purple-600/95 hover:to-purple-700/95 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 border-0 ring-2 ring-primary/20 hover:ring-primary/30" 
                  disabled={sendingCode || phoneNumber.length !== 11}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-3 text-white font-bold">
                    {sendingCode ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                        <span className="text-white">در حال ارسال...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white drop-shadow-sm">ارسال کد تایید</span>
                        <div className="flex items-center gap-1">
                          <ArrowRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform drop-shadow-sm" />
                        </div>
                      </>
                    )}
                  </span>
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                {/* Code Input */}
                <div className="space-y-3">
                  <Label htmlFor="code" className="flex items-center gap-2 text-sm font-semibold">
                    <KeyRound className="h-4 w-4 text-primary" />
                    کد تایید
                  </Label>
                  <div className="relative">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-row-reverse">
                      {[0, 1, 2, 3].map((i) => {
                        // With flex-row-reverse, boxes are displayed in reverse order visually
                        // Visually: [box3][box2][box1][box0] (right to left)
                        // But we want to fill from right to left
                        // So visually rightmost box (which is index 0) should be filled first
                        // Then visually second from right (index 1), etc.
                        return (
                          <div
                            key={i}
                            className={`relative flex-1 max-w-[60px] sm:max-w-[70px] transition-all duration-300 ${
                              code[i] ? 'scale-105' : ''
                            }`}
                          >
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={code[i] || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                                if (value) {
                                  const newCode = code.split('');
                                  // Always fill current box if it's empty, or find next empty from right to left
                                  if (!newCode[i]) {
                                    // Current box is empty, fill it
                                    newCode[i] = value;
                                  } else {
                                    // Current box is filled, find next empty box from right (lower index) to left (higher index)
                                    for (let j = 0; j < 4; j++) {
                                      if (!newCode[j]) {
                                        newCode[j] = value;
                                        break;
                                      }
                                    }
                                  }
                                  setCode(newCode.slice(0, 4).join(''));
                                  
                                  // Find next empty box from right to left (index 0 to 3)
                                  for (let j = 0; j < 4; j++) {
                                    if (!newCode[j]) {
                                      setTimeout(() => {
                                        const nextInput = document.getElementById(`code-${j}`);
                                        nextInput?.focus();
                                      }, 10);
                                      return;
                                    }
                                  }
                                } else {
                                  // Delete current and focus previous box (to the right visually, which is lower index)
                                  const newCode = code.split('');
                                  newCode[i] = '';
                                  setCode(newCode.join(''));
                                  if (i > 0) {
                                    setTimeout(() => {
                                      const prevInput = document.getElementById(`code-${i - 1}`);
                                      prevInput?.focus();
                                    }, 10);
                                  }
                                }
                              }}
                              onFocus={(e) => {
                                // When focusing an empty box, clear all boxes to the left (higher indices)
                                if (!code[i]) {
                                  const newCode = code.split('');
                                  for (let j = i; j < 4; j++) {
                                    newCode[j] = '';
                                  }
                                  setCode(newCode.join(''));
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !code[i]) {
                                  if (i > 0) {
                                    // Go to previous input (visually to the right)
                                    e.preventDefault();
                                    setTimeout(() => {
                                      const prevInput = document.getElementById(`code-${i - 1}`);
                                      prevInput?.focus();
                                    }, 0);
                                  }
                                }
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                                if (pastedData.length === 4) {
                                  setCode(pastedData);
                                  // Focus rightmost box (index 0)
                                  setTimeout(() => {
                                    document.getElementById(`code-0`)?.focus();
                                  }, 0);
                                }
                              }}
                              disabled={loading}
                              dir="ltr"
                              id={`code-${i}`}
                              className={`text-center text-2xl sm:text-3xl font-bold h-12 sm:h-14 w-full rounded-lg border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                                code[i]
                                  ? 'border-primary bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary shadow-primary/20'
                                  : 'border-border/50 bg-background text-muted-foreground hover:border-primary/30'
                              } focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-primary/20`}
                              autoFocus={i === 0 && !code}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Hidden input for form submission */}
                    <input
                      type="hidden"
                      name="code"
                      value={code}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    کد ۴ رقمی به شماره <strong>{phoneNumber}</strong> ارسال شد
                  </p>
                </div>

                {/* Name Input (Optional) */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-primary" />
                    نام
                    <span className="text-xs font-normal text-muted-foreground">(اختیاری)</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="نام و نام خانوادگی"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    در صورت اولین ورود، نام خود را وارد کنید
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    بازگشت
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-14 text-base font-bold shadow-2xl shadow-primary/40 hover:shadow-primary/50 hover:shadow-2xl group relative overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-purple-700 hover:from-primary/95 hover:via-purple-600/95 hover:to-purple-700/95 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-0 ring-2 ring-primary/20 hover:ring-primary/30"
                    disabled={loading || code.length !== 4}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2 text-white font-bold">
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                          <span className="text-white">در حال تایید...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-white drop-shadow-sm">تایید و ورود</span>
                          <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform drop-shadow-sm" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>

                {/* Resend Code */}
                <div className="pt-4 border-t border-border/50">
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={countdown > 0 || sendingCode || loading}
                      className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                      {countdown > 0 ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          ارسال مجدد کد ({Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')})
                        </>
                      ) : (
                        <>
                          ارسال مجدد کد
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LMS Bozorgani. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </div>
  );
}
