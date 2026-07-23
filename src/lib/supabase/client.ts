'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function createClient(): any {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'sb-swapcar-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'Accept': 'application/json',
        },
      },
    }
  );

  return supabaseInstance;
}
