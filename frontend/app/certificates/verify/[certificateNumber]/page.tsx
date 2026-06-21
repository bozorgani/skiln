import Link from 'next/link';
import { Award, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function verifyCertificate(certificateNumber: string) {
  try {
    const response = await fetch(`${API_URL}/certificates/verify/${certificateNumber}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.certificate || data.data || null;
  } catch {
    return null;
  }
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>;
}) {
  const { certificateNumber } = await params;
  const certificate = await verifyCertificate(certificateNumber);

  return (
    <main className="min-h-screen bg-background container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowRight className="h-4 w-4" />
          بازگشت به سایت
        </Link>

        <Card className={`border-2 shadow-xl overflow-hidden ${certificate ? 'border-green-500/30' : 'border-destructive/30'}`}>
          <CardHeader className="text-center bg-muted/40 border-b">
            <div className={`mx-auto w-20 h-20 rounded-3xl text-white flex items-center justify-center shadow-xl mb-4 ${certificate ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
              {certificate ? <CheckCircle2 className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
            </div>
            <CardTitle className="text-2xl md:text-3xl font-black">
              {certificate ? 'گواهینامه معتبر است' : 'گواهینامه یافت نشد'}
            </CardTitle>
            <CardDescription className="font-mono break-all">{certificateNumber}</CardDescription>
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
                    <p className="text-muted-foreground mb-1">نام دوره</p>
                    <p className="font-bold">{certificate.course?.title}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">تاریخ تکمیل</p>
                    <p className="font-bold">{new Date(certificate.completedAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">تاریخ صدور</p>
                    <p className="font-bold">{new Date(certificate.issuedAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 flex items-center gap-3">
                  <Award className="h-5 w-5" />
                  این گواهینامه توسط Skiln صادر شده و معتبر است.
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">شماره گواهینامه واردشده در سیستم پیدا نشد یا نامعتبر است.</p>
                <Link href="/">
                  <Button>صفحه اصلی</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
