// SMS 발송 Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  generateVerificationCode,
  hashVerificationCode,
  getExpirationTime,
} from '../_shared/verification-code.ts';
import {
  checkRateLimit,
  recordRequest,
  cleanupOldRecords,
} from '../_shared/rate-limit.ts';
import {
  sendSMS,
  createVerificationMessage,
  isValidPhoneNumber,
} from '../_shared/solapi.ts';

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 환경 변수 확인
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const solapiApiKey = Deno.env.get('SOLAPI_API_KEY');
    const solapiApiSecret = Deno.env.get('SOLAPI_API_SECRET');
    const solapiSender = Deno.env.get('SOLAPI_SENDER');

    if (!solapiApiKey || !solapiApiSecret || !solapiSender) {
      throw new Error('Solapi 환경 변수가 설정되지 않았습니다.');
    }

    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 요청 본문 파싱
    const { phone } = await req.json();

    // 전화번호 유효성 검사
    if (!phone || !isValidPhoneNumber(phone)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_phone',
          message: '올바른 전화번호 형식이 아닙니다. (010-XXXX-XXXX)',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate Limiting 체크
    const rateLimitResult = await checkRateLimit(supabase, phone);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'rate_limit_exceeded',
          message: rateLimitResult.reason,
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 6자리 인증번호 생성
    const verificationCode = generateVerificationCode();

    // 인증번호 해싱
    const codeHash = await hashVerificationCode(verificationCode);

    // 만료 시간 생성 (3분)
    const expiresAt = getExpirationTime(3);

    // 데이터베이스에 저장
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        phone_number: phone,
        verification_code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('인증번호 저장에 실패했습니다.');
    }

    // SMS 발송
    const smsMessage = createVerificationMessage(verificationCode);
    const smsResult = await sendSMS(
      {
        apiKey: solapiApiKey,
        apiSecret: solapiApiSecret,
        sender: solapiSender,
      },
      phone,
      smsMessage
    );

    if (!smsResult.success) {
      console.error('SMS send failed:', smsResult.error);
      throw new Error(smsResult.error || 'SMS 발송에 실패했습니다.');
    }

    // Rate Limit 기록
    await recordRequest(supabase, phone);

    // 오래된 기록 정리 (비동기)
    cleanupOldRecords(supabase).catch((err) =>
      console.error('Cleanup error:', err)
    );

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        message: '인증번호가 발송되었습니다.',
        expiresAt: expiresAt.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Send SMS error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'SMS 발송에 실패했습니다.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
