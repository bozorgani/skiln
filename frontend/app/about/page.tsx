'use client';

import { 
  Target, Rocket, Heart, Shield, Award, Users, GraduationCap, 
  BookOpen, TrendingUp, Globe, Sparkles, Star, CheckCircle2,
  Lightbulb, Zap, Crown, Gem, Infinity, ArrowRight, Trophy,
  Code, Brain, Cpu, Database, Cloud, GitBranch, Layers, 
  Terminal, Bot, Network, Code2, Sparkles as SparklesIcon
} from 'lucide-react';
import ScrollAnimation from '@/components/common/ScrollAnimation';
import RevealOnScroll from '@/components/common/RevealOnScroll';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import MagneticButton from '@/components/common/MagneticButton';

const stats = [
  { icon: GraduationCap, value: '15,000+', label: 'دانشجوی فعال', color: 'from-blue-500 to-cyan-500', delay: 0 },
  { icon: Code, value: '800+', label: 'دوره برنامه‌نویسی و AI', color: 'from-purple-500 to-pink-500', delay: 0.1 },
  { icon: Users, value: '300+', label: 'مدرس متخصص', color: 'from-green-500 to-emerald-500', delay: 0.2 },
  { icon: Trophy, value: '99%', label: 'رضایت کاربران', color: 'from-orange-500 to-red-500', delay: 0.3 },
];

const values = [
  {
    icon: Code2,
    title: 'تمرکز بر برنامه‌نویسی و AI',
    description: 'در Skiln، ما به طور تخصصی بر آموزش برنامه‌نویسی و هوش مصنوعی تمرکز داریم. تمام دوره‌های ما توسط متخصصان باتجربه طراحی شده‌اند تا شما را به یک برنامه‌نویس حرفه‌ای تبدیل کنند.',
    color: 'from-blue-500 to-cyan-500',
    delay: 0,
  },
  {
    icon: Rocket,
    title: 'آموزش‌های به‌روز و کاربردی',
    description: 'ما همیشه آخرین تکنولوژی‌ها و فریمورک‌های روز دنیا را در دوره‌های خود پوشش می‌دهیم. از React و Node.js گرفته تا Machine Learning و Deep Learning.',
    color: 'from-purple-500 to-pink-500',
    delay: 0.1,
  },
  {
    icon: Heart,
    title: 'پشتیبانی 24/7',
    description: 'تیم پشتیبانی Skiln همیشه در کنار شماست. هر سوالی درباره کد، پروژه یا مسیر یادگیری داشته باشید، ما آماده کمک هستیم.',
    color: 'from-pink-500 to-rose-500',
    delay: 0.2,
  },
  {
    icon: Shield,
    title: 'امنیت و حریم خصوصی',
    description: 'اطلاعات و پروژه‌های شما در Skiln با بالاترین استانداردهای امنیتی محافظت می‌شوند. ما به حریم خصوصی شما احترام می‌گذاریم.',
    color: 'from-green-500 to-emerald-500',
    delay: 0.3,
  },
  {
    icon: Award,
    title: 'گواهینامه معتبر',
    description: 'پس از اتمام هر دوره، گواهینامه معتبر Skiln را دریافت می‌کنید که می‌توانید در رزومه و پروفایل لینکدین خود قرار دهید.',
    color: 'from-yellow-500 to-orange-500',
    delay: 0.4,
  },
  {
    icon: Brain,
    title: 'یادگیری مبتنی بر پروژه',
    description: 'در Skiln، شما فقط تئوری یاد نمی‌گیرید. هر دوره شامل پروژه‌های واقعی است که می‌توانید در پورتفولیوی خود قرار دهید.',
    color: 'from-indigo-500 to-purple-500',
    delay: 0.5,
  },
];

