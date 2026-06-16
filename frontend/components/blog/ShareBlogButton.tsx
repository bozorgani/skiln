'use client';

import { Button } from '@/components/ui/button';

interface ShareBlogButtonProps {
  title: string;
  text?: string;
}

export default function ShareBlogButton({ title, text }: ShareBlogButtonProps) {
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // User cancelled native share dialog; fall back only for non-cancel failures.
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    await navigator.clipboard?.writeText(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} type="button">
      اشتراک‌گذاری
    </Button>
  );
}
