import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Eye, Heart, User, Calendar, ArrowRight, Share2, BookOpen, Tag } from 'lucide-react';
import BlogCard from '@/components/blog/BlogCard';
import ScrollAnimation from '@/components/common/ScrollAnimation';
import { formatRelativeTime } from '@/lib/dateUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getBlog(slug: string) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies.length > 0 
      ? allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
      : '';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const url = `${API_URL}/blogs/${slug}`;
    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.data?.blog || null;
  } catch (error) {
    return null;
  }
}

async function getRelatedBlogs(category: string, excludeId: string) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies.length > 0 
      ? allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
      : '';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const params = new URLSearchParams();
    params.set('category', category);
    params.set('limit', '3');
    params.set('sort', '-publishedAt');
    
    const url = `${API_URL}/blogs?${params.toString()}`;
    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const blogs = data.data?.blogs || [];
    return blogs.filter((blog: any) => blog._id !== excludeId).slice(0, 3);
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    return {
      title: 'مقاله یافت نشد',
    };
  }

  return {
    title: blog.seo?.metaTitle || blog.title,
    description: blog.seo?.metaDescription || blog.excerpt,
    keywords: blog.seo?.keywords?.join(', ') || blog.tags?.join(', '),
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: [blog.featuredImage],
      type: 'article',
      publishedTime: blog.publishedAt || blog.createdAt,
      authors: [blog.author?.name],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  const publishedDate = blog.publishedAt || blog.createdAt;
  const formattedDate = publishedDate ? formatRelativeTime(publishedDate) : '';

  const relatedBlogs = await getRelatedBlogs(blog.category, blog._id);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative mb-12 overflow-hidden">
        <div className="relative h-[500px] md:h-[600px] overflow-hidden">
          <Image
            src={blog.featuredImage || '/placeholder-blog.jpg'}
            alt={blog.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
          
          <div className="relative z-10 h-full flex items-end">
            <div className="container mx-auto px-4 pb-12">
              <div className="max-w-4xl">
                <div className="mb-4">
                  <span className="inline-block px-6 py-2 bg-primary/90 backdrop-blur-xl text-white text-sm font-black rounded-full shadow-2xl border-2 border-white/30">
                    {blog.category}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                  {blog.title}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="font-semibold">{blog.author?.name || 'نویسنده'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{blog.readingTime || 5} دقیقه مطالعه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <span>{blog.views || 0} بازدید</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    <span>{blog.likes || 0} لایک</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none mb-16">
            <div 
              className="blog-content text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: blog.content }}
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.875rem',
              }}
            />
          </article>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <ScrollAnimation delay={0.2} direction="up" duration={0.6}>
              <div className="mb-12 pb-8 border-b-2 border-border/30">
                <div className="flex items-center gap-3 mb-4">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-black">برچسب‌ها</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {blog.tags.map((tag: string, idx: number) => (
                    <Link
                      key={idx}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground text-sm font-semibold rounded-lg transition-all duration-300"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollAnimation>
          )}

          {/* Share Section */}
          <ScrollAnimation delay={0.3} direction="up" duration={0.6}>
            <Card className="mb-12 border-2 border-border/50 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-purple-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Share2 className="h-5 w-5 text-primary" />
                    <span className="font-black text-lg">اشتراک‌گذاری مقاله</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.share?.({
                            title: blog.title,
                            text: blog.excerpt,
                            url: window.location.href,
                          });
                        }
                      }}
                    >
                      اشتراک‌گذاری
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollAnimation>

          {/* Author Card */}
          {blog.author && (
            <ScrollAnimation delay={0.4} direction="up" duration={0.6}>
              <Card className="mb-12 border-2 border-border/50 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {blog.author.avatar ? (
                        <Image
                          src={blog.author.avatar}
                          alt={blog.author.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <User className="h-10 w-10 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-2xl font-black mb-2">{blog.author.name}</h3>
                      {blog.author.bio && (
                        <p className="text-muted-foreground leading-relaxed mb-4">
                          {blog.author.bio}
                        </p>
                      )}
                      <Link href={`/blog?author=${blog.author._id}`}>
                        <Button variant="outline" size="sm">
                          مشاهده مقالات دیگر
                          <ArrowRight className="h-4 w-4 mr-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          )}

          {/* Related Posts */}
          {relatedBlogs.length > 0 && (
            <ScrollAnimation delay={0.5} direction="up" duration={0.8}>
              <section className="mb-12">
                <div className="flex items-center gap-5 mb-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/40 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-br from-primary via-indigo-600 to-purple-600 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform duration-500 border-2 border-white/20">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent">
                      مقالات مرتبط
                    </h2>
                    <p className="text-muted-foreground font-medium">
                      مقالات مشابه که ممکن است علاقه‌مند باشید
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {relatedBlogs.map((relatedBlog: any, index: number) => (
                    <BlogCard key={relatedBlog._id} blog={relatedBlog} index={index} />
                  ))}
                </div>
              </section>
            </ScrollAnimation>
          )}

          {/* Back to Blog */}
          <ScrollAnimation delay={0.6} direction="up" duration={0.6}>
            <div className="text-center">
              <Link href="/blog">
                <Button variant="outline" size="lg" className="group">
                  <ArrowRight className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-2" />
                  بازگشت به بلاگ
                </Button>
              </Link>
            </div>
          </ScrollAnimation>
        </div>
      </main>

      {/* Add custom styles for blog content */}
      <style jsx global>{`
        .blog-content {
          color: hsl(var(--foreground));
        }
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          font-weight: 900;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: hsl(var(--foreground));
        }
        .blog-content h1 {
          font-size: 2.5rem;
        }
        .blog-content h2 {
          font-size: 2rem;
        }
        .blog-content h3 {
          font-size: 1.75rem;
        }
        .blog-content p {
          margin-bottom: 1.5rem;
          line-height: 1.875rem;
        }
        .blog-content ul,
        .blog-content ol {
          margin-bottom: 1.5rem;
          padding-right: 2rem;
        }
        .blog-content li {
          margin-bottom: 0.5rem;
        }
        .blog-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .blog-content a:hover {
          color: hsl(var(--primary) / 0.8);
        }
        .blog-content img {
          max-width: 100%;
          height: auto;
          border-radius: 1rem;
          margin: 2rem 0;
        }
        .blog-content blockquote {
          border-right: 4px solid hsl(var(--primary));
          padding-right: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        .blog-content code {
          background: hsl(var(--muted));
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .blog-content pre {
          background: hsl(var(--muted));
          padding: 1.5rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin: 2rem 0;
        }
        .blog-content pre code {
          background: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  );
}

