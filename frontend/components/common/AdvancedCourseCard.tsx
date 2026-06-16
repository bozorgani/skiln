'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Clock, Play, Flame, BookOpen, TrendingUp } from 'lucide-react';
import ImageWithBlur from './ImageWithBlur';
import RevealOnScroll from './RevealOnScroll';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-utils';
import { calculateCourseDuration } from '@/lib/course-utils';

interface AdvancedCourseCardProps {
  course: any;
  index?: number;
}

export default function AdvancedCourseCard({ course, index = 0 }: AdvancedCourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hasDiscount = course.price > 0 && course.price < 50000;
  const originalPrice = hasDiscount ? course.price * 1.25 : course.price;
  const discountPercent = hasDiscount ? 20 : 0;

  return (
    <RevealOnScroll delay={index * 0.1} direction="up" distance={30}>
      <div
        className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-700 border-2 border-border/50 hover:border-primary/50 hover:-translate-y-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-indigo-500/0 to-purple-500/0 group-hover:from-primary/10 group-hover:via-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-700 z-0" />
        
        {/* Badge with animation */}
        {hasDiscount && (
          <div className="absolute top-5 left-5 z-20 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-2xl animate-pulse border-2 border-white/30 group-hover:scale-110 transition-transform duration-300">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {discountPercent}% تخفیف
            </span>
          </div>
        )}

        {/* Trending badge */}
        {course.studentsEnrolled > 100 && (
          <div className="absolute top-5 right-5 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-xl flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            پرفروش
          </div>
        )}
        
        {/* Course Banner with advanced effects */}
        <Link href={`/courses/${course._id}`} className="block h-[240px] relative overflow-hidden z-10">
          <ImageWithBlur
            src={getImageUrl(course.thumbnail)}
            alt={`تصویر دوره ${course.title} - Skiln`}
            fill
            className="object-cover group-hover:scale-125 transition-transform duration-[2s] ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={index < 4}
            quality={85}
            placeholder="blur"
          />
          
          {/* Multi-layer overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          {/* Play button with advanced animation */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-500",
            isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
          )}>
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-ping" />
              <div className="relative bg-white/95 backdrop-blur-xl rounded-full p-6 shadow-2xl border-4 border-primary/50 group-hover:border-primary transition-all duration-300">
                <Play className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Progress bar for enrolled users */}
          {course.progress && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-primary via-indigo-600 to-purple-600 transition-all duration-1000 shadow-lg"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}

          {/* Shine effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </div>
        </Link>

        {/* Course Content */}
        <div className="flex-grow p-6 relative z-10">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-black text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300 flex-1">
              <Link href={`/courses/${course._id}`} className="hover:underline decoration-2 underline-offset-4">
                {course.title}
              </Link>
            </h3>
            {course.isNew && (
              <span className="ml-2 px-2.5 py-1 bg-green-500 text-white text-xs font-black rounded-lg whitespace-nowrap shadow-lg animate-pulse">
                جدید
              </span>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed whitespace-pre-line">
            {course.shortDescription || course.description}
          </div>

          {/* Enhanced Stats Row */}
          <div className="flex items-center justify-between text-sm mb-5 pb-5 border-b-2 border-border/30">
            {course.instructor && (
              <div className="flex items-center gap-2 text-muted-foreground group/instructor">
                <div className="p-1.5 rounded-lg bg-primary/10 group-hover/instructor:bg-primary/20 transition-all duration-300 group-hover/instructor:scale-110">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-bold">{typeof course.instructor === 'object' ? course.instructor.name : course.instructor}</span>
              </div>
            )}
            {course.ratings?.average > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="font-black text-amber-600 dark:text-amber-400">{course.ratings.average.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({course.ratings.count || 0})</span>
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1.5 group/stat">
                <Users className="h-4 w-4 group-hover/stat:scale-110 transition-transform" />
                <span className="text-xs font-black">{course.studentsEnrolled || 0}</span>
              </div>
              {(() => {
                const duration = calculateCourseDuration(course);
                return duration > 0 && (
                  <>
                    <span className="text-border">•</span>
                    <div className="flex items-center gap-1.5 group/stat">
                      <Clock className="h-4 w-4 group-hover/stat:scale-110 transition-transform" />
                      <span className="text-xs font-black">{duration} دقیقه</span>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center gap-3">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through font-bold">
                  {originalPrice.toLocaleString('fa-IR')}
                </span>
              )}
              <div className="text-left">
                <span className={cn(
                  "font-black text-2xl transition-colors duration-300",
                  hasDiscount ? 'text-green-500 group-hover:text-green-400' : 'text-primary group-hover:text-indigo-600'
                )}>
                  {course.price === 0 ? (
                    'رایگان'
                  ) : (
                    <>
                      {course.price.toLocaleString('fa-IR')}
                      <span className="text-sm font-bold mr-1">تومان</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover border glow */}
        <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-primary/30 transition-all duration-700 pointer-events-none" />
      </div>
    </RevealOnScroll>
  );
}

