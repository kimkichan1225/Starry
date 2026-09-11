// 회원 탈퇴 Edge Function
// 본인 확인(이메일 가입자는 비밀번호 재입력, 소셜 가입자는 확인 문구) 후
// delete_user_account로 계정과 데이터를 즉시 삭제한다. (복구 불가)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 대시보드 단일 파일 배포를 위해 cors 헤더를 인라인한다(_shared import 미사용).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 소셜 가입자가 입력해야 하는 확인 문구 (한국어/영어 화면)
const CONFIRM_TEXTS = ['탈퇴', 'DELETE'];

// 관리자 계정은 이 경로로 탈퇴할 수 없다 (src/config/admin.js와 동일)
const ADMIN_EMAILS = ['admin@admin.com'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. 호출자 인증
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim();
    if (!token) {
      return json({ success: false, error: 'unauthorized' }, 401);
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return json({ success: false, error: 'unauthorized' }, 401);
    }

    if (user.email && ADMIN_EMAILS.includes(user.email)) {
      return json({ success: false, error: 'forbidden' }, 403);
    }

    // 2. 본인 확인
    const { password, confirmText } = await req.json().catch(() => ({}));
    const isEmailAccount = user.app_metadata?.provider === 'email';

    if (isEmailAccount) {
      if (!password || typeof password !== 'string' || !user.email) {
        return json({ success: false, error: 'password_required' }, 400);
      }

      // 세션을 저장하지 않는 별도 클라이언트로 비밀번호만 확인한다.
      const verifier = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: signInError } = await verifier.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (signInError) {
        return json({ success: false, error: 'invalid_password' }, 401);
      }
    } else if (typeof confirmText !== 'string' || !CONFIRM_TEXTS.includes(confirmText.trim())) {
      return json({ success: false, error: 'confirm_required' }, 400);
    }

    // 3. 계정 및 데이터 삭제 (단일 트랜잭션)
    const { error: deleteError } = await admin.rpc('delete_user_account', { p_user_id: user.id });

    if (deleteError) {
      console.error('delete_user_account error:', deleteError);
      return json({ success: false, error: 'delete_failed' }, 500);
    }

    return json({ success: true }, 200);
  } catch (error) {
    console.error('delete-account error:', error);
    return json({ success: false, error: 'internal_error' }, 500);
  }
});
