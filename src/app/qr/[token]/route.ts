import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  
  if (!token) {
    return new NextResponse('Invalid Token', { status: 400 });
  }

  // Set the cookie for the student session (valid for 30 days)
  const cookieStore = await cookies();
  cookieStore.set('student_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  // Redirect to the student dashboard
  redirect('/my');
}
