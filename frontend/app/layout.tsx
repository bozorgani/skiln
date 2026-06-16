import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { Suspense, lazy } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundaryWrapper from "@/components/common/ErrorBoundaryWrapper";
import Header from "@/components/layout/Header";
// Lazy load non-critical components
const CategoryNav = lazy(() => import("@/components/layout/CategoryNav"));
const CursorFollower = lazy(() => import("@/components/common/CursorFollower"));
const ScrollProgress = lazy(() => import("@/components/common/ScrollProgress"));

const vazir = Vazirmatn({ 
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"], // Reduced weights for faster loading
  variable: "--font-vazir",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial", "sans-serif"],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.skiln.ir'),
  title: {
    default: "Skiln - آموزش تخصصی برنامه‌نویسی و هوش مصنوعی",
    template: "%s | Skiln"
  },
  description: "Skiln - پلتفرم تخصصی آموزش برنامه‌نویسی و هوش مصنوعی. یادگیری Python، JavaScript، React، Node.js، Machine Learning، Deep Learning و Data Science با بهترین مدرسان. دوره‌های پروژه‌محور با گواهینامه معتبر.",
  keywords: ["آموزش برنامه‌نویسی", "آموزش هوش مصنوعی", "دوره Python", "دوره JavaScript", "دوره React", "Machine Learning", "Deep Learning", "Data Science", "Skiln", "آموزش آنلاین برنامه‌نویسی", "دوره برنامه‌نویسی", "یادگیری AI", "آموزش AI", "دوره Node.js", "گواهینامه برنامه‌نویسی"],
  authors: [{ name: "Skiln" }],
  creator: "Skiln",
  publisher: "Skiln",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://www.skiln.ir",
    siteName: "Skiln",
    title: "Skiln - آموزش تخصصی برنامه‌نویسی و هوش مصنوعی",
    description: "Skiln - پلتفرم تخصصی آموزش برنامه‌نویسی و هوش مصنوعی. یادگیری Python، JavaScript، React، Node.js، Machine Learning، Deep Learning و Data Science با بهترین مدرسان.",
    images: [
      {
        url: "https://www.skiln.ir/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Skiln - پلتفرم تخصصی آموزش برنامه‌نویسی و هوش مصنوعی",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skiln - آموزش تخصصی برنامه‌نویسی و هوش مصنوعی",
    description: "Skiln - پلتفرم تخصصی آموزش برنامه‌نویسی و هوش مصنوعی. یادگیری Python، JavaScript، React، Machine Learning و Deep Learning",
    images: ["https://www.skiln.ir/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.skiln.ir",
  },
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazir.variable}>
      <body className="font-sans">
        <Providers>
          <ErrorBoundaryWrapper>
            <AuthProvider>
              <CartProvider>
                <Suspense fallback={null}>
                  <CursorFollower />
                </Suspense>
                <Suspense fallback={null}>
                  <ScrollProgress />
                </Suspense>
                <Suspense fallback={null}>
                  <Header />
                </Suspense>
                <Suspense fallback={null}>
                  <CategoryNav />
                </Suspense>
                {children}
                <Toaster />
              </CartProvider>
            </AuthProvider>
          </ErrorBoundaryWrapper>
        </Providers>
      </body>
    </html>
  );
}


