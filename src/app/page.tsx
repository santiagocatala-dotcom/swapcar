'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Car, Shield, Zap, Users } from 'lucide-react';
import { useSupabase } from '@/components/SupabaseProvider';

export default function HomePage() {
  const { user, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/swipe');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary/20" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Car className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">SwapCar</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Intercambiá tu vehículo{' '}
            <span className="text-primary">sin complicaciones</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
            La forma más fácil de encontrar el vehículo que realmente querés,
            intercambiando con personas de toda Argentina. Seguro, rápido y
            transparente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-border text-text font-medium rounded-full hover:bg-muted transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Zap,
              title: 'Rápido',
              desc: 'Encontrá matches en segundos con nuestro sistema inteligente.',
            },
            {
              icon: Shield,
              title: 'Seguro',
              desc: 'Intercambiá con usuarios verificados y chateá en tiempo real.',
            },
            {
              icon: Users,
              title: 'Comunidad',
              desc: 'Sumate a miles de argentinos que ya están intercambiando.',
            },
            {
              icon: Car,
              title: 'Variedad',
              desc: 'Autos, motos, camionetas y cuatriciclos de todo el país.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="card p-6 text-center animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-sm text-text-muted border-t border-border">
        <p>&copy; {new Date().getFullYear()} SwapCar. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
