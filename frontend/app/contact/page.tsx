'use client';

import { useState } from 'react';
import { 
  Mail, Phone, MapPin, Send, MessageCircle, Clock, 
  Sparkles, ArrowRight, CheckCircle2, Loader2,
  Instagram, Twitter, Linkedin, Youtube, Facebook,
  Globe, HeadphonesIcon
} from 'lucide-react';
import ScrollAnimation from '@/components/common/ScrollAnimation';
import RevealOnScroll from '@/components/common/RevealOnScroll';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import MagneticButton from '@/components/common/MagneticButton';
import { useToast } from '@/hooks/use-toast';

const contactInfo = [
  {
    icon: Mail,
    title: 'ایمیل',
    value: 'info@skiln.ir',
    link: 'mailto:info@skiln.ir',
    color: 'from-blue-500 to-cyan-500',
    delay: 0,
  },
  {
    icon: Phone,
    title: 'تلفن',
    value: '021-12345678',
    link: 'tel:+982112345678',
    color: 'from-green-500 to-emerald-500',
    delay: 0.1,
  },
  {
    icon: MapPin,
    title: 'آدرس',
    value: 'تهران، خیابان ولیعصر، پلاک 123',
    link: '#',
    color: 'from-purple-500 to-pink-500',
    delay: 0.2,
  },
  {
    icon: Clock,
    title: 'ساعات کاری',
    value: 'شنبه تا پنج‌شنبه: 9 صبح تا 6 عصر',
    link: '#',
    color: 'from-orange-500 to-red-500',
    delay: 0.3,
  },
];

