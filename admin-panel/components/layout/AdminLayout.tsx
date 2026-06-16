'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  DollarSign, 
  Ticket, 
  MessageSquare, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Sparkles,
  Sun,
  Moon,
  Laptop2,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

const navigation = [
  { name: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { name: 'کاربران', href: '/users', icon: Users },
  { name: 'دوره‌ها', href: '/courses', icon: BookOpen },
  { name: 'وبلاگ', href: '/blog', icon: FileText },
  { name: 'مالی', href: '/finance', icon: DollarSign },
  { name: 'تیکت‌ها', href: '/tickets', icon: Ticket },
  { name: 'پیام‌ها', href: '/contact-messages', icon: MessageSquare },
  { name: 'نظرات', href: '/feedback', icon: MessageSquare },
  { name: 'دسته‌بندی‌ها', href: '/categories', icon: Tag },
  { name: 'گزارش‌ها', href: '/reports', icon: BarChart3 },
  { name: 'تنظیمات', href: '/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme, systemTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize user from localStorage if context doesn't have it yet
  useEffect(() => {
    if (!user && !loading && !initialized && typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('[AdminLayout] Initializing user from localStorage:', userData);
          if (userData.role === 'admin') {
            setUser(userData);
            setInitialized(true);
          }
        } catch (e) {
          console.error('[AdminLayout] Error parsing saved user:', e);
        }
      }
      setInitialized(true);
    }
  }, [user, loading, initialized, setUser]);

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    // Don't redirect while loading - give it more time
    if (loading) {
      console.log('[AdminLayout] Still loading, waiting...');
      return;
    }
    
    // Add a longer delay to ensure state is fully updated and checkAuth completes
    const timeoutId = setTimeout(() => {
      // Check if user exists in localStorage as fallback
      let finalUser = user;
      if (!finalUser && typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            finalUser = JSON.parse(savedUser);
            console.log('[AdminLayout] Found user in localStorage, using it');
          } catch (e) {
            console.error('[AdminLayout] Error parsing saved user:', e);
          }
        }
      }
      
      // Only redirect if user is not authenticated or not admin
      if (!finalUser || finalUser.role !== 'admin') {
        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          console.log('[AdminLayout] ❌ Redirecting to login');
          console.log('  - user from context:', user);
          console.log('  - user from localStorage:', finalUser);
          console.log('  - role:', finalUser?.role);
          console.log('  - token in localStorage:', typeof window !== 'undefined' ? (localStorage.getItem('token') ? 'YES' : 'NO') : 'N/A');
          console.log('  - localStorage user:', typeof window !== 'undefined' ? (localStorage.getItem('user') ? 'YES' : 'NO') : 'N/A');
          // Use window.location for reliable redirect
          window.location.href = '/login';
        }
      } else {
        console.log('[AdminLayout] ✅ User authenticated, role =', finalUser.role);
      }
    }, 1000); // Wait 1 second after loading finishes to give checkAuth time
    
    return () => clearTimeout(timeoutId);
  }, [user, loading]);

  // Use state to avoid hydration mismatch
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  
  // Update currentUser when user changes or from localStorage
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else if (typeof window !== 'undefined' && !loading) {
      // Only check localStorage on client side and after loading
      try {
        const saved = localStorage.getItem('user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.role === 'admin') {
            setCurrentUser(parsed);
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }, [user, loading]);

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="mt-6 text-muted-foreground font-medium">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    console.log('[AdminLayout] No user or not admin, returning null');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)} 
        />
        <div 
          className={`fixed inset-y-0 right-0 w-full max-w-[85vw] sm:w-80 bg-sidebar-background border-l border-sidebar-border shadow-2xl transform transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gradient">پنل مدیریت</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl hover:bg-accent"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 animate-slide-in-right ${
                      isActive
                        ? 'bg-primary/10 text-primary border-2 border-primary/30 shadow-glow-sm scale-[1.02] font-semibold'
                        : 'hover:bg-accent hover:scale-[1.01] text-muted-foreground hover:text-foreground'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''} transition-transform group-hover:scale-110`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-accent/50">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {currentUser.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{currentUser.name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email || currentUser.phoneNumber || ''}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all duration-300"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 ml-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:border-l border-sidebar-border bg-sidebar-background backdrop-blur-xl z-40">
          <div className="flex flex-col flex-grow pt-6 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 mb-8">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-sm">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">پنل مدیریت</h1>
                <p className="text-xs text-muted-foreground">LMS Bozorgani</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 animate-slide-in-right ${
                      isActive
                        ? 'bg-primary/10 text-primary border-2 border-primary/30 shadow-glow-sm scale-[1.02] font-semibold'
                        : 'hover:bg-accent hover:scale-[1.01] text-muted-foreground hover:text-foreground'
                    }`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''} transition-transform group-hover:scale-110`} />
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <div className="mr-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="px-4 mt-auto pb-4">
              <div className="border-t border-sidebar-border pt-4">
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors duration-300">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {currentUser.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{currentUser.name || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser.email || currentUser.phoneNumber || ''}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all duration-300"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  خروج
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:pr-72 flex-1 w-full">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 glass border-b border-border/50 backdrop-blur-xl">
            <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 h-14 sm:h-16">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-xl hover:bg-accent"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
                {/* Search Bar */}
                <div className="hidden md:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-accent/50 border border-border/50 hover:border-primary/30 transition-colors duration-300 w-48 lg:w-64">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="جستجو..."
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                </div>

                {/* Theme Switcher - Mobile (icon only) */}
                <div className="flex items-center md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-accent h-9 w-9"
                    aria-label="تغییر تم"
                    onClick={() =>
                      setTheme(theme === 'light' || (theme === 'system' && systemTheme === 'dark') ? 'dark' : 'light')
                    }
                  >
                    {theme === 'light' || (theme === 'system' && systemTheme === 'light') ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Theme Switcher - Desktop */}
                <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-accent/40 border border-border/60">
                  <span className="hidden lg:inline text-xs font-medium text-muted-foreground">
                    تم پنل
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="icon"
                      className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                        theme === 'light'
                          ? 'bg-background text-yellow-500 shadow-sm'
                          : 'hover:bg-accent'
                      }`}
                      aria-label="تم روشن"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="icon"
                      className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-background text-blue-500 shadow-sm'
                          : 'hover:bg-accent'
                      }`}
                      aria-label="تم تیره"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="icon"
                      className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                        theme === 'system'
                          ? 'bg-background text-emerald-500 shadow-sm'
                          : 'hover:bg-accent'
                      }`}
                      aria-label="مطابق سیستم"
                      onClick={() => setTheme('system')}
                    >
                      <Laptop2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-accent relative h-9 w-9 sm:h-10 sm:w-10"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-destructive rounded-full"></span>
                </Button>

                {/* User Info */}
                <div className="hidden sm:flex items-center gap-2 lg:gap-3 px-2 sm:px-3 py-2 rounded-xl bg-accent/50">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow-sm">
                    <span className="text-white font-semibold text-[10px] sm:text-xs">
                      {currentUser.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden lg:inline">{currentUser.name || 'Admin'}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-3 sm:p-4 lg:p-6 xl:p-8 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
