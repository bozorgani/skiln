'use client';

import { useEffect, useState } from 'react';
import { categoriesAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tag, Plus, Trash2, Loader2 } from 'lucide-react';

const emptyForm = {
  name: '',
  slug: '',
  type: 'course',
  description: '',
  icon: '',
  color: 'from-primary to-indigo-600',
  order: 0,
  isActive: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll({ includeInactive: true });
      setCategories(response.data?.data?.categories || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await categoriesAPI.create(form);
      setForm(emptyForm);
      await loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'خطا در ذخیره دسته‌بندی');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category: any) => {
    await categoriesAPI.update(category._id, { isActive: !category.isActive });
    await loadCategories();
  };

  const removeCategory = async (category: any) => {
    if (!confirm(`دسته‌بندی «${category.name}» حذف شود؟`)) return;
    await categoriesAPI.delete(category._id);
    await loadCategories();
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gradient mb-2">مدیریت دسته‌بندی‌ها</h1>
        <p className="text-muted-foreground">دسته‌بندی‌های دوره و بلاگ را مدیریت کنید</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> دسته‌بندی جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>نام</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="اختیاری" />
              </div>
              <div className="space-y-2">
                <Label>نوع</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="course">دوره</option>
                  <option value="blog">بلاگ</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>آیکن</Label>
                  <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>ترتیب</Label>
                  <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                ذخیره
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>لیست دسته‌بندی‌ها</CardTitle>
            <CardDescription>{categories.length} دسته‌بندی</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">دسته‌بندی ثبت نشده است</div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category._id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><Tag className="h-5 w-5 text-primary" /></div>
                      <div>
                        <div className="font-bold">{category.name}</div>
                        <div className="text-sm text-muted-foreground">{category.type === 'course' ? 'دوره' : 'بلاگ'} • {category.slug}</div>
                        {category.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(category)}>
                        {category.isActive ? 'فعال' : 'غیرفعال'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeCategory(category)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
