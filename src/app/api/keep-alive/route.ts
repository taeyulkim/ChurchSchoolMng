import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 무료 플랜은 약 7일간 활동이 없으면 프로젝트가 일시 중지됩니다.
 * Vercel Cron이 하루 한 번 이 경로를 호출해 가벼운 조회 요청을 보냅니다.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return Response.json({ ok: false, error: 'Supabase 환경변수가 없습니다.' }, { status: 500 });
  }

  const supabase = createClient(url, anonKey);
  const { error } = await supabase.from('students').select('id').limit(1);
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, at: new Date().toISOString() });
}
