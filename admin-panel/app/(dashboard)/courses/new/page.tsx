'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api, { coursesAPI, categoriesAPI } from '@/lib/api';
import { 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  Plus, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  GripVertical,
  FileText,
  Play,
  Clock,
  BookOpen,
  X,
  Save,
  Edit2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [uploadingLesson, setUploadingLesson] = useState<{ sectionIndex: number; lessonIndex: number } | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]); // برای نمایش پیش‌نمایش موقت
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    thumbnail: '', // فقط URL سرور
    price: '',
    discountPercent: '',
    category: 'General',
    level: 'Beginner',
    duration: '',
    status: 'draft' as 'draft' | 'published',
    sections: [] as Array<{
      title: string;
      isFree?: boolean;
      lessons: Array<{
        title: string;
        description?: string;
        duration?: number;
        content?: string;
        isFree?: boolean;
      }>;
    }>,
  });

  useEffect(() => {
    categoriesAPI.getAll({ type: 'course', includeInactive: true })
      .then((response) => setCategories(response.data?.data?.categories || []))
      .catch(() => setCategories([]));
  }, []);

  // پاکسازی data URI های قدیمی هر زمان که thumbnail تغییر می‌کند
  useEffect(() => {
    // اگر thumbnail با data URI شروع می‌شود، آن را پاک کن (فقط URL سرور مجاز است)
    if (formData.thumbnail && formData.thumbnail.startsWith('data:')) {
      setFormData(prev => ({ ...prev, thumbnail: '' }));
      setThumbnailPreview('');
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'تصویر باید روی سرور آپلود شود. لطفاً دوباره آپلود کنید.',
      });
    }
  }, [formData.thumbnail]); // هر زمان که thumbnail تغییر کند بررسی می‌شود

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  // Format helpers
  const formatPrice = (value: string) => {
    const numeric = value.replace(/,/g, '');
    if (!numeric) return '';
    const numberValue = Number(numeric);
    if (Number.isNaN(numberValue)) return '';
    return numberValue.toLocaleString('fa-IR');
  };

  const parsePriceToNumber = (value: string) => {
    if (!value || !value.trim()) return 0;
    
    // تبدیل ارقام فارسی به انگلیسی
    const persianToEnglish: { [key: string]: string } = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    
    let cleaned = value;
    // تبدیل ارقام فارسی به انگلیسی
    Object.keys(persianToEnglish).forEach(persian => {
      cleaned = cleaned.replace(new RegExp(persian, 'g'), persianToEnglish[persian]);
    });
    
    // حذف همه کاراکترهای غیر عددی (شامل کاما، فاصله، و ...)
    const numeric = cleaned.replace(/[^\d]/g, '');
    
    if (!numeric) return 0;
    
    const numberValue = parseInt(numeric, 10);
    return Number.isNaN(numberValue) ? 0 : numberValue;
  };

  // Upload image to server
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingThumbnail(true);

      // ایجاد پیش‌نمایش موقت (فقط برای UI)
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && result.startsWith('data:image')) {
          setThumbnailPreview(result);
        }
      };
      reader.readAsDataURL(file);

      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post('/uploads/images', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = response.data?.data?.url as string | undefined;
      if (!url) {
        throw new Error('آدرس تصویر از سرور دریافت نشد');
      }

      // فقط URL سرور را ذخیره می‌کنیم (نه data URI)
      setFormData(prev => ({ ...prev, thumbnail: url }));
      // پاک کردن preview موقت بعد از آپلود موفق
      setThumbnailPreview('');
      
      toast({
        variant: 'success',
        title: 'تصویر آپلود شد',
        description: 'تصویر با موفقیت روی سرور ذخیره شد',
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        variant: 'destructive',
        title: 'خطا در آپلود تصویر',
        description: error.response?.data?.message || error.message || 'لطفاً دوباره تلاش کنید',
      });
      setFormData(prev => ({ ...prev, thumbnail: '' }));
      setThumbnailPreview(''); // پاک کردن preview در صورت خطا
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file' && name === 'thumbnail') {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            toast({
              variant: 'destructive',
              title: 'خطا',
              description: 'حجم فایل تصویر نباید بیشتر از 10 مگابایت باشد',
            });
            return;
          }
          
          // Check if it's an image file
          if (!file.type.startsWith('image/')) {
            toast({
              variant: 'destructive',
              title: 'خطا',
              description: 'لطفاً یک فایل تصویری انتخاب کنید',
            });
            return;
          }
          
          // اگر قبلاً thumbnail با data URI ذخیره شده بود، آن را پاک کن
          if (formData.thumbnail && formData.thumbnail.startsWith('data:')) {
            setFormData(prev => ({ ...prev, thumbnail: '' }));
          }
          
          // Upload image to server
          await handleImageUpload(file);
        }
    } else if (name === 'price') {
      // تبدیل ارقام فارسی به انگلیسی
      const persianToEnglish: { [key: string]: string } = {
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
      };
      
      let cleaned = value;
      // تبدیل ارقام فارسی به انگلیسی
      Object.keys(persianToEnglish).forEach(persian => {
        cleaned = cleaned.replace(new RegExp(persian, 'g'), persianToEnglish[persian]);
      });
      
      // حذف همه کاراکترهای غیر عددی (شامل کاما، فاصله، و ...)
      const raw = cleaned.replace(/[^\d]/g, '');
      
      // اگر هیچ رقمی وجود ندارد، خالی بگذار
      if (!raw) {
        setFormData(prev => ({ ...prev, price: '' }));
        return;
      }
      
      // تبدیل به عدد برای اطمینان از صحت
      const numValue = parseInt(raw, 10);
      
      // اگر عدد معتبر نیست، قبلی را نگه دار
      if (Number.isNaN(numValue) || numValue < 0) {
        return;
      }
      
      // فرمت با کاما (سه رقم سه رقم) با ارقام فارسی
      const formatted = numValue.toLocaleString('fa-IR');
      setFormData(prev => ({ ...prev, price: formatted }));
    } else if (name === 'discountPercent') {
      const raw = value.replace(/[^\d]/g, '');
      const nextValue = raw ? Math.min(100, Math.max(0, parseInt(raw, 10))).toString() : '';
      setFormData(prev => ({ ...prev, discountPercent: nextValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // اعتبارسنجی Step 1 (اطلاعات اصلی)
  const validateStep1 = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'عنوان دوره الزامی است',
      });
      return false;
    }
    if (!formData.description.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'توضیحات دوره الزامی است',
      });
      return false;
    }
    // بررسی اینکه thumbnail معتبر باشد و data URI نباشد
    if (!formData.thumbnail || !formData.thumbnail.trim() || formData.thumbnail.startsWith('data:')) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'تصویر شاخص دوره الزامی است. لطفاً تصویر را آپلود کنید.',
      });
      return false;
    }
    const numericPrice = parsePriceToNumber(formData.price);
    if (numericPrice < 0) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'قیمت معتبر وارد کنید',
      });
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      if (validateStep1()) {
        handleNextStep();
      }
      return;
    }
    
    // Step 2: Submit
    if (!formData.title.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'عنوان دوره الزامی است',
      });
      return;
    }
    if (!formData.description.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'توضیحات دوره الزامی است',
      });
      return;
    }
    // بررسی اینکه thumbnail معتبر باشد و data URI نباشد
    if (!formData.thumbnail || !formData.thumbnail.trim() || formData.thumbnail.startsWith('data:')) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'تصویر شاخص دوره الزامی است. لطفاً تصویر را آپلود کنید.',
      });
      return;
    }
    const numericPrice = parsePriceToNumber(formData.price);
    if (numericPrice < 0) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'قیمت معتبر وارد کنید',
      });
      return;
    }

    try {
      setLoading(true);
      // اطمینان از اینکه thumbnail معتبر است و data URI نیست
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailUrl.startsWith('data:')) {
        throw new Error('تصویر باید روی سرور آپلود شود. لطفاً دوباره تلاش کنید.');
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription || '',
        price: numericPrice,
        discountPercent: formData.discountPercent ? Number(formData.discountPercent) : 0,
        thumbnail: thumbnailUrl,
        category: formData.category || 'General',
        level: formData.level || 'Beginner',
        duration: formData.duration ? parseInt(formData.duration.toString()) : undefined,
        status: formData.status,
        sections: formData.sections || [],
      };

      const response = await coursesAPI.create(courseData);
      
      if (response.data?.success) {
        toast({ variant: 'success', title: 'دوره ایجاد شد', description: 'دوره با موفقیت ثبت شد' });
        setTimeout(() => router.push('/courses'), 1200);
      } else {
        throw new Error(response.data?.message || 'خطا در ایجاد دوره');
      }
    } catch (error: any) {
      console.error('Course creation error:', error);
      
      let errorMessage = 'خطا در ایجاد دوره';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.';
      } else if (error.response?.status === 401) {
        errorMessage = 'احراز هویت ناموفق بود. لطفاً دوباره وارد شوید.';
      } else if (error.response?.status === 403) {
        errorMessage = 'شما دسترسی لازم برای ایجاد دوره را ندارید.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ variant: 'destructive', title: 'خطا', description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newIndex = formData.sections.length;
    setFormData(prev => ({
      ...prev,
      sections: [...(prev.sections || []), { title: '', isFree: false, lessons: [] }]
    }));
    setExpandedSections(prev => new Set([...Array.from(prev), newIndex]));
  };

  const removeSection = (index: number) => {
    if (confirm('آیا از حذف این جلسه اطمینان دارید؟ تمام درس‌های این جلسه نیز حذف خواهند شد.')) {
      setFormData(prev => ({
        ...prev,
        sections: prev.sections.filter((_, i) => i !== index)
      }));
      const newExpanded = new Set(expandedSections);
      newExpanded.delete(index);
      setExpandedSections(newExpanded);
    }
  };

  const addLesson = (sectionIndex: number) => {
    const newSections = [...formData.sections];
    newSections[sectionIndex].lessons = [
      ...(newSections[sectionIndex].lessons || []),
      { title: '', description: '', duration: 0, isFree: false }
    ];
    setFormData(prev => ({ ...prev, sections: newSections }));
  };

  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    const newSections = [...formData.sections];
    newSections[sectionIndex].lessons = newSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
    setFormData(prev => ({ ...prev, sections: newSections }));
  };

  const updateSectionTitle = (index: number, title: string) => {
    const newSections = [...formData.sections];
    newSections[index].title = title;
    setFormData(prev => ({ ...prev, sections: newSections }));
  };

  const updateSectionFree = (index: number, isFree: boolean) => {
    const newSections = [...formData.sections];
    newSections[index].isFree = isFree;
    // اگر جلسه رایگان شد، تمام درس‌های آن را هم رایگان کن
    if (isFree && newSections[index].lessons) {
      newSections[index].lessons = newSections[index].lessons.map((lesson: any) => ({
        ...lesson,
        isFree: true,
      }));
    }
    setFormData(prev => ({ ...prev, sections: newSections }));
  };

  const updateLesson = (sectionIndex: number, lessonIndex: number, field: string, value: any) => {
    const newSections = [...formData.sections];
    (newSections[sectionIndex].lessons[lessonIndex] as any)[field] = value;
    setFormData(prev => ({ ...prev, sections: newSections }));
  };

  const handleVideoUpload = async (sectionIndex: number, lessonIndex: number, file: File | null) => {
    if (!file) return;
    try {
      setUploadingLesson({ sectionIndex, lessonIndex });

      const formDataUpload = new FormData();
      formDataUpload.append('video', file);

      const response = await api.post('/uploads/videos', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = response.data?.data?.url as string | undefined;
      if (!url) {
        throw new Error('آدرس ویدیو از سرور دریافت نشد');
      }

      setFormData(prev => {
        const newSections = [...prev.sections];
        (newSections[sectionIndex].lessons[lessonIndex] as any).content = url;
        return { ...prev, sections: newSections };
      });

      toast({
        variant: 'success',
        title: 'ویدیو آپلود شد',
        description: 'لینک ویدیو برای این درس تنظیم شد',
      });
    } catch (error: any) {
      console.error('Video upload error:', error);
      toast({
        variant: 'destructive',
        title: 'خطا در آپلود ویدیو',
        description: error.response?.data?.message || error.message || 'لطفاً دوباره تلاش کنید',
      });
    } finally {
      setUploadingLesson(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">ایجاد دوره جدید</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            اطلاعات دوره جدید را در {currentStep === 1 ? 'مرحله اول' : 'مرحله دوم'} وارد کنید
          </p>
        </div>
        <Link href="/courses">
          <Button variant="outline" className="w-full sm:w-auto">
            بازگشت به لیست
          </Button>
        </Link>
      </div>

      {/* Step Indicator */}
      <Card className="animate-slide-up delay-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className="flex items-center gap-3 flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                currentStep === 1 
                  ? 'bg-primary text-primary-foreground shadow-lg scale-110' 
                  : currentStep > 1
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > 1 ? <CheckCircle2 className="h-6 w-6" /> : '1'}
              </div>
              <div className="flex-1 hidden sm:block">
                <div className={`font-semibold text-sm ${currentStep === 1 ? 'text-primary' : currentStep > 1 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  اطلاعات اصلی
                </div>
                <div className="text-xs text-muted-foreground">عنوان، توضیحات، قیمت</div>
              </div>
            </div>
            
            {/* Connector */}
            <div className={`h-1 flex-1 mx-4 transition-all duration-300 ${
              currentStep > 1 ? 'bg-green-500' : 'bg-muted'
            }`} />
            
            {/* Step 2 */}
            <div className="flex items-center gap-3 flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-300 ${
                currentStep === 2 
                  ? 'bg-primary text-primary-foreground shadow-lg scale-110' 
                  : currentStep < 2
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-green-500 text-white'
              }`}>
                {currentStep === 2 ? '2' : currentStep > 2 ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
              </div>
              <div className="flex-1 hidden sm:block">
                <div className={`font-semibold text-sm ${currentStep === 2 ? 'text-primary' : currentStep > 2 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  جلسات و درس‌ها
                </div>
                <div className="text-xs text-muted-foreground">ساختار دوره</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card className="animate-slide-up delay-75">
          <CardHeader>
            <CardTitle>اطلاعات اصلی دوره</CardTitle>
            <CardDescription>اطلاعات پایه دوره را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">عنوان دوره *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="مثال: آموزش React از صفر تا صد"
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription" className="text-sm font-semibold">توضیحات کوتاه</Label>
              <Textarea
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="توضیحات کوتاه دوره (حداکثر 200 کاراکتر)"
                rows={3}
                maxLength={200}
                className="rounded-xl"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>توضیحات کوتاه برای نمایش در کارت دوره</span>
                <span>{formData.shortDescription.length}/200</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">توضیحات کامل *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="توضیحات کامل دوره را اینجا بنویسید..."
                rows={20}
                required
                className="rounded-xl resize-y min-h-[500px]"
              />
              <p className="text-xs text-muted-foreground">
                توضیحات کامل دوره که در صفحه جزئیات نمایش داده می‌شود
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-sm font-semibold">تصویر شاخص *</Label>
              <div className="flex flex-col gap-2">
                  <Input
                    id="thumbnail"
                    name="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    required
                    className="h-12"
                    disabled={uploadingThumbnail}
                  />
                  {uploadingThumbnail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال آپلود تصویر...
                    </div>
                  )}
              </div>
              {(formData.thumbnail || thumbnailPreview) && !uploadingThumbnail && (
                  <Card className="mt-3 max-w-md border-2 border-border/50 overflow-hidden">
                    <div className="relative aspect-video bg-muted/50">
                      <img 
                        src={
                          // اولویت با thumbnail از سرور
                          formData.thumbnail 
                            ? (
                                formData.thumbnail.startsWith('http')
                                  ? formData.thumbnail
                                  : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${formData.thumbnail.startsWith('/') ? formData.thumbnail : '/' + formData.thumbnail}`
                              )
                            : thumbnailPreview // اگر هنوز آپلود نشده، preview موقت را نشان بده
                        }
                        alt="پیش‌نمایش تصویر شاخص" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // اگر URL کامل نبود، دوباره امتحان کن
                          const img = e.target as HTMLImageElement;
                          if (!img.src.startsWith('http') && !img.src.startsWith('data:')) {
                            const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
                            img.src = formData.thumbnail.startsWith('/') 
                              ? `${apiUrl}${formData.thumbnail}`
                              : `${apiUrl}/${formData.thumbnail}`;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardContent className="p-3 pt-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {formData.thumbnail 
                          ? `آپلود شد: ${formData.thumbnail.split('/').pop() || formData.thumbnail}`
                          : thumbnailPreview
                          ? `پیش‌نمایش (در حال آپلود...)`
                          : ''}
                      </p>
                    </CardContent>
                  </Card>
                )}
              <p className="text-xs text-muted-foreground">
                حداکثر حجم: 10 مگابایت (JPEG, PNG, WEBP, GIF)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-semibold">قیمت (تومان) *</Label>
              <Input
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="مثال: ۱,۲۰۰,۰۰۰"
                required
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                مبلغ به‌صورت خودکار ۳ رقم ۳ رقم جدا می‌شود (فقط عدد وارد کنید)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercent" className="text-sm font-semibold">درصد تخفیف</Label>
                <Input
                  id="discountPercent"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  placeholder="مثلاً ۲۰"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold">دسته‌بندی</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                >
                  <option value="General">عمومی</option>
                  {categories.map((category) => (
                    <option key={category._id || category.slug} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-sm font-semibold">سطح دوره</Label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Beginner">مبتدی</option>
                  <option value="Intermediate">متوسط</option>
                  <option value="Advanced">پیشرفته</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-semibold">مدت زمان دوره (دقیقه)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="0"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold">وضعیت دوره</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="published">منتشر شده</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Step 2: Sections and Lessons Management */}
        {currentStep === 2 && (
          <Card className="animate-slide-up delay-75">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  جلسات و درس‌ها
                </CardTitle>
                <CardDescription>
                  ساختار دوره را با جلسات و درس‌ها تنظیم کنید
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addSection}
                className="gap-2 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                افزودن جلسه
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.sections?.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">هنوز جلسه‌ای اضافه نشده</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  برای شروع، اولین جلسه دوره را اضافه کنید
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSection}
                  className="gap-2 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  افزودن اولین جلسه
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.sections.map((section, sectionIndex) => {
                  const isExpanded = expandedSections.has(sectionIndex);
                  const lessonsCount = section.lessons?.length || 0;
                  
                  return (
                    <Card 
                      key={sectionIndex}
                      className={`border-2 transition-all duration-300 ${
                        isExpanded ? 'border-primary/30 shadow-lg' : 'border-border/50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Section Header */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors duration-200 rounded-t-xl"
                        onClick={() => toggleSection(sectionIndex)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                جلسه {sectionIndex + 1}
                              </span>
                              {!isExpanded && section.title && (
                                <span className="text-sm font-semibold truncate">{section.title}</span>
                              )}
                            </div>
                            {!isExpanded && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Play className="h-3 w-3" />
                                  {lessonsCount} درس
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSection(sectionIndex);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(sectionIndex);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Section Content - Expanded */}
                      {isExpanded && (
                        <CardContent className="pt-0 space-y-4">
                          {/* Section Title Input */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-sm font-semibold">عنوان جلسه *</Label>
                            <Input
                              placeholder="مثال: فصل 1 - مقدمه React"
                              value={section.title}
                              onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                              className="h-11 font-medium"
                            />
                          </div>

                          {/* Section Free Checkbox */}
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <input
                              type="checkbox"
                              id={`section-free-${sectionIndex}`}
                              checked={section.isFree || false}
                              onChange={(e) => updateSectionFree(sectionIndex, e.target.checked)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                            />
                            <Label htmlFor={`section-free-${sectionIndex}`} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                              <span className="text-green-600 font-bold">رایگان</span>
                              <span className="text-muted-foreground text-xs">(اگر این جلسه رایگان باشد، تمام درس‌های آن رایگان می‌شوند)</span>
                            </Label>
                          </div>

                          {/* Lessons Header */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2">
                              <Play className="h-4 w-4 text-primary" />
                              <Label className="text-sm font-semibold">درس‌های این جلسه</Label>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {lessonsCount}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addLesson(sectionIndex)}
                              className="gap-2 rounded-xl h-9"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              افزودن درس
                            </Button>
                          </div>

                          {/* Lessons List */}
                          {lessonsCount === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-border/30 rounded-xl bg-muted/20">
                              <Play className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                              <p className="text-sm text-muted-foreground mb-3">هنوز درسی اضافه نشده</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addLesson(sectionIndex)}
                                className="gap-2 rounded-xl"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                افزودن اولین درس
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {section.lessons.map((lesson, lessonIndex) => (
                                <Card 
                                  key={lessonIndex}
                                  className="border border-border/50 bg-accent/30 hover:bg-accent/50 transition-colors duration-200"
                                >
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                      {/* Lesson Number Badge */}
                                      <div className="flex-shrink-0 pt-1">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                          <span className="text-xs font-bold text-primary">{lessonIndex + 1}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Lesson Content */}
                                      <div className="flex-1 space-y-3 min-w-0">
                                        <div className="space-y-2">
                                          <Label className="text-xs font-semibold text-muted-foreground">عنوان درس *</Label>
                                          <Input
                                            placeholder="عنوان درس"
                                            value={lesson.title}
                                            onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'title', e.target.value)}
                                            className="h-10 font-medium"
                                          />
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label className="text-xs font-semibold text-muted-foreground">توضیحات (اختیاری)</Label>
                                          <Textarea
                                            placeholder="توضیحات درس"
                                            value={lesson.description || ''}
                                            onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'description', e.target.value)}
                                            rows={2}
                                            className="rounded-lg text-sm"
                                          />
                                        </div>

                                        {/* Video URL & Upload */}
                                        <div className="space-y-2">
                                          <Label className="text-xs font-semibold text-muted-foreground">ویدیو (لینک یا آپلود)</Label>
                                          <div className="flex flex-col sm:flex-row gap-2">
                                            <Input
                                              placeholder="لینک ویدیو (مثال: /uploads/videos/...)"
                                              value={lesson.content || ''}
                                              onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'content', e.target.value)}
                                              className="h-10 text-xs sm:text-sm"
                                            />
                                            <div className="flex items-center gap-2">
                                              <label className="inline-flex items-center">
                                                <input
                                                  type="file"
                                                  accept="video/*"
                                                  className="hidden"
                                                  onChange={(e) =>
                                                    handleVideoUpload(
                                                      sectionIndex,
                                                      lessonIndex,
                                                      e.target.files?.[0] || null
                                                    )
                                                  }
                                                />
                                                <Button
                                                  asChild
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="whitespace-nowrap rounded-xl"
                                                  disabled={
                                                    uploadingLesson?.sectionIndex === sectionIndex &&
                                                    uploadingLesson?.lessonIndex === lessonIndex
                                                  }
                                                >
                                                  <span>
                                                    {uploadingLesson?.sectionIndex === sectionIndex &&
                                                    uploadingLesson?.lessonIndex === lessonIndex ? (
                                                      <>
                                                        <Loader2 className="h-3.5 w-3.5 ml-1 animate-spin" />
                                                        در حال آپلود...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Edit2 className="h-3.5 w-3.5 ml-1" />
                                                        آپلود ویدیو
                                                      </>
                                                    )}
                                                  </span>
                                                </Button>
                                              </label>
                                            </div>
                                          </div>
                                          {lesson.content && (
                                            <p className="text-[11px] text-muted-foreground truncate">
                                              لینک تنظیم‌شده: {lesson.content}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {/* Lesson Free Checkbox */}
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                                          <input
                                            type="checkbox"
                                            id={`lesson-free-${sectionIndex}-${lessonIndex}`}
                                            checked={lesson.isFree || false}
                                            onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'isFree', e.target.checked)}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                                            disabled={section.isFree} // اگر جلسه رایگان است، این درس هم رایگان است
                                          />
                                          <Label htmlFor={`lesson-free-${sectionIndex}-${lessonIndex}`} className="text-xs font-medium cursor-pointer flex items-center gap-2">
                                            <span className="text-green-600 font-bold">رایگان</span>
                                            {section.isFree && (
                                              <span className="text-muted-foreground text-[10px]">(این درس به دلیل رایگان بودن جلسه، خودکار رایگان است)</span>
                                            )}
                                          </Label>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="flex-1 space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">مدت زمان (دقیقه)</Label>
                                            <div className="relative">
                                              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                              <Input
                                                type="number"
                                                placeholder="0"
                                                value={lesson.duration || ''}
                                                onChange={(e) => updateLesson(sectionIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                                                className="h-10 pr-10 w-full"
                                              />
                                            </div>
                                          </div>
                                          
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 self-end"
                                            onClick={() => {
                                              if (confirm('آیا از حذف این درس اطمینان دارید؟')) {
                                                removeLesson(sectionIndex, lessonIndex);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 animate-slide-up delay-200">
          {/* Step 1 Buttons */}
          {currentStep === 1 && (
            <>
              <Link href="/courses" className="flex-1 sm:flex-none order-2 sm:order-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto h-12 rounded-xl"
                >
                  انصراف
                </Button>
              </Link>
              <Button 
                type="button" 
                onClick={handleNextStep}
                className="flex-1 sm:flex-none h-12 text-base font-bold shadow-2xl shadow-primary/40 hover:shadow-primary/50 hover:shadow-2xl group relative overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-purple-700 hover:from-primary/95 hover:via-purple-600/95 hover:to-purple-700/95 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-0 ring-2 ring-primary/20 hover:ring-primary/30 order-1 sm:order-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-2 text-white font-bold">
                  <span className="text-white drop-shadow-sm">مرحله بعد</span>
                  <ArrowLeft className="h-5 w-5 text-white group-hover:-translate-x-1 transition-transform drop-shadow-sm" />
                </span>
              </Button>
            </>
          )}

          {/* Step 2 Buttons */}
          {currentStep === 2 && (
            <>
              <Button 
                type="button" 
                onClick={handlePrevStep}
                variant="outline"
                className="flex-1 sm:flex-none h-12 rounded-xl gap-2"
              >
                <ArrowRight className="h-5 w-5" />
                مرحله قبل
              </Button>
              <div className="flex flex-col sm:flex-row gap-3 flex-1 sm:flex-none">
                <Link href="/courses" className="flex-1 sm:flex-none">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto h-12 rounded-xl"
                  >
                    انصراف
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 sm:flex-none h-12 text-base font-bold shadow-2xl shadow-primary/40 hover:shadow-primary/50 hover:shadow-2xl group relative overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-purple-700 hover:from-primary/95 hover:via-purple-600/95 hover:to-purple-700/95 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-0 ring-2 ring-primary/20 hover:ring-primary/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2 text-white font-bold">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                        <span className="text-white">در حال ایجاد...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white drop-shadow-sm">ایجاد دوره</span>
                        <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform drop-shadow-sm" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
