'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CallbackHandlerPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    console.log('[auth] Callback handler started', { code: !!code, url: window.location.href });

    if (!code) {
      console.error('[auth] No code in URL');
      router.replace('/?error=no_code');
      return;
    }

    const supabase = createClient();
    console.log('[auth] Exchanging code for session...');
    supabase.auth.exchangeCodeForSession(code).then((result: any) => {
      console.log('[auth] Exchange result:', result.error ? `ERROR: ${result.error.message}` : 'SUCCESS');
      if (result.error) {
        console.error('[auth] Callback error:', result.error);
        router.replace(`/?error=${encodeURIComponent(result.error.message)}`);
        return;
      }
      router.replace('/swipe');
    }).catch((err: any) => {
      console.error('[auth] Exchange exception:', err);
      router.replace('/?error=exchange_failed');
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Iniciando sesión...</p>
      </div>
    </div>
  );
}
