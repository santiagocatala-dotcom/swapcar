'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let instance: any = null;

export function createClient(): any {
  if (instance) return instance;
  instance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'sb-swapcar-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  );
  return instance;
}
