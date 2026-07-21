'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    
    // DB 연결이 안되어있는 환경(Mock)을 위한 방어 코드
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    }
  } catch (error) {
    console.error('Logout exception:', error);
  }

  redirect('/login');
}
