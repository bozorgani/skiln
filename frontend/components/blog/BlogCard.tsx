'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Eye, Heart, User, Calendar, ArrowLeft } from 'lucide-react';
import ScrollAnimation from '@/components/common/ScrollAnimation';
import { formatRelativeTime } from '@/lib/dateUtils';

interface BlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string;
    category: string;
    author: {
      name: string;
      avatar?: string;
    };
    publishedAt?: string;
    createdAt: string;
    readingTime: number;
    views: number;
    likes: number;
    tags?: string[];
  };
  index?: number;
}

export default function BlogCard({ blog, index = 0 }: BlogCardProps) {
  const publishedDate = blog.publishedAt || blog.createdAt;
  const formattedDate = publishedDate ? formatRelativeTime(publishedDate) : '';

  return (
    <ScrollAnimation delay={index * 0.1} direction="up" duration={0.6}>
      <Link href={`/blog/${blog.slug || blog._id}`}>
        <Card className="group relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 h-full flex flex-col">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-700 z-0"></div>
          
          {/* Featured Image */}
          <div className="relative h-64 overflow-hidden">
            <Image
              src={blog.featuredImage || '/placeholder-blog.jpg'}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-125 transition-transform duration-1000 ease-out"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Category Badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className="px-4 py-1.5 bg-primary/90 backdrop-blur-xl text-white text-xs font-black rounded-full shadow-2xl border-2 border-white/30">
                {blog.category}
              </span>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-6 flex-grow flex flex-col relative z-10">
            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {blog.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-muted text-xs font-semibold rounded-lg text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h3 className="font-black text-2xl mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
              {blog.title}
            </h3>
            
            {/* Excerpt */}
            <p className="text-muted-foreground line-clamp-3 mb-6 leading-relaxed flex-grow">
              {blog.excerpt}
            </p>

            {/* Footer Info */}
            <div className="space-y-4 pt-4 border-t-2 border-border/30">
              {/* Author and Date */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-semibold">{blog.author?.name || 'نویسنده'}</span>
                  </div>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">{formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-semibold">{blog.readingTime || 5} دقیقه</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs font-semibold">{blog.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs font-semibold">{blog.likes || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all duration-300">
                  <span className="text-sm font-bold">ادامه مطلب</span>
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </div>
              </div>
            </div>
          </CardContent>

          {/* Hover shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          </div>
        </Card>
      </Link>
    </ScrollAnimation>
  );
}

