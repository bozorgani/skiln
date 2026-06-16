'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, User, LogOut, LayoutDashboard, Menu, X, GraduationCap, ShoppingCart, Search, Info, MessageCircle, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchQuery.trim());
      params.set('page', '1');
      router.push(`/?${params.toString()}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link 
            href="/" 
            className="flex items-center gap-2 group transition-all duration-300 hover:scale-105" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative p-2 bg-gradient-to-br from-primary to-indigo-600 rounded-lg shadow-lg group-hover:shadow-primary/50 transition-all duration-300">
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
                Skiln
              </span>
              <span className="text-base font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent sm:hidden">
                Skiln
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full group">
              <div className="absolute inset-0 bg-primary/5 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="جستجوی دوره‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10 border-2 focus:border-primary transition-all duration-300 bg-background/50 backdrop-blur-sm"
                />
              </div>
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link href="/about">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative group transition-all duration-300 hover:bg-primary/10 hover:text-primary"
              >
                <Info className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:scale-110" />
                <span className="font-medium hidden lg:inline">درباره ما</span>
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative group transition-all duration-300 hover:bg-primary/10 hover:text-primary"
              >
                <MessageCircle className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:scale-110" />
                <span className="font-medium hidden lg:inline">تماس با ما</span>
              </Button>
            </Link>
            {loading ? (
              <div className="h-9 w-9 animate-pulse bg-muted rounded-lg" />
            ) : user ? (
              <>
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative group transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  >
                    <GraduationCap className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">دوره‌ها</span>
                  </Button>
                </Link>
                <Link href="/blog">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative group transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  >
                    <FileText className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">بلاگ</span>
                  </Button>
                </Link>
                <Link href="/checkout">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative group transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  >
                    <ShoppingCart className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">سبد خرید</span>
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg animate-pulse">
                        {itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
                {user.role !== 'admin' && (
                  <Link href="/dashboard">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="relative group transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                    >
                      <LayoutDashboard className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:scale-110" />
                      <span className="font-medium">داشبورد</span>
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm transition-all duration-300 hover:bg-muted">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden lg:inline font-medium">{user.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="relative group transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="hidden lg:inline font-medium">خروج</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="font-medium transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  >
                    ورود
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    size="sm"
                    className="font-medium bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105"
                  >
                    ثبت نام
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl py-4 space-y-2 animate-slide-in-right">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="px-2 mb-4">
              <div className="relative group">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="جستجوی دوره‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10 border-2 focus:border-primary transition-all duration-300"
                />
              </div>
            </form>

            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <Info className="h-4 w-4 ml-2" />
                درباره ما
              </Button>
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <MessageCircle className="h-4 w-4 ml-2" />
                تماس با ما
              </Button>
            </Link>
            {loading ? (
              <div className="h-8 w-8 animate-pulse bg-muted rounded mx-auto" />
            ) : user ? (
              <>
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <GraduationCap className="h-4 w-4 ml-2" />
                    دوره‌ها
                  </Button>
                </Link>
                <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="h-4 w-4 ml-2" />
                    بلاگ
                  </Button>
                </Link>
                <Link href="/checkout" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start relative">
                    <ShoppingCart className="h-4 w-4 ml-2" />
                    سبد خرید
                    {itemCount > 0 && (
                      <span className="mr-auto ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
                {user.role !== 'admin' && (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <LayoutDashboard className="h-4 w-4 ml-2" />
                      داشبورد
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  خروج
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">ورود</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">ثبت نام</Button>
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}


