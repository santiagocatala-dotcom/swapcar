'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type Theme = 'light' | 'dark';

interface SupabaseContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
}

const SupabaseContext = createContext<SupabaseContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
  theme: 'light',
  toggleTheme: () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export default function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');
  const router = useRouter();
  const supabase = createClient();

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  }, [supabase, router]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('swapcar-theme', next);
      return next;
    });
  }, []);

  // Load theme preference
  useEffect(() => {
    const saved = localStorage.getItem('swapcar-theme') as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Auth state management — single effect, no router.refresh to avoid loops
  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]); // 👈 solo supabase, sin router

  return (
    <SupabaseContext.Provider value={{ user, loading, signOut, theme, toggleTheme }}>
      {children}
    </SupabaseContext.Provider>
  );
}
