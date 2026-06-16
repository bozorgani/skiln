import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:py-12 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">404</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6 md:mb-8">صفحه یافت نشد</p>
        <Link href="/">
          <Button className="text-sm sm:text-base">بازگشت به خانه</Button>
        </Link>
      </main>
    </div>
  );
}


