'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ticketsAPI } from '@/lib/api';
import { MessageSquare } from 'lucide-react';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getAll({ limit: 100 });
      const ticketsData = response.data?.data?.tickets || response.data?.data?.data?.tickets || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      const errorMessage = error.response?.data?.message || 'خطا در بارگذاری تیکت‌ها';
      alert(errorMessage); // In production, use toast notification
      setTickets([]);
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
            <MessageSquare className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">در حال بارگذاری تیکت‌ها...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">تیکت‌های پشتیبانی</h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          مدیریت تیکت‌های کاربران
        </p>
      </div>

      <Card className="animate-slide-up delay-200">
        <CardHeader>
          <CardTitle>لیست تیکت‌ها</CardTitle>
          <CardDescription>
            تعداد کل تیکت‌ها: {tickets.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">تیکتی یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {tickets.map((ticket, index) => (
                <Card 
                  key={ticket.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{ticket.subject || 'بدون موضوع'}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2 text-sm">
                          {ticket.description || 'بدون توضیحات'}
                        </CardDescription>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0 ${
                        ticket.status === 'open' 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                        ticket.status === 'in-progress' 
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' :
                        ticket.status === 'resolved' 
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                        'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                      }`}>
                        {ticket.status === 'open' ? 'باز' :
                         ticket.status === 'in-progress' ? 'در حال بررسی' :
                         ticket.status === 'resolved' ? 'حل شده' : 'بسته'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-border/50">
                      <div className="text-sm text-muted-foreground">
                        از: {ticket.user?.name || 'نامشخص'}
                      </div>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <MessageSquare className="h-4 w-4 ml-2" />
                        مشاهده
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

