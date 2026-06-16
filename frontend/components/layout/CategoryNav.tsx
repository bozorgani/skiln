'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Code, 
  Palette, 
  Briefcase, 
  Megaphone, 
  Camera, 
  Music, 
  Grid3x3
} from 'lucide-react';
import { useState, useEffect } from 'react';

const categories = [
  { 
    id: 'all', 
    name: 'همه', 
    icon: Grid3x3, 
    value: '',
    color: 'from-gray-500 to-gray-600'
  },
  { 
    id: 'General', 
    name: 'عمومی', 
    icon: Grid3x3, 
    value: 'General',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'Programming', 
    name: 'برنامه‌نویسی', 
    icon: Code, 
    value: 'Programming',
    color: 'from-green-500 to-green-600'
  },
  { 
    id: 'Design', 
    name: 'طراحی', 
    icon: Palette, 
    value: 'Design',
    color: 'from-pink-500 to-pink-600'
  },
  { 
    id: 'Business', 
    name: 'کسب‌وکار', 
    icon: Briefcase, 
    value: 'Business',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    id: 'Marketing', 
    name: 'بازاریابی', 
    icon: Megaphone, 
    value: 'Marketing',
    color: 'from-orange-500 to-orange-600'
  },
  { 
    id: 'Photography', 
    name: 'عکاسی', 
    icon: Camera, 
    value: 'Photography',
    color: 'from-red-500 to-red-600'
  },
  { 
    id: 'Music', 
    name: 'موسیقی', 
    icon: Music, 
    value: 'Music',
    color: 'from-indigo-500 to-indigo-600'
  },
];

export default function CategoryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [scrollPosition, setScrollPosition] = useState(0);
  const activeCategory = searchParams?.get('category') || '';

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Only show on homepage
  if (pathname !== '/') {
    return null;
  }

  const handleCategoryClick = (categoryValue: string) => {
    const params = new URLSearchParams();
    const currentSearch = searchParams?.get('search') || '';
    const currentLevel = searchParams?.get('level') || '';
    
    if (currentSearch) params.set('search', currentSearch);
    if (currentLevel) params.set('level', currentLevel);
    if (categoryValue) params.set('category', categoryValue);
    params.set('page', '1');
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  return (
    <nav className={`sticky top-16 md:top-20 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 transition-all duration-300 ${
      scrollPosition > 100 ? 'shadow-md' : ''
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-3 md:py-4 scrollbar-hide scroll-smooth">
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = category.value === activeCategory || 
                (category.id === 'all' && !activeCategory);
              
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleCategoryClick(category.value)}
                  className={`
                    relative group transition-all duration-300 min-w-max
                    ${isActive 
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg hover:shadow-xl` 
                      : 'hover:bg-primary/10 hover:text-primary'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 ml-2 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-medium whitespace-nowrap">{category.name}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

