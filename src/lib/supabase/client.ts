'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let instance: any = null;

function makeMockClient() {
  const noop = () => Promise.resolve({ data: null, error: null });
  return {
    auth: {
      getSession: noop,
      getUser: noop,
      signUp: noop,
      signInWithPassword: noop,
      signInWithOAuth: () => Promise.resolve({ data: { url: '' }, error: null }),
      signOut: noop,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      exchangeCodeForSession: noop,
      refreshSession: noop,
      setSession: noop,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: noop,
          maybeSingle: noop,
          order: () => ({ data: null }),
        }),
        order: () => ({ data: null }),
      }),
      insert: () => ({ select: () => ({ single: noop }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: noop }) }) }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: '' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ data: { path: '' }, error: null }),
      }),
    },
    channel: () => ({ on: () => ({ subscribe: () => {} }) }),
    getChannels: () => [],
    realtime: { subscribe: () => {} },
  };
}

export function createClient(): any {
  if (instance) return instance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // SSR / build-time — return mock to avoid "supabaseUrl is required" error
  if (typeof window === 'undefined' || !url || !key) {
    instance = makeMockClient();
    return instance;
  }

  try {
    instance = createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'sb-swapcar-auth',
        storage: window.localStorage,
      },
    });
  } catch {
    instance = makeMockClient();
  }

  return instance;
}
