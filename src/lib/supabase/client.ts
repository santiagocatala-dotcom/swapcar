import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseInstance: any = null;

export function createClient(): any {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'swapcar-auth',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    },
  });

  return supabaseInstance;
}
