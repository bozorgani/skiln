'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const defaultFAQs: FAQItem[] = [
  {
    question: 'آیا برای این دوره باید پیش‌نیاز داشته باشم؟',
    answer: 'این دوره برای همه سطوح طراحی شده است. اگر مبتدی هستید، می‌توانید از صفر شروع کنید و اگر تجربه دارید، می‌توانید مهارت‌های خود را تقویت کنید.',
  },
  {
    question: 'این دوره رایگان است؟',
    answer: 'بله، تمام محتوای آموزشی این دوره به‌صورت رایگان در اختیار شما قرار می‌گیرد و بدون نیاز به پرداخت هزینه می‌توانید یادگیری را شروع کنید.',
  },
  {
    question: 'این دوره مناسب چه کسانی است؟',
    answer: 'از برنامه‌نویسان حرفه‌ای گرفته تا علاقه‌مندان تازه‌کار، همه می‌توانند از این دوره بهره‌مند شوند. اگر به یادگیری علاقه دارید، این دوره برای شما مناسب است.',
  },
  {
    question: 'آیا می‌توانم در هر زمان به محتوای دوره دسترسی داشته باشم؟',
    answer: 'بله، پس از ثبت‌نام در دوره، می‌توانید در هر زمان و مکان به تمام محتوای دوره دسترسی داشته باشید و با سرعت خودتان پیش بروید.',
  },
  {
    question: 'آیا پس از اتمام دوره گواهینامه دریافت می‌کنم؟',
    answer: 'بله، پس از تکمیل موفقیت‌آمیز دوره و انجام پروژه‌های عملی، می‌توانید گواهینامه تکمیل دوره را دریافت کنید.',
  },
];

export default function FAQSection() {
  return (
    <div className="space-y-3">
      {defaultFAQs.map((faq, index) => (
        <FAQItem key={index} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
}

function FAQItem({ question, answer }: FAQItem) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full bg-white dark:bg-gray-900 group rounded-lg border dark:border-gray-800 border-gray-200 flex items-center justify-between py-3 md:px-5 px-3 cursor-pointer transition-all duration-200 hover:border-primary/50',
          isOpen && 'border-primary'
        )}
      >
        <div className="flex items-center gap-3 flex-1 text-right">
          <div
            className={cn(
              'font-extrabold flex-shrink-0 pt-2 text-lg md:text-2xl transition duration-200 md:ml-5 ml-2 md:w-11 w-8 md:h-11 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:text-white group-hover:bg-primary',
              isOpen && '!bg-primary !text-white'
            )}
          >
            <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <h3
            className={cn(
              'md:text-xl text-base transition duration-200 group-hover:text-primary dark:text-gray-200 text-gray-800 font-semibold flex-1',
              isOpen && '!text-primary dark:text-primary'
            )}
          >
            {question}
          </h3>
        </div>
        <div
          className={cn(
            'transition duration-200 transform rotate-90 dark:text-gray-200 text-gray-800 group-hover:text-primary md:scale-100 scale-75 flex-shrink-0',
            isOpen && '!rotate-0 !text-primary'
          )}
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="md:mr-16 sm:mr-5 bg-white dark:bg-gray-900 dark:border-gray-800 rounded-lg border border-gray-200 mt-3 px-4 md:px-8 py-4 animate-in slide-in-from-top-2 duration-200">
          <div className="content-area text-right text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}