// Server icon component
const Server = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const technologies = [
  { name: 'Python & AI', icon: Brain, color: 'from-yellow-500 to-orange-500' },
  { name: 'JavaScript & React', icon: Code, color: 'from-blue-500 to-cyan-500' },
  { name: 'Node.js & Backend', icon: Server, color: 'from-green-500 to-emerald-500' },
  { name: 'Machine Learning', icon: Cpu, color: 'from-purple-500 to-pink-500' },
  { name: 'Deep Learning', icon: Network, color: 'from-indigo-500 to-purple-500' },
  { name: 'Data Science', icon: Database, color: 'from-red-500 to-pink-500' },
  { name: 'Cloud Computing', icon: Cloud, color: 'from-blue-500 to-indigo-500' },
  { name: 'DevOps', icon: GitBranch, color: 'from-orange-500 to-red-500' },
];

const team = [
  {
    name: 'تیم توسعه Skiln',
    role: 'متخصصان برنامه‌نویسی و AI',
    description: 'تیمی از بهترین برنامه‌نویسان و متخصصان هوش مصنوعی که با عشق و علاقه به آموزش می‌پردازند',
    avatar: '👨‍💻',
    color: 'from-blue-500 to-cyan-500',
    delay: 0,
  },
  {
    name: 'مدرسین حرفه‌ای',
    role: 'استادان با تجربه',
    description: 'مدرسین ما سال‌ها تجربه در صنعت دارند و پروژه‌های واقعی انجام داده‌اند',
    avatar: '👩‍🏫',
    color: 'from-purple-500 to-pink-500',
    delay: 0.1,
  },
  {
    name: 'تیم پشتیبانی',
    role: 'پشتیبانی فنی',
    description: 'همیشه آماده کمک به شما در مسیر یادگیری برنامه‌نویسی و هوش مصنوعی',
    avatar: '👨‍💼',
    color: 'from-green-500 to-emerald-500',
    delay: 0.2,
  },
  {
    name: 'تیم محتوا',
    role: 'تولید محتوای آموزشی',
    description: 'تولید محتوای با کیفیت و به‌روز برای یادگیری بهتر شما',
    avatar: '👩‍🎨',
    color: 'from-orange-500 to-red-500',
    delay: 0.3,
  },
];

