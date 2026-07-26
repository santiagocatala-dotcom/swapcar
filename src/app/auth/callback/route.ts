import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('[auth/callback] Received callback', {
    url: request.url,
    hasCode: !!code,
    hasError: !!error,
    errorValue: error,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (code) {
    // Use JavaScript redirect to ensure the code is passed properly
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Redirigiendo...</title>
<script>window.location.href='/auth/callback-handler?code=${code}'</script>
</head><body><p>Redirigiendo...</p>
<noscript><meta http-equiv="refresh" content="0;url=/auth/callback-handler?code=${code}"></noscript>
</body></html>`;
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return NextResponse.redirect(new URL('/?error=no_code', request.url));
}
