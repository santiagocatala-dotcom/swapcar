import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import SupabaseProvider from '@/components/SupabaseProvider';
import { BottomNav } from '@/components/bottom-nav';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SwapCar - Intercambio de Vehículos',
  description:
    'La plataforma para intercambiar tu vehículo de forma fácil, segura y rápida.',
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
      <body className="min-h-dvh flex flex-col bg-white text-[#0f172a] safe-bottom overscroll-none">
        <SupabaseProvider>
          <main className="flex-1 pb-20">{children}</main>
          <BottomNav />
        </SupabaseProvider>
      </body>
    </html>
  );
}