const socialLinks = [
  {
    icon: Instagram,
    name: 'اینستاگرام',
    link: 'https://instagram.com/skiln',
    color: 'from-pink-500 to-rose-500',
    delay: 0,
  },
  {
    icon: Twitter,
    name: 'توییتر',
    link: 'https://twitter.com/skiln',
    color: 'from-blue-400 to-cyan-500',
    delay: 0.1,
  },
  {
    icon: Linkedin,
    name: 'لینکدین',
    link: 'https://linkedin.com/company/skiln',
    color: 'from-blue-600 to-indigo-600',
    delay: 0.2,
  },
  {
    icon: Youtube,
    name: 'یوتیوب',
    link: 'https://youtube.com/@skiln',
    color: 'from-red-500 to-rose-600',
    delay: 0.3,
  },
  {
    icon: Facebook,
    name: 'فیسبوک',
    link: 'https://facebook.com/skiln',
    color: 'from-blue-600 to-blue-700',
    delay: 0.4,
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    toast({
      title: 'پیام ارسال شد!',
      description: 'پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.',
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              تماس با ما
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              ما همیشه آماده پاسخگویی به سوالات و شنیدن نظرات شما هستیم
            </p>
          </section>
        </ScrollAnimation>

        {/* Contact Form & Info Grid */}
        <section className="mb-20 md:mb-32">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-10">
            {/* Contact Form */}
            <RevealOnScroll delay={0} direction="right" duration={0.8}>
              <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl"></div>
                <CardContent className="p-8 md:p-10 relative">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Send className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                      پیام بفرستید
                    </h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-bold">
                          نام و نام خانوادگی
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="h-12 border-2 focus:border-primary transition-all duration-300"
                          placeholder="نام خود را وارد کنید"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-bold">
                          ایمیل
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="h-12 border-2 focus:border-primary transition-all duration-300"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-base font-bold">
                          شماره تماس
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="h-12 border-2 focus:border-primary transition-all duration-300"
                          placeholder="09123456789"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-base font-bold">
                          موضوع
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="h-12 border-2 focus:border-primary transition-all duration-300"
                          placeholder="موضوع پیام"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-base font-bold">
                        پیام
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="border-2 focus:border-primary transition-all duration-300 resize-none"
                        placeholder="پیام خود را اینجا بنویسید..."
                      />
                    </div>

                    <MagneticButton
                      type="submit"
                      size="lg"
                      intensity={0.15}
                      disabled={isSubmitting}
                      className="w-full text-lg h-14 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/90 hover:via-indigo-600/90 hover:to-purple-600/90 shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all duration-500 border-2 border-white/30 font-black"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                          در حال ارسال...
                        </>
                      ) : (
                        <>
                          <span>ارسال پیام</span>
                          <Send className="h-5 w-5 mr-2" />
                        </>
                      )}
                    </MagneticButton>
                  </form>
                </CardContent>
              </Card>
            </RevealOnScroll>

            {/* Contact Info */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <RevealOnScroll key={index} delay={info.delay} direction="left" duration={0.8}>
                  <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-xl`}></div>
                    <CardContent className="p-6 md:p-8 relative">
                      <div className="flex items-start gap-4">
                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${info.color} shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0`}>
                          <info.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-black mb-2 group-hover:text-primary transition-colors duration-300">
                            {info.title}
                          </h3>
                          {info.link !== '#' ? (
                            <a
                              href={info.link}
                              className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
                            >
                              {info.value}
                            </a>
                          ) : (
                            <p className="text-muted-foreground font-medium">
                              {info.value}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Social Media Section */}
        <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
          <section className="mb-20 md:mb-32">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-indigo-600 bg-clip-text text-transparent mb-6">
                ما را در شبکه‌های اجتماعی دنبال کنید
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                با ما در ارتباط باشید و از آخرین اخبار و دوره‌ها باخبر شوید
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
              {socialLinks.map((social, index) => (
                <RevealOnScroll key={index} delay={social.delay} direction="scale" duration={0.6}>
                  <a
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="border-2 border-border/50 hover:border-primary/50 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 text-center h-full">
                      <div className={`absolute inset-0 bg-gradient-to-br ${social.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-xl`}></div>
                      <CardContent className="p-8 relative">
                        <div className={`inline-flex p-5 rounded-3xl bg-gradient-to-br ${social.color} mb-4 shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                          <social.icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="font-black text-lg group-hover:text-primary transition-colors duration-300">
                          {social.name}
                        </h3>
                      </CardContent>
                    </Card>
                  </a>
                </RevealOnScroll>
              ))}
            </div>
          </section>
        </ScrollAnimation>

        {/* FAQ Section */}
        <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
          <section className="mb-20 md:mb-32">
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 overflow-hidden relative group hover:shadow-2xl transition-all duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardContent className="p-10 md:p-16 lg:p-20 relative z-10">
                <div className="text-center mb-12">
                  <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <HeadphonesIcon className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    سوالات متداول
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <RevealOnScroll delay={0} direction="up" duration={0.6}>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-black text-lg mb-2">چگونه ثبت نام کنم؟</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            روی دکمه ثبت نام کلیک کنید و اطلاعات خود را وارد کنید. ثبت نام کاملاً رایگان است.
                          </p>
                        </div>
                      </div>
                    </div>
                  </RevealOnScroll>
                  <RevealOnScroll delay={0.1} direction="up" duration={0.6}>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-black text-lg mb-2">آیا دوره‌ها گواهینامه دارند؟</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            بله، تمام دوره‌های ما با گواهینامه معتبر و قابل استناد ارائه می‌شوند.
                          </p>
                        </div>
                      </div>
                    </div>
                  </RevealOnScroll>
                  <RevealOnScroll delay={0.2} direction="up" duration={0.6}>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-black text-lg mb-2">چگونه پرداخت کنم؟</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            می‌توانید از طریق درگاه‌های پرداخت آنلاین یا کارت به کارت پرداخت کنید.
                          </p>
                        </div>
                      </div>
                    </div>
                  </RevealOnScroll>
                  <RevealOnScroll delay={0.3} direction="up" duration={0.6}>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-black text-lg mb-2">آیا پشتیبانی دارید؟</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            بله، تیم پشتیبانی ما 24/7 آماده پاسخگویی به سوالات شماست.
                          </p>
                        </div>
                      </div>
                    </div>
                  </RevealOnScroll>
                </div>
              </CardContent>
            </Card>
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
                      <Globe className="h-12 w-12 text-white" />
                    </div>
                  </ScrollAnimation>
                  <ScrollAnimation delay={0.2} direction="up" duration={0.8}>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                      آماده شروع هستید؟
                    </h2>
                  </ScrollAnimation>
                  <ScrollAnimation delay={0.3} direction="up" duration={0.8}>
                    <p className="text-2xl md:text-3xl text-muted-foreground mb-12 leading-relaxed font-medium">
                      همین حالا به جمع هزاران دانشجوی ما بپیوندید
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
                          <span className="font-black">مشاهده دوره‌ها</span>
                          <ArrowRight className="h-6 w-6 mr-3 transition-transform duration-300 group-hover/btn:translate-x-3" />
                        </MagneticButton>
                      </Link>
                      <Link href="/register">
                        <MagneticButton
                          size="lg" 
                          variant="outline"
                          intensity={0.15}
                          className="text-xl px-14 h-16 border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-500 font-black"
                        >
                          <span>ثبت نام رایگان</span>
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

