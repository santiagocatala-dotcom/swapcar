import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    // Redirect to client-side handler that has access to localStorage (PKCE code_verifier)
    const redirectUrl = new URL(`${origin}/auth/callback-handler`);
    redirectUrl.searchParams.set('code', code);
    return NextResponse.redirect(redirectUrl.toString());
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
