// SMS 발송 Edge Function
// rate limit은 원자적 RPC(sms_rate_limit_hit)로 처리한다(fail-closed, race 방지).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 대시보드 단일 파일 배포를 위해 의존성을 인라인한다(_shared import 미사용).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// rate limit 설정 (전화번호 기준)
const RL_PER_MINUTE = 1;
const RL_PER_HOUR = 5;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// 전화번호 형식 검증 (010-XXXX-XXXX)
function isValidPhoneNumber(phone: string): boolean {
  return /^010-\d{4}-\d{4}$/.test(phone);
}

// 호출자 IP 추출 (번호 로테이션 스팸 제한용)
function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') || 'unknown';
}

// IP별 발송 제한 (한 IP에서 여러 번호로 도배하는 것 완화)
const IP_PER_MINUTE = 5;
const IP_PER_HOUR = 30;

// 6자리 인증번호 생성 (암호학적 난수 사용)
function generateVerificationCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return (100000 + (arr[0] % 900000)).toString();
}

// 인증번호 HMAC-SHA256 해싱 (서버 pepper 사용 — verify-sms와 동일 방식이어야 함)
// 무염 SHA-256은 6자리 코드라 DB 유출 시 즉시 역산 가능하므로 서버 비밀(pepper)로 HMAC한다.
async function hashCode(code: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(code));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// HMAC-SHA256 서명 (Solapi 인증)
async function createSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 20; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

// Solapi로 SMS 발송
async function sendSMS(
  config: { apiKey: string; apiSecret: string; sender: string },
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanTo = to.replace(/-/g, '');
    const cleanFrom = config.sender.replace(/-/g, '');
    const date = new Date().toISOString();
    const salt = generateSalt();
    const signature = await createSignature(date + salt, config.apiSecret);
    const authHeader = `HMAC-SHA256 apiKey=${config.apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({ message: { to: cleanTo, from: cleanFrom, text: message } }),
    });

    const result = await response.json();
    if (response.ok) {
      return { success: true };
    }
    console.error('Solapi API error:', result);
    return { success: false, error: result.errorMessage || result.message || 'SMS 발송에 실패했습니다.' };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'SMS 발송 중 오류가 발생했습니다.' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const solapiApiKey = Deno.env.get('SOLAPI_API_KEY');
    const solapiApiSecret = Deno.env.get('SOLAPI_API_SECRET');
    const solapiSender = Deno.env.get('SOLAPI_SENDER');

    if (!solapiApiKey || !solapiApiSecret || !solapiSender) {
      throw new Error('Solapi 환경 변수가 설정되지 않았습니다.');
    }

    const otpPepper = Deno.env.get('OTP_HASH_PEPPER');
    if (!otpPepper) {
      throw new Error('OTP_HASH_PEPPER 환경 변수가 설정되지 않았습니다.');
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { phone } = await req.json();

    if (!phone || !isValidPhoneNumber(phone)) {
      return json(
        { success: false, error: 'invalid_phone', message: '올바른 전화번호 형식이 아닙니다. (010-XXXX-XXXX)' },
        400
      );
    }

    // IP별 rate limit (한 IP에서 번호 바꿔가며 도배하는 것 완화)
    const ip = getClientIp(req);
    const { data: ipRl, error: ipErr } = await admin.rpc('ai_rate_limit_hit', {
      p_identifier: ip,
      p_endpoint: 'send-sms',
      p_per_minute: IP_PER_MINUTE,
      p_per_hour: IP_PER_HOUR,
    });

    if (ipErr) {
      console.error('send-sms ip rate limit error:', ipErr);
      return json(
        { success: false, error: 'rate_limit_error', message: '일시적인 오류입니다. 잠시 후 다시 시도해주세요.' },
        429
      );
    }
    if (!ipRl?.allowed) {
      return json(
        { success: false, error: 'rate_limit_exceeded', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', retryAfter: ipRl?.retry_after ?? 60 },
        429
      );
    }

    // 원자적 rate limit (전화번호 기준 — 조회/기록을 advisory lock으로 직렬화, 에러 시 fail-closed)
    const { data: rl, error: rlError } = await admin.rpc('sms_rate_limit_hit', {
      p_phone: phone,
      p_per_minute: RL_PER_MINUTE,
      p_per_hour: RL_PER_HOUR,
    });

    if (rlError) {
      // fail-closed: rate limit 처리 실패 시 발송을 막는다(우회/스팸 방지).
      console.error('sms_rate_limit_hit error:', rlError);
      return json(
        { success: false, error: 'rate_limit_error', message: '일시적인 오류입니다. 잠시 후 다시 시도해주세요.' },
        429
      );
    }

    if (!rl?.allowed) {
      const retryAfter = rl?.retry_after ?? 60;
      return json(
        {
          success: false,
          error: 'rate_limit_exceeded',
          message: retryAfter > 60 ? '1시간에 최대 5회까지만 요청할 수 있습니다.' : '1분에 1회만 요청할 수 있습니다.',
          retryAfter,
        },
        429
      );
    }

    // 6자리 인증번호 생성 + 해싱 + 만료(3분)
    const verificationCode = generateVerificationCode();
    const codeHash = await hashCode(verificationCode, otpPepper);
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    const { error: insertError } = await admin.from('phone_verifications').insert({
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
    const smsMessage = `[Starry] 인증번호는 [${verificationCode}]입니다. 3분 내에 입력해주세요.`;
    const smsResult = await sendSMS(
      { apiKey: solapiApiKey, apiSecret: solapiApiSecret, sender: solapiSender },
      phone,
      smsMessage
    );

    if (!smsResult.success) {
      console.error('SMS send failed:', smsResult.error);
      throw new Error(smsResult.error || 'SMS 발송에 실패했습니다.');
    }

    return json(
      { success: true, message: '인증번호가 발송되었습니다.', expiresAt: expiresAt.toISOString() },
      200
    );
  } catch (error) {
    console.error('Send SMS error:', error);
    return json(
      { success: false, error: 'internal_error', message: error instanceof Error ? error.message : 'SMS 발송에 실패했습니다.' },
      500
    );
  }
});
