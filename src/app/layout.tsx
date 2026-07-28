import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import SupabaseProvider from '@/components/SupabaseProvider';
import { BottomNav } from '@/components/bottom-nav';
import { InstallPWA } from '@/components/InstallPWA';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const SITE_URL = 'https://reve.autos';

export const metadata: Metadata = {
  title: 'REVE - Intercambio de Vehículos',
  description: 'App para intercambiar vehículos.',
  openGraph: {
    title: 'REVE',
    description: 'App para intercambiar vehículos.',
    url: SITE_URL,
    siteName: 'REVE',
    images: [{ url: `${SITE_URL}/og-image.svg`, width: 1200, height: 630 }],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REVE - Intercambio de Vehículos',
    description: 'App para intercambiar vehículos.',
    images: [`${SITE_URL}/og-image.svg`],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="REVE" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className="min-h-dvh flex flex-col bg-white text-[#0f172a] safe-bottom overscroll-none">
        <SupabaseProvider>
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
          <InstallPWA />
        </SupabaseProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
