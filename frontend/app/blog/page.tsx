import { cookies } from 'next/headers';
import Link from 'next/link';
import BlogCard from '@/components/blog/BlogCard';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import ScrollAnimation from '@/components/common/ScrollAnimation';
import SearchAndFilterClient from '@/components/common/SearchAndFilterClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getBlogs(params: URLSearchParams) {
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
    
    const url = `${API_URL}/blogs?${params.toString()}`;
    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    });
    
    if (!response.ok) {
      return { blogs: [], pagination: null };
    }
    
    const data = await response.json();
    return {
      blogs: data.data?.blogs || [],
      pagination: data.data?.pagination || null
    };
  } catch (error) {
    return { blogs: [], pagination: null };
  }
}

async function getFeaturedBlogs() {
  const params = new URLSearchParams();
  params.set('limit', '3');
  params.set('sort', '-views');
  return getBlogs(params);
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const hasSearchParams = params.search || params.category || params.tag || params.page;
  
  if (hasSearchParams) {
    const searchParamsObj = new URLSearchParams();
    if (typeof params.search === 'string' && params.search) {
      searchParamsObj.set('search', params.search);
    }
    if (typeof params.category === 'string' && params.category) {
      searchParamsObj.set('category', params.category);
    }
    if (typeof params.tag === 'string' && params.tag) {
      searchParamsObj.set('tag', params.tag);
    }
    const page = typeof params.page === 'string' 
      ? Number(params.page) 
      : Array.isArray(params.page) 
        ? Number(params.page[0]) 
        : 1;
    searchParamsObj.set('page', (page || 1).toString());
    searchParamsObj.set('limit', '12');
    
    const result = await getBlogs(searchParamsObj);
    const blogs = result.blogs || [];
    const pagination = result.pagination;

    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <ScrollAnimation delay={0} direction="up" duration={0.8}>
            <div className="text-center mb-16">
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-purple-600 mb-6 shadow-2xl">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
                بلاگ و مقالات
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
                آخرین مقالات، نکات و ترفندها در زمینه آموزش و فناوری
              </p>
            </div>
          </ScrollAnimation>

          {/* Search and Filter */}
          <div className="mb-12">
            <SearchAndFilterClient />
          </div>

          {/* Blog List */}
          <section>
            {blogs.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex p-8 rounded-full bg-muted mb-8">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-black mb-3">مقاله‌ای یافت نشد</h3>
                <p className="text-muted-foreground text-xl mb-8 font-medium">فیلترهای خود را تغییر دهید</p>
                <Link href="/blog">
                  <Button variant="outline" size="lg">
                    بازگشت به صفحه اصلی بلاگ
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                  {blogs.map((blog: any, index: number) => (
                    <BlogCard key={blog._id} blog={blog} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-12">
                    {pagination.hasPrevPage && (
                      <Link href={`/blog?page=${pagination.currentPage - 1}${params.search ? `&search=${params.search}` : ''}${params.category ? `&category=${params.category}` : ''}`}>
                        <Button variant="outline">
                          قبلی
                        </Button>
                      </Link>
                    )}
                    <span className="text-muted-foreground font-semibold">
                      صفحه {pagination.currentPage} از {pagination.totalPages}
                    </span>
                    {pagination.hasNextPage && (
                      <Link href={`/blog?page=${pagination.currentPage + 1}${params.search ? `&search=${params.search}` : ''}${params.category ? `&category=${params.category}` : ''}`}>
                        <Button variant="outline">
                          بعدی
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    );
  }

  // Default view - get all blogs
  const allBlogsParams = new URLSearchParams();
  allBlogsParams.set('limit', '12');
  allBlogsParams.set('sort', '-publishedAt');
  const allBlogsResult = await getBlogs(allBlogsParams);
  const allBlogs = allBlogsResult.blogs || [];
  const allBlogsPagination = allBlogsResult.pagination;

  // Get featured blogs
  const featured = await getFeaturedBlogs();
  const featuredBlogs = featured.blogs || [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="container mx-auto px-4 py-10 md:py-16 relative z-10">
        {/* Hero Section */}
        <ScrollAnimation delay={0} direction="up" duration={0.8}>
          <div className="text-center mb-20">
            <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-purple-600 mb-8 shadow-2xl group hover:scale-110 hover:rotate-6 transition-all duration-500">
              <BookOpen className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-foreground via-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
              بلاگ و مقالات
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              آخرین مقالات، نکات و ترفندها در زمینه آموزش و فناوری
            </p>
          </div>
        </ScrollAnimation>

        {/* Search and Filter */}
        <div className="mb-16">
          <SearchAndFilterClient />
        </div>

        {/* Featured Blogs */}
        {featuredBlogs.length > 0 && (
          <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
            <section className="mb-20">
              <div className="flex items-center gap-5 mb-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/40 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
                  <div className="relative p-5 bg-gradient-to-br from-primary via-indigo-600 to-purple-600 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform duration-500 border-2 border-white/20">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 leading-tight">
                    مقالات پربازدید
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground font-medium">
                    محبوب‌ترین مقالات ما
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {featuredBlogs.map((blog: any, index: number) => (
                  <BlogCard key={blog._id} blog={blog} index={index} />
                ))}
              </div>
            </section>
          </ScrollAnimation>
        )}

        {/* All Blogs */}
        <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
          <section>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/40 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse"></div>
                  <div className="relative p-5 bg-gradient-to-br from-primary via-indigo-600 to-purple-600 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform duration-500 border-2 border-white/20">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 leading-tight">
                    همه مقالات
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground font-medium">
                    مجموعه کامل مقالات و محتوا
                  </p>
                </div>
              </div>
            </div>
            {allBlogs.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex p-8 rounded-full bg-muted mb-8">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-black mb-3">هنوز مقاله‌ای وجود ندارد</h3>
                <p className="text-muted-foreground text-xl font-medium">
                  مقالات جدید به زودی اضافه می‌شوند
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                  {allBlogs.map((blog: any, index: number) => (
                    <BlogCard key={blog._id} blog={blog} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {allBlogsPagination && allBlogsPagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-12">
                    {allBlogsPagination.hasPrevPage && (
                      <Link href={`/blog?page=${allBlogsPagination.currentPage - 1}`}>
                        <Button variant="outline">
                          قبلی
                        </Button>
                      </Link>
                    )}
                    <span className="text-muted-foreground font-semibold">
                      صفحه {allBlogsPagination.currentPage} از {allBlogsPagination.totalPages}
                    </span>
                    {allBlogsPagination.hasNextPage && (
                      <Link href={`/blog?page=${allBlogsPagination.currentPage + 1}`}>
                        <Button variant="outline">
                          بعدی
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </ScrollAnimation>
      </main>
    </div>
  );
}

