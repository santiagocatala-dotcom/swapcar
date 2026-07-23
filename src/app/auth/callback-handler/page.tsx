'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackHandlerPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        router.replace('/?error=no_session');
        return;
      }
      const session = JSON.parse(decodeURIComponent(hash));
      if (session?.access_token) {
        localStorage.setItem('sb-swapcar-auth', JSON.stringify({
          user: session.user,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }));
        router.replace('/swipe');
      } else {
        router.replace('/?error=invalid_session');
      }
    } catch {
      router.replace('/?error=callback_error');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-400">Iniciando sesión...</p>
    </div>
  );
}
