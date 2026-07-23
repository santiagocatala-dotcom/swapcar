import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/swipe';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user profile exists, create if not
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existing) {
          await supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Usuario',
            avatar_url: user.user_metadata?.avatar_url ?? null,
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString(),
          });
        } else {
          await supabase
            .from('users')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', user.id);
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return to home if something went wrong
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