const milestones = [
  {
    year: '2020',
    title: 'شروع Skiln',
    description: 'تاسیس Skiln با هدف آموزش تخصصی برنامه‌نویسی و هوش مصنوعی به فارسی‌زبانان',
    icon: SparklesIcon,
    color: 'from-blue-500 to-cyan-500',
    delay: 0,
  },
  {
    year: '2021',
    title: '100 دوره برنامه‌نویسی',
    description: 'رسیدن به 100 دوره تخصصی در زمینه‌های مختلف برنامه‌نویسی',
    icon: Code,
    color: 'from-purple-500 to-pink-500',
    delay: 0.1,
  },
  {
    year: '2022',
    title: '5000 دانشجوی فعال',
    description: 'جذب بیش از 5000 دانشجوی فعال در دوره‌های برنامه‌نویسی و AI',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
    delay: 0.2,
  },
  {
    year: '2023',
    title: 'راه‌اندازی دوره‌های AI',
    description: 'شروع دوره‌های تخصصی هوش مصنوعی، Machine Learning و Deep Learning',
    icon: Brain,
    color: 'from-orange-500 to-red-500',
    delay: 0.3,
  },
  {
    year: '2024',
    title: '15,000+ دانشجو',
    description: 'رسیدن به بیش از 15,000 دانشجوی فعال و 800+ دوره آموزشی',
    icon: Trophy,
    color: 'from-indigo-500 to-purple-500',
    delay: 0.4,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            name: 'Skiln',
            url: 'https://www.skiln.ir',
            logo: 'https://www.skiln.ir/icon-512x512.png',
            description: 'Skiln - پلتفرم تخصصی آموزش برنامه‌نویسی و هوش مصنوعی. یادگیری برنامه‌نویسی، Machine Learning، Deep Learning و تکنولوژی‌های روز دنیا با بهترین مدرسان.',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'IR',
            },
            educationalCredentialAwarded: 'Certificate',
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'دوره‌های برنامه‌نویسی و هوش مصنوعی',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Course',
                    name: 'دوره‌های برنامه‌نویسی',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Course',
                    name: 'دوره‌های هوش مصنوعی',
                  },
                },
              ],
            },
          }),
        }}
      />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <main className="container mx-auto px-4 py-10 md:py-16 relative z-10">
        {/* Hero Section */}
        <ScrollAnimation delay={0} direction="up" duration={0.8}>
          <section className="text-center mb-20 md:mb-32">
            <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-purple-600 mb-8 shadow-2xl animate-pulse">
              <Code className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              درباره Skiln
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium mb-4">
              پلتفرم تخصصی آموزش <span className="font-bold text-primary">برنامه‌نویسی</span> و <span className="font-bold text-primary">هوش مصنوعی</span>
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              در Skiln، ما معتقدیم که هر کسی می‌تواند یک برنامه‌نویس حرفه‌ای شود. با دوره‌های تخصصی ما، از مبتدی تا حرفه‌ای، در مسیر یادگیری برنامه‌نویسی و هوش مصنوعی همراه شما هستیم.
            </p>
          </section>
        </ScrollAnimation>

        {/* Statistics Section */}
        <section className="mb-20 md:mb-32">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <RevealOnScroll key={index} delay={stat.delay} direction="scale" distance={20} duration={0.6}>
                <Card className="relative overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-700 group hover:shadow-2xl hover:-translate-y-3 hover:scale-105">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity duration-700`}></div>
                  <CardContent className="p-8 md:p-10 relative">
                    <div className={`inline-flex p-5 rounded-3xl bg-gradient-to-br ${stat.color} mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                      <stat.icon className="h-8 w-8 md:h-10 md:w-10 text-white" />
                    </div>
                    <div className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent">
                      <AnimatedCounter value={stat.value} duration={2000} />
                    </div>
                    <div className="text-base md:text-lg text-muted-foreground font-bold">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* Our Story Section */}
        <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
          <section className="mb-20 md:mb-32">
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 overflow-hidden relative group hover:shadow-2xl transition-all duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardContent className="p-10 md:p-16 lg:p-20 relative z-10">
                <div className="text-center mb-12">
                  <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    داستان Skiln
                  </h2>
                </div>
                <div className="max-w-4xl mx-auto space-y-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
                  <p>
                    <strong className="text-foreground">Skiln</strong> در سال 2020 با یک رویای بزرگ متولد شد: <span className="font-bold text-foreground">دموکراتیک کردن آموزش برنامه‌نویسی و هوش مصنوعی</span>. ما معتقد بودیم که هر کسی، در هر کجای دنیا، باید به آموزش با کیفیت در زمینه برنامه‌نویسی و AI دسترسی داشته باشد.
                  </p>
                  <p>
                    امروز، <strong className="text-primary">Skiln</strong> به یک پلتفرم پیشرفته تبدیل شده است که بیش از <span className="font-bold text-primary">15,000 دانشجو</span> و <span className="font-bold text-primary">300 مدرس متخصص</span> را در خود جای داده است. ما با ارائه بیش از <span className="font-bold text-primary">800 دوره آموزشی</span> در زمینه‌های مختلف برنامه‌نویسی (Python, JavaScript, React, Node.js) و هوش مصنوعی (Machine Learning, Deep Learning, Data Science)، به یکی از بزرگ‌ترین پلتفرم‌های آموزش آنلاین در منطقه تبدیل شده‌ایم.
                  </p>
                  <p>
                    در <strong className="text-primary">Skiln</strong>، ما فقط دوره ارائه نمی‌دهیم. ما یک جامعه از برنامه‌نویسان و علاقه‌مندان به AI ساختیم که با هم یاد می‌گیرند، پروژه می‌سازند و رشد می‌کنند. هر دوره شامل پروژه‌های واقعی است که می‌توانید در پورتفولیوی خود قرار دهید و از آن برای یافتن شغل استفاده کنید.
                  </p>
                  <p>
                    اما این فقط شروع است. ما به آینده نگاه می‌کنیم و قصد داریم با استفاده از فناوری‌های نوین و تکنیک‌های پیشرفته آموزش، تجربه یادگیری برنامه‌نویسی و هوش مصنوعی را به سطح جدیدی برسانیم.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </ScrollAnimation>

        {/* Mission & Vision Section */}
        <section className="mb-20 md:mb-32">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <RevealOnScroll delay={0} direction="right" duration={0.8}>
              <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 group h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl"></div>
                <CardContent className="p-8 md:p-10 relative">
                  <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black mb-4 group-hover:text-primary transition-colors duration-300">
                    ماموریت Skiln
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    ماموریت ما این است که با ارائه آموزش با کیفیت و تخصصی در زمینه <strong className="text-foreground">برنامه‌نویسی</strong> و <strong className="text-foreground">هوش مصنوعی</strong>، به هر فردی کمک کنیم تا به یک برنامه‌نویس حرفه‌ای تبدیل شود. ما معتقدیم که برنامه‌نویسی یک مهارت ضروری در دنیای امروز است و باید در دسترس همه باشد.
                  </p>
                </CardContent>
              </Card>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1} direction="left" duration={0.8}>
              <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 group h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl"></div>
                <CardContent className="p-8 md:p-10 relative">
                  <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500">
                    <Rocket className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black mb-4 group-hover:text-primary transition-colors duration-300">
                    چشم‌انداز Skiln
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    چشم‌انداز ما تبدیل شدن به <strong className="text-foreground">پیشروترین پلتفرم آموزش برنامه‌نویسی و هوش مصنوعی</strong> در منطقه است. ما می‌خواهیم با استفاده از فناوری‌های نوین، محتوای با کیفیت و روش‌های آموزشی پیشرفته، انقلابی در آموزش برنامه‌نویسی و AI ایجاد کنیم و هزاران برنامه‌نویس حرفه‌ای تربیت کنیم.
                  </p>
                </CardContent>
              </Card>
            </RevealOnScroll>
          </div>
        </section>

        {/* Technologies We Teach */}
        <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
          <section className="mb-20 md:mb-32 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-purple-500/5 rounded-[3rem] -z-10"></div>
            <div className="p-10 md:p-16 lg:p-20 rounded-[3rem]">
              <div className="text-center mb-16">
                <ScrollAnimation delay={0} direction="scale" duration={0.8}>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
                    تکنولوژی‌هایی که در Skiln یاد می‌گیرید
                  </h2>
                  <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
                    از مبتدی تا حرفه‌ای، تمام تکنولوژی‌های روز دنیا
                  </p>
                </ScrollAnimation>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6 md:gap-8">
                {technologies.map((tech, index) => (
                  <RevealOnScroll key={index} delay={index * 0.1} direction="up" duration={0.6}>
                    <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 group text-center">
                      <div className={`absolute inset-0 bg-gradient-to-br ${tech.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-3xl`}></div>
                      <CardContent className="p-6 md:p-8 relative">
                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${tech.color} mb-4 shadow-xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500`}>
                          <tech.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-base font-bold group-hover:text-primary transition-colors duration-300">
                          {tech.name}
                        </h3>
                      </CardContent>
                    </Card>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </section>
        </ScrollAnimation>

        {/* Values Section */}
        <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
          <section className="mb-20 md:mb-32 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-purple-500/5 rounded-[3rem] -z-10"></div>
            <div className="p-10 md:p-16 lg:p-20 rounded-[3rem]">
              <div className="text-center mb-16">
                <ScrollAnimation delay={0} direction="scale" duration={0.8}>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
                    ارزش‌های Skiln
                  </h2>
                  <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
                    اصولی که ما را راهنمایی می‌کنند
                  </p>
                </ScrollAnimation>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {values.map((value, index) => (
                  <RevealOnScroll key={index} delay={value.delay} direction="up" duration={0.6}>
                    <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 group h-full">
                      <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-3xl`}></div>
                      <CardContent className="p-8 md:p-10 relative h-full flex flex-col">
                        <div className={`inline-flex p-5 rounded-3xl bg-gradient-to-br ${value.color} mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500`}>
                          <value.icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors duration-300">
                          {value.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed flex-grow">
                          {value.description}
                        </p>
                      </CardContent>
                    </Card>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </section>
        </ScrollAnimation>

        {/* Team Section */}
        <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
          <section className="mb-20 md:mb-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
                تیم Skiln
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                افرادی که این رویا را به واقعیت تبدیل کردند
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              {team.map((member, index) => (
                <RevealOnScroll key={index} delay={member.delay} direction="scale" duration={0.6}>
                  <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 group text-center">
                    <div className={`absolute inset-0 bg-gradient-to-br ${member.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-3xl`}></div>
                    <CardContent className="p-8 md:p-10 relative">
                      <div className={`inline-flex p-6 rounded-full bg-gradient-to-br ${member.color} mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 text-6xl`}>
                        {member.avatar}
                      </div>
                      <h3 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-primary font-bold mb-3">{member.role}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {member.description}
                      </p>
                    </CardContent>
                  </Card>
                </RevealOnScroll>
              ))}
            </div>
          </section>
        </ScrollAnimation>

        {/* Milestones Section */}
        <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
          <section className="mb-20 md:mb-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
                نقاط عطف Skiln
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                سفر ما از ابتدا تا امروز
              </p>
            </div>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-indigo-600 to-purple-600 hidden md:block transform translate-x-1/2"></div>
              
              <div className="space-y-12 md:space-y-16">
                {milestones.map((milestone, index) => (
                  <RevealOnScroll key={index} delay={milestone.delay} direction={index % 2 === 0 ? 'right' : 'left'} duration={0.8}>
                    <div className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                      <div className="flex-1">
                        <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 group">
                          <div className={`absolute inset-0 bg-gradient-to-br ${milestone.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-3xl`}></div>
                          <CardContent className="p-8 md:p-10 relative">
                            <div className="flex items-center gap-4 mb-4">
                              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${milestone.color} shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                <milestone.icon className="h-6 w-6 text-white" />
                              </div>
                              <span className="text-3xl font-black text-primary">{milestone.year}</span>
                            </div>
                            <h3 className="text-2xl font-black mb-3 group-hover:text-primary transition-colors duration-300">
                              {milestone.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {milestone.description}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="hidden md:block w-4 h-4 rounded-full bg-gradient-to-br from-primary to-indigo-600 border-4 border-background shadow-xl z-10"></div>
                      <div className="flex-1"></div>
                    </div>
                  </RevealOnScroll>
                ))}
              </div>
            </div>
          </section>
        </ScrollAnimation>

        {/* CTA Section */}
        <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
          <section className="mb-20 md:mb-32">
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 overflow-hidden relative group hover:shadow-2xl transition-all duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardContent className="p-16 md:p-24 relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                  <ScrollAnimation delay={0.1} direction="scale" duration={0.8}>
                    <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Rocket className="h-12 w-12 text-white" />
                    </div>
                  </ScrollAnimation>
                  <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                      به Skiln بپیوندید
                    </h2>
                  </ScrollAnimation>
                  <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
                    <p className="text-2xl md:text-3xl text-muted-foreground mb-6 leading-relaxed font-medium">
                      آماده شروع سفر یادگیری برنامه‌نویسی و هوش مصنوعی هستید؟
                    </p>
                    <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
                      در Skiln، ما شما را از مبتدی تا حرفه‌ای همراهی می‌کنیم. با دوره‌های تخصصی ما، پروژه‌های واقعی بسازید و به یک برنامه‌نویس حرفه‌ای تبدیل شوید.
                    </p>
                  </ScrollAnimation>
                  <ScrollAnimation delay={0.4} direction="up" duration={0.8}>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                      <Link href="/">
                        <MagneticButton
                          size="lg" 
                          intensity={0.15}
                          className="text-xl px-14 h-16 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/90 hover:via-indigo-600/90 hover:to-purple-600/90 shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-500 border-2 border-white/30 group/btn"
                        >
                          <span className="font-black">مشاهده دوره‌های برنامه‌نویسی</span>
                          <ArrowRight className="h-6 w-6 mr-3 transition-transform duration-300 group-hover/btn:translate-x-3" />
                        </MagneticButton>
                      </Link>
                      <Link href="/contact">
                        <MagneticButton
                          size="lg" 
                          variant="outline"
                          intensity={0.15}
                          className="text-xl px-14 h-16 border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-500 font-black"
                        >
                          <span>تماس با ما</span>
                        </MagneticButton>
                      </Link>
                    </div>
                  </ScrollAnimation>
                </div>
              </CardContent>
            </Card>
          </section>
        </ScrollAnimation>
      </main>
    </div>
  );
}
