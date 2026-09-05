import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return new NextResponse('Invalid Token', { status: 400 });
  }

  // Redirect to the student dashboard, setting the session cookie directly
  // on the redirect response (setting it via next/headers cookies() before
  // calling redirect() does not reliably attach it to the redirect response).
  const response = NextResponse.redirect(new URL('/my', request.url));

  response.cookies.set('student_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}
