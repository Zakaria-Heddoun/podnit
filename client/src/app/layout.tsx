import { Outfit } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from '@/components/ErrorBoundary';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('http://podnit.com'),
  title: {
    default: 'Podnit - Print on Demand Platform | Custom T-Shirts & Apparel',
    template: '%s | Podnit'
  },
  description: 'Podnit is your go-to print on demand platform for creating and selling custom t-shirts, hoodies, and apparel. Design, customize, and start selling today with no upfront costs.',
  keywords: ['print on demand', 'custom t-shirts', 'custom apparel', 'POD platform', 'sell custom products', 'design studio', 't-shirt printing', 'hoodie printing', 'personalized clothing', 'dropshipping', 'Morocco POD'],
  authors: [{ name: 'Podnit' }],
  creator: 'Podnit',
  publisher: 'Podnit',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/images/podnitlogo.png',
    shortcut: '/images/podnitlogo.png',
    apple: '/images/podnitlogo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://podnit.com',
    siteName: 'Podnit',
    title: 'Podnit - Print on Demand Platform',
    description: 'Create and sell custom t-shirts, hoodies, and apparel with our print on demand platform. No inventory, no risk, unlimited creativity.',
    images: [
      {
        url: '/images/podnitlogo.png',
        width: 1200,
        height: 630,
        alt: 'Podnit - Print on Demand Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podnit - Print on Demand Platform',
    description: 'Create and sell custom t-shirts, hoodies, and apparel with our print on demand platform.',
    images: ['/images/podnitlogo.png'],
    creator: '@podnit',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} dark:bg-gray-900`} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              {/* Global client-side error boundary to catch runtime exceptions and show a friendly fallback */}
              <ErrorBoundary>{children}</ErrorBoundary>
            </SidebarProvider>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
