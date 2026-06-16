'use client';

import { useEffect, useState } from 'react';
import { contactMessagesAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Loader2, Trash2 } from 'lucide-react';

const statusLabels: Record<string, string> = {
  new: 'جدید',
  read: 'خوانده شده',
  replied: 'پاسخ داده شده',
  closed: 'بسته شده',
};

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [reply, setReply] = useState('');

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await contactMessagesAPI.getAll({ limit: 100 });
      setMessages(response.data?.data?.messages || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const openMessage = async (message: any) => {
    const response = await contactMessagesAPI.getById(message._id);
    const data = response.data?.data?.message;
    setSelected(data);
    setReply(data?.reply || '');
    await loadMessages();
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    const response = await contactMessagesAPI.update(selected._id, { status, reply: reply || undefined });
    setSelected(response.data?.data?.message);
    await loadMessages();
  };

  const deleteMessage = async (message: any) => {
    if (!confirm('این پیام حذف شود؟')) return;
    await contactMessagesAPI.delete(message._id);
    if (selected?._id === message._id) setSelected(null);
    await loadMessages();
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gradient mb-2">پیام‌های تماس</h1>
        <p className="text-muted-foreground">مدیریت پیام‌های ارسال شده از فرم تماس</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>پیام‌ها</CardTitle>
            <CardDescription>{messages.length} پیام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
            {messages.length === 0 ? <div className="text-center py-8 text-muted-foreground">پیامی وجود ندارد</div> : messages.map((message) => (
              <button key={message._id} onClick={() => openMessage(message)} className={`w-full text-right p-3 rounded-xl border hover:border-primary transition-colors ${selected?._id === message._id ? 'border-primary bg-primary/5' : ''}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold line-clamp-1">{message.subject}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${message.status === 'new' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted'}`}>{statusLabels[message.status] || message.status}</span>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-1">{message.name} • {message.email}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> جزئیات پیام</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-center py-16 text-muted-foreground">یک پیام را انتخاب کنید</div>
            ) : (
              <div className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">نام: </span><b>{selected.name}</b></div>
                  <div><span className="text-muted-foreground">ایمیل: </span><b>{selected.email}</b></div>
                  <div><span className="text-muted-foreground">تلفن: </span><b>{selected.phone || '-'}</b></div>
                  <div><span className="text-muted-foreground">وضعیت: </span><b>{statusLabels[selected.status] || selected.status}</b></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{selected.subject}</h3>
                  <p className="p-4 rounded-xl bg-muted/50 leading-7 whitespace-pre-line">{selected.message}</p>
                </div>
                <div className="space-y-2">
                  <label className="font-bold">پاسخ داخلی/ادمین</label>
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} placeholder="متن پاسخ یا یادداشت..." />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => updateStatus('read')} variant="outline">خوانده شد</Button>
                  <Button onClick={() => updateStatus('replied')}>ثبت پاسخ</Button>
                  <Button onClick={() => updateStatus('closed')} variant="outline">بستن</Button>
                  <Button onClick={() => deleteMessage(selected)} variant="ghost"><Trash2 className="h-4 w-4 ml-2 text-destructive" /> حذف</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
