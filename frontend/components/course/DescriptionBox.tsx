'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface DescriptionBoxProps {
  content: string;
}

export default function DescriptionBox({ content }: DescriptionBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpander, setShowExpander] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // بررسی ارتفاع محتوا
      const height = contentRef.current.scrollHeight;
      // اگر ارتفاع بیشتر از 700px باشد، دکمه "ادامه مطلب" را نشان بده
      if (height >= 700) {
        setShowExpander(true);
      }
    }
  }, [content]);

  if (!content) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        توضیحاتی برای این دوره وجود ندارد.
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={`content-area ${
          isExpanded ? '' : 'max-h-[700px] overflow-hidden relative'
        }`}
        style={{
          textAlign: 'right',
          direction: 'rtl',
        }}
      >
        <div 
          className="whitespace-pre-line text-sm md:text-base leading-relaxed text-muted-foreground prose prose-sm md:prose-base dark:prose-invert max-w-none"
          style={{
            textAlign: 'right',
            direction: 'rtl',
          }}
          dangerouslySetInnerHTML={{ 
            __html: content
              .replace(/\n/g, '<br />')
              .replace(/<h2>/g, '<h2 class="text-2xl font-bold mt-6 mb-3">')
              .replace(/<h3>/g, '<h3 class="text-xl font-bold mt-4 mb-2">')
              .replace(/<p>/g, '<p class="mb-4">')
              .replace(/<ul>/g, '<ul class="list-disc mr-6 mb-4">')
              .replace(/<li>/g, '<li class="mb-2">')
              .replace(/<strong>/g, '<strong class="font-bold">')
          }}
        />
      </div>
      
      {showExpander && !isExpanded && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center pt-8 pb-4 w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-white/90 dark:via-gray-900/90 to-transparent"></div>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(true)}
            className="relative flex items-center gap-2 rounded-lg border-2 border-gray-300 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            ادامه مطلب
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

