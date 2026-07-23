'use client';

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

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
        storageKey: 'swapcar-auth-token',
        storage: typeof window !== 'undefined' ? localStorage : undefined,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Prefer': 'count=exact',
        },
      },
    }
  );

  return supabaseInstance;
}
