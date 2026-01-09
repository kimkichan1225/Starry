// SMS 인증 검증 Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyCode, isExpired } from '../_shared/verification-code.ts';
import { isValidPhoneNumber } from '../_shared/solapi.ts';

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 환경 변수 확인
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 요청 본문 파싱
    const { phone, code } = await req.json();

    // 입력 유효성 검사
    if (!phone || !isValidPhoneNumber(phone)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_phone',
          message: '올바른 전화번호 형식이 아닙니다.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_code_format',
          message: '인증번호는 6자리 숫자여야 합니다.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 최신 인증번호 조회 (아직 검증되지 않은 것)
    const { data: verifications, error: queryError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', phone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('Query error:', queryError);
      throw new Error('인증번호 조회에 실패했습니다.');
    }

    if (!verifications || verifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'no_verification_found',
          message: '인증번호를 먼저 요청해주세요.',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const verification = verifications[0];

    // 만료 시간 체크
    if (isExpired(verification.expires_at)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'code_expired',
          message: '인증번호가 만료되었습니다. 다시 요청해주세요.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 시도 횟수 체크 (최대 5회)
    if (verification.attempts >= 5) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'max_attempts_exceeded',
          message: '인증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 시도 횟수 증가
    const { error: updateAttemptsError } = await supabase
      .from('phone_verifications')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id);

    if (updateAttemptsError) {
      console.error('Update attempts error:', updateAttemptsError);
    }

    // 인증번호 검증
    const isValid = await verifyCode(code, verification.verification_code_hash);

    if (!isValid) {
      const remainingAttempts = 5 - (verification.attempts + 1);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_code',
          message: '인증번호가 일치하지 않습니다.',
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 인증 성공: verified = true로 업데이트
    const { error: verifyError } = await supabase
      .from('phone_verifications')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', verification.id);

    if (verifyError) {
      console.error('Verify update error:', verifyError);
      throw new Error('인증 상태 업데이트에 실패했습니다.');
    }

    // 검증 토큰 생성 (간단한 토큰, JWT 대신)
    const verificationToken = btoa(
      JSON.stringify({
        phone,
        verified: true,
        timestamp: Date.now(),
      })
    );

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        verificationToken,
        message: '휴대전화 인증이 완료되었습니다.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Verify SMS error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : '인증 검증에 실패했습니다.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
