'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Award, Download, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { certificatesAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CourseCertificatePage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    certificatesAPI.getMeta(courseId)
      .then((response) => setCertificate(response.data?.data?.certificate))
      .catch((error) => {
        toast({
          title: 'گواهینامه در دسترس نیست',
          description: error.response?.data?.message || 'برای دریافت گواهینامه باید دوره را کامل کنید.',
          variant: 'destructive',
        });
      })
      .finally(() => setLoading(false));
  }, [courseId, toast]);

  const downloadCertificate = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = `${API_URL}/certificates/${courseId}`;
    link.download = `certificate-${certificate?.certificateNumber || courseId}.pdf`;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => setDownloading(false), 800);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <main className="min-h-screen bg-background container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowRight className="h-4 w-4" />
          بازگشت به داشبورد
        </Link>

        <Card className="border-2 shadow-xl overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 border-b">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-xl mb-4">
              <Award className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black">گواهینامه پایان دوره</CardTitle>
            <CardDescription>گواهینامه معتبر Skiln برای تکمیل دوره</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            {certificate ? (
              <>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">نام دانشجو</p>
                    <p className="font-bold">{certificate.user?.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">دوره</p>
                    <p className="font-bold">{certificate.course?.title}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">شماره گواهینامه</p>
                    <p className="font-mono font-bold break-all">{certificate.certificateNumber}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">تاریخ صدور</p>
                    <p className="font-bold">{new Date(certificate.issuedAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={downloadCertificate} disabled={downloading} className="flex-1">
                    {downloading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Download className="h-4 w-4 ml-2" />}
                    دانلود PDF
                  </Button>
                  <Link href={`/certificates/verify/${certificate.certificateNumber}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <ShieldCheck className="h-4 w-4 ml-2" />
                      صفحه اعتبارسنجی
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-muted-foreground">گواهینامه‌ای برای نمایش وجود ندارد.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
