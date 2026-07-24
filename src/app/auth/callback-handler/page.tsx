'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CallbackHandlerPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      router.replace('/?error=no_code');
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then((result: any) => {
      if (result.error) {
        console.error('[auth] Callback error:', result.error.message);
        router.replace(`/?error=${encodeURIComponent(result.error.message)}`);
        return;
      }
      router.replace('/swipe');
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
