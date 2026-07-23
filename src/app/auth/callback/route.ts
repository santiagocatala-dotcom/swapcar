import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/swipe';

  if (code) {
    // Use supabase-js directly (no cookies) to exchange the code
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Redirect to a client page that stores the session in localStorage
      const redirectUrl = new URL(`${origin}/auth/callback-handler`);
      redirectUrl.hash = JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.session.user,
      });
      return NextResponse.redirect(redirectUrl.toString());
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
