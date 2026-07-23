import type { Metadata } from 'next';
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
    'La plataforma para intercambiar tu vehículo de forma fácil, segura y rápida. Encuentra el auto de tus sueños sin pagar de más.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#0f172a]">
        <SupabaseProvider>
          <main className="flex-1 pb-16">{children}</main>
          <BottomNav />
        </SupabaseProvider>
      </body>
    </html>
  );
}
