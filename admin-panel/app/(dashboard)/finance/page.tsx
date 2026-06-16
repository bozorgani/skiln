'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { paymentsAPI } from '@/lib/api';
import { DollarSign, TrendingUp } from 'lucide-react';

export default function FinancePage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, transactionsRes] = await Promise.all([
        paymentsAPI.getAll({ limit: 50 }).catch(err => {
          console.error('Error loading payments:', err);
          return { data: { data: { payments: [] } } };
        }),
        paymentsAPI.getTransactions({ limit: 50 }).catch(err => {
          console.error('Error loading transactions:', err);
          return { data: { data: { transactions: [] } } };
        })
      ]);
      
      const paymentsData = paymentsRes.data?.data?.payments || paymentsRes.data?.data?.data?.payments || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      
      // Calculate stats from transactions
      const transactions = transactionsRes.data?.data?.transactions || transactionsRes.data?.data?.data?.transactions || [];
      const validTransactions = Array.isArray(transactions) ? transactions : [];
      const totalRevenue = validTransactions
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      setStats({ totalRevenue, totalTransactions: validTransactions.length });
    } catch (error: any) {
      console.error('Error loading finance data:', error);
      const errorMessage = error.response?.data?.message || 'خطا در بارگذاری اطلاعات مالی';
      alert(errorMessage); // In production, use toast notification
      setPayments([]);
      setStats({ totalRevenue: 0, totalTransactions: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <DollarSign className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">در حال بارگذاری اطلاعات مالی...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">مدیریت مالی</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          مدیریت پرداخت‌ها و تراکنش‌ها
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-slide-up">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">درآمد کل</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">${(stats?.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-green-500/10 flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up delay-75">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">تراکنش‌ها</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{stats?.totalTransactions || 0}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10 flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-slide-up delay-200">
        <CardHeader>
          <CardTitle>پرداخت‌های اخیر</CardTitle>
          <CardDescription>لیست آخرین پرداخت‌ها</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">پرداختی یافت نشد</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {payments.map((payment, index) => (
                  <Card 
                    key={payment.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{payment.user?.name || 'نامشخص'}</h3>
                          <p className="text-sm text-muted-foreground mt-1">${(payment.amount || 0).toLocaleString()}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                          payment.status === 'completed' 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                          payment.status === 'pending' 
                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' :
                          'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {payment.status === 'completed' ? 'تکمیل شده' :
                           payment.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/30">
                        <span>{payment.paymentMethod || 'نامشخص'}</span>
                        <span>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('fa-IR') : '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border/50 bg-accent/30">
                      <th className="text-right p-4 font-semibold text-sm">کاربر</th>
                      <th className="text-right p-4 font-semibold text-sm">مبلغ</th>
                      <th className="text-right p-4 font-semibold text-sm">روش پرداخت</th>
                      <th className="text-right p-4 font-semibold text-sm">وضعیت</th>
                      <th className="text-right p-4 font-semibold text-sm">تاریخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr 
                        key={payment.id} 
                        className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-200"
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td className="p-4 text-sm">{payment.user?.name || 'نامشخص'}</td>
                        <td className="p-4 text-sm font-semibold">${(payment.amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-sm text-muted-foreground">{payment.paymentMethod || 'نامشخص'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'completed' 
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                            payment.status === 'pending' 
                              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}>
                            {payment.status === 'completed' ? 'تکمیل شده' :
                             payment.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('fa-IR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

