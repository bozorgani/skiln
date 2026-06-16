'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import ScrollAnimation from './ScrollAnimation';
import ParticlesBackground from './ParticlesBackground';
import ParallaxSection from './ParallaxSection';
import MagneticButton from './MagneticButton';
import { Star, Users, Clock, Play, ArrowRight, Sparkles } from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';
import { calculateCourseDuration } from '@/lib/course-utils';

interface HeroSectionProps {
  featuredCourse: any;
}

export default function HeroSection({ featuredCourse }: HeroSectionProps) {
  if (!featuredCourse) return null;

  return (
    <section className="relative mb-12 md:mb-16 rounded-2xl overflow-hidden shadow-xl group border border-border/50">
      <ParticlesBackground />
      <div className="relative h-[400px] sm:h-[450px] md:h-[500px]">
        <ParallaxSection speed={0.3}>
          <Image
            src={getImageUrl(featuredCourse.thumbnail)}
            alt={`تصویر دوره ${featuredCourse.title} - Skiln`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-[5s] ease-out"
            sizes="100vw"
            priority
            quality={90}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8BtJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//Z"
            unoptimized={!featuredCourse.thumbnail || featuredCourse.thumbnail.includes('via.placeholder.com')}
          />
        </ParallaxSection>
        
        {/* Multi-layer gradients with animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/96 via-black/85 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-indigo-500/25 animate-pulse" />
        
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/40 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-500/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="max-w-5xl">
              {/* Badge */}
              <ScrollAnimation delay={0} direction="scale" duration={0.6}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full mb-4 border border-white/20 shadow-lg group/badge hover:bg-white/15 transition-all duration-300">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-bold text-white">دوره ویژه</span>
                </div>
              </ScrollAnimation>

              {/* Title */}
              <ScrollAnimation delay={0.1} direction="up" duration={0.6}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg line-clamp-2">
                  {featuredCourse.title}
                </h1>
              </ScrollAnimation>
              <ScrollAnimation delay={0.2} direction="up" duration={0.6}>
                <div className="text-base sm:text-lg md:text-xl text-white/90 mb-6 line-clamp-2 drop-shadow max-w-2xl leading-relaxed whitespace-pre-line">
                  {featuredCourse.shortDescription || featuredCourse.description}
                </div>
              </ScrollAnimation>

              {/* Stats */}
              <ScrollAnimation delay={0.3} direction="up" duration={0.6}>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {featuredCourse.ratings?.average > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300 group/stat">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-sm text-white">{featuredCourse.ratings.average.toFixed(1)}</span>
                      <span className="text-xs text-white/70">({featuredCourse.ratings.count || 0})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
                    <Users className="h-4 w-4 text-white" />
                    <span className="font-bold text-sm text-white">{featuredCourse.studentsEnrolled || 0}</span>
                    <span className="text-xs text-white/70">دانشجو</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="font-bold text-sm text-white">{calculateCourseDuration(featuredCourse)}</span>
                    <span className="text-xs text-white/70">دقیقه</span>
                  </div>
                </div>
              </ScrollAnimation>

              {/* CTA Buttons */}
              <ScrollAnimation delay={0.4} direction="up" duration={0.6}>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Link href={`/courses/${featuredCourse._id}`}>
                    <MagneticButton
                      size="lg" 
                      intensity={0.15}
                      className="text-base sm:text-lg px-8 h-12 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/90 hover:via-indigo-600/90 hover:to-purple-600/90 shadow-xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 border border-white/20 group/btn"
                    >
                      <Play className="h-5 w-5 mr-2 transition-transform duration-300 group-hover/btn:scale-110" fill="currentColor" />
                      <span className="font-bold">شروع یادگیری</span>
                      <ArrowRight className="h-5 w-5 mr-2 transition-transform duration-300 group-hover/btn:translate-x-2" />
                    </MagneticButton>
                  </Link>
                  <div className="flex items-baseline gap-2 text-white">
                    <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-white/95 to-white/85 bg-clip-text text-transparent">
                      {featuredCourse.price === 0 ? 'رایگان' : `${featuredCourse.price.toLocaleString('fa-IR')}`}
                    </span>
                    {featuredCourse.price > 0 && (
                      <span className="text-base text-white/80 font-bold">تومان</span>
                    )}
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

