// SMS 인증 검증 Edge Function
// 시도횟수 증가/검증을 DB의 verify_phone_attempt RPC(행 잠금)로 원자 처리하여
// 병렬 무차별 시도(5회 제한 우회)를 방지한다.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 대시보드 단일 파일 배포를 위해 의존성을 인라인한다(_shared import 미사용).
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

// 전화번호 형식 검증 (send-sms의 solapi.ts isValidPhoneNumber와 동일 정책: 010-XXXX-XXXX)
function isValidPhoneNumber(phone: string): boolean {
  return /^010-\d{4}-\d{4}$/.test(phone);
}

// 인증번호 SHA-256 해싱 (send-sms의 저장 방식과 반드시 동일해야 함)
async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { phone, code } = await req.json();

    if (!phone || !isValidPhoneNumber(phone)) {
      return json({ success: false, error: 'invalid_phone', message: '올바른 전화번호 형식이 아닙니다.' }, 400);
    }
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return json({ success: false, error: 'invalid_code_format', message: '인증번호는 6자리 숫자여야 합니다.' }, 400);
    }

    const codeHash = await hashCode(code);

    // 원자적 검증 (행 잠금으로 시도횟수 증가/검증 직렬화)
    const { data: result, error: rpcError } = await admin.rpc('verify_phone_attempt', {
      p_phone: phone,
      p_code_hash: codeHash,
    });

    if (rpcError) {
      console.error('verify_phone_attempt rpc error:', rpcError);
      throw new Error('인증 검증에 실패했습니다.');
    }

    const status = result?.status;

    if (status === 'not_found') {
      return json({ success: false, error: 'no_verification_found', message: '인증번호를 먼저 요청해주세요.' }, 404);
    }
    if (status === 'expired') {
      return json({ success: false, error: 'code_expired', message: '인증번호가 만료되었습니다. 다시 요청해주세요.' }, 400);
    }
    if (status === 'max_attempts') {
      return json(
        { success: false, error: 'max_attempts_exceeded', message: '인증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.' },
        400
      );
    }
    if (status === 'invalid') {
      const remaining = typeof result?.remaining === 'number' ? result.remaining : 0;
      return json(
        { success: false, error: 'invalid_code', message: '인증번호가 일치하지 않습니다.', remainingAttempts: remaining },
        400
      );
    }
    if (status === 'success') {
      // verificationId는 confirm-phone에서 단회성으로 소비되는 비밀 식별자(추측 불가 UUID).
      return json(
        { success: true, verified: true, verificationId: result.id, message: '휴대전화 인증이 완료되었습니다.' },
        200
      );
    }

    throw new Error('알 수 없는 인증 상태입니다.');
  } catch (error) {
    console.error('Verify SMS error:', error);
    return json(
      { success: false, error: 'internal_error', message: error instanceof Error ? error.message : '인증 검증에 실패했습니다.' },
      500
    );
  }
});
