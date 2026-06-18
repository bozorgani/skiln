'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/image-utils';
import { getCoursePricing } from '@/lib/course-utils';
import { Card } from '@/components/ui/card';
import { Star, ChevronRight, ChevronLeft, Users } from 'lucide-react';

interface CourseCarouselSectionProps {
  title: string;
  courses: any[];
  seeAllLink?: string;
  gradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
}

export default function CourseCarouselSection({
  title,
  courses,
  seeAllLink,
  gradientColors = {
    start: 'hsl(var(--primary))',
    middle: 'hsl(var(--primary))',
    end: 'hsl(142, 76%, 36%)', // green-500
  },
}: CourseCarouselSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [courses]);

  if (courses.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 400;
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const targetScroll =
      direction === 'right'
        ? currentScroll + scrollAmount
        : currentScroll - scrollAmount;
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mb-12 md:mb-16 relative">
      {/* Gradient Background Container */}
      <div
        className="rounded-2xl md:rounded-3xl overflow-hidden p-6 md:p-8 lg:p-10"
        style={{
          background: `linear-gradient(86deg, ${gradientColors.start} 3.56%, ${gradientColors.middle} 40.71%, ${gradientColors.end} 96.44%)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {title}
          </h2>
          {seeAllLink && (
            <Link href={seeAllLink}>
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm group"
              >
                <span className="font-semibold">مشاهده همه</span>
                <ChevronLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
              </Button>
            </Link>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 md:p-3 border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
              aria-label="قبلی"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 md:p-3 border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
              aria-label="بعدی"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </button>
          )}

          {/* Scrollable Content */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {courses.map((course: any) => (
              <CourseCarouselCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseCarouselCard({ course }: { course: any }) {
  const { originalPrice, finalPrice, discountPercent, hasDiscount } = getCoursePricing(course);

  return (
    <div className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] flex-shrink-0">
      <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group h-full">
        {/* Course Banner */}
        <Link href={`/courses/${course._id}`} className="block h-[168px] relative overflow-hidden rounded-xl">
          <Image
            src={getImageUrl(course.thumbnail)}
            alt={`تصویر دوره ${course.title} - Skiln`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500 rounded-xl"
            sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, 360px"
            loading="lazy"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8BtJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//Z"
            unoptimized={!course.thumbnail || course.thumbnail.includes('via.placeholder.com')}
          />
        </Link>

        {/* Course Title & Description */}
        <div className="flex-grow px-[18px] pt-4 pb-3">
          {/* Course Title */}
          <h3 className="font-bold line-clamp-2 mb-3">
            <Link 
              href={`/courses/${course._id}`}
              className="hover:text-primary transition-colors duration-300"
            >
              {course.title}
            </Link>
          </h3>
          {/* Course Description */}
          <div className="text-sm line-clamp-2 text-gray-700 dark:text-gray-400 whitespace-pre-line">
            {course.shortDescription || course.description}
          </div>
        </div>

        {/* Course Footer */}
        <div className="px-[18px] pb-3">
          {/* Teacher & Rating */}
          <div className="flex justify-between gap-2.5 text-slate-500 dark:text-white/70 text-sm pb-3 border-b border-neutral-200/70 dark:border-white/10">
            {/* Teacher */}
            {course.instructor && (
              <div className="flex items-center gap-x-0.5 hover:text-green-500 transition-colors">
                <Users className="w-5 h-5" />
                <Link 
                  href={`/teacher/${typeof course.instructor === 'object' ? course.instructor._id : ''}`}
                  className="hover:underline"
                >
                  {typeof course.instructor === 'object' ? course.instructor.name : course.instructor}
                </Link>
              </div>
            )}
            {/* Rating */}
            {course.ratings?.average > 0 && (
              <div className="flex items-center gap-x-0.5 text-amber-500">
                <span className="font-medium">{course.ratings.average.toFixed(1)}</span>
                <Star className="w-5 h-5 fill-amber-500" />
              </div>
            )}
          </div>

          {/* Price & Students */}
          <div className="flex items-end justify-between mt-4">
            {/* Students Count */}
            <span className="flex items-center gap-x-0.5 text-slate-500 dark:text-white/70 text-sm">
              <Users className="size-5" />
              {course.studentsEnrolled || 0}
            </span>

            {/* Price */}
            <div className="flex items-center gap-x-2.5">
              <div className={`text-sm font-medium p-1 rounded bg-green-500 text-white ${hasDiscount ? '' : 'hidden'}`}>
                {discountPercent}%
              </div>
              <div className="flex flex-col items-end">
                {hasDiscount && (
                  <span className="text-sm text-slate-500 dark:text-white/70 -mb-1.5 line-through">
                    {originalPrice.toLocaleString('fa-IR')}
                  </span>
                )}
                <span className={`${hasDiscount ? 'text-green-500' : 'text-foreground'} font-bold text-lg`}>
                  {finalPrice === 0 ? (
                    'رایگان'
                  ) : (
                    <>
                      {finalPrice.toLocaleString('fa-IR')}
                      <span className="font-medium text-base mr-1">تومان</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

