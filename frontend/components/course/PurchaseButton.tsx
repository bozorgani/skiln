'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { paymentsAPI } from '@/lib/api';
import { getCoursePricing } from '@/lib/course-utils';
import Link from 'next/link';
import { ShoppingCart, Check, Shield, Crown, Loader2 } from 'lucide-react';

interface PurchaseButtonProps {
  courseId: string;
  course: any;
  isEnrolled: boolean;
}

export default function PurchaseButton({ courseId, course, isEnrolled }: PurchaseButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, isInCart, removeFromCart } = useCart();
  const { toast } = useToast();
  const [adminPurchasing, setAdminPurchasing] = useState(false);
  const isAdmin = user?.role === 'admin';
  const { finalPrice } = getCoursePricing(course);

  const handleAddToCart = () => {
    // Add to cart first (even if user is not logged in)
    // This ensures cart is saved to localStorage before redirect
    if (isInCart(courseId)) {
      removeFromCart(courseId);
      toast({
        title: 'حذف شد',
        description: 'دوره از سبد خرید حذف شد',
        variant: 'success',
      });
    } else {
      addToCart({
        courseId,
        title: course.title,
        thumbnail: course.thumbnail || '/img/cr1.webp',
        price: finalPrice,
        description: course.description,
      });
      toast({
        title: 'افزوده شد',
        description: 'دوره به سبد خرید اضافه شد',
        variant: 'success',
      });
      
      // If user is not logged in, redirect to login after adding to cart
      if (!user) {
        // Small delay to ensure localStorage is saved
        setTimeout(() => {
          router.push(`/login?redirect=/checkout`);
        }, 100);
        return;
      }
    }
  };

  const handleGoToCheckout = () => {
    if (!user) {
      router.push(`/login?redirect=/checkout`);
      return;
    }
    router.push('/checkout');
  };

  const handleAdminPurchase = async () => {
    if (!isAdmin) {
      toast({
        title: 'دسترسی محدود',
        description: 'فقط مدیران می‌توانند از این گزینه استفاده کنند',
        variant: 'destructive',
      });
      return;
    }

    setAdminPurchasing(true);
    try {
      await paymentsAPI.adminPurchase(courseId);
      toast({
        title: 'موفق',
        description: 'دوره با موفقیت خریداری شد (پرداخت مدیر)',
        variant: 'success',
      });
      router.refresh();
      setTimeout(() => {
        router.push(`/courses/${courseId}/lessons`);
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.message || 'خطا در خرید دوره',
        variant: 'destructive',
      });
    } finally {
      setAdminPurchasing(false);
    }
  };

  if (isEnrolled) {
    return (
      <Link href={`/courses/${courseId}/lessons`} className="block">
        <Button className="w-full text-sm sm:text-base">ادامه یادگیری</Button>
      </Link>
    );
  }

  const inCart = isInCart(courseId);

  return (
    <div className="space-y-2">
      {/* Admin Purchase Button */}
      {isAdmin && (
        <Button
          onClick={handleAdminPurchase}
          disabled={adminPurchasing}
          className="w-full text-sm sm:text-base bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          {adminPurchasing ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              در حال پردازش...
            </>
          ) : (
            <>
              <Crown className="h-4 w-4 ml-2" />
              پرداخت مدیر (رایگان)
            </>
          )}
        </Button>
      )}

      <Button 
        onClick={handleAddToCart} 
        className="w-full text-sm sm:text-base"
        variant={inCart ? "outline" : "default"}
      >
        {inCart ? (
          <>
            <Check className="h-4 w-4 ml-2" />
            در سبد خرید
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 ml-2" />
            افزودن به سبد خرید
          </>
        )}
      </Button>
      <Button 
        onClick={handleGoToCheckout} 
        className="w-full text-sm sm:text-base"
        variant="outline"
      >
        مشاهده سبد خرید
      </Button>
    </div>
  );
}


