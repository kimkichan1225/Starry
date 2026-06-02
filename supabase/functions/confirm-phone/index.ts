// 휴대전화 인증 확정 Edge Function
// 클라이언트가 user_metadata에 phone_verified를 직접 써넣는 것을 신뢰하지 않고,
// 서버가 DB의 실제 인증 기록(verified=true)을 확인한 뒤
// 위변조 불가능한 app_metadata에 인증 상태를 기록한다.
//
// 보안 설계:
// - verify-sms가 인증 성공 시 발급한 단회성 verificationId(행 UUID, 추측 불가)로만 확정한다.
//   → SMS 인증을 직접 수행한(=id를 받은) 호출자에게 인증이 묶인다. 타인의 전화번호로 통과 불가.
// - 조회+소비를 단일 조건부 UPDATE로 원자 처리한다. → 병렬 요청이 같은 기록을 중복 소비할 수 없다.
// - 확정에 사용할 전화번호는 클라이언트 입력이 아니라 소비된 DB 행에서 읽는다.
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

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Service Role 클라이언트 (특권 작업 + JWT 검증용)
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. 호출자 인증: Authorization 헤더의 사용자 JWT를 검증한다.
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return json(
        { success: false, error: 'unauthorized', message: '인증이 필요합니다.' },
        401
      );
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);

    if (userError || !userData?.user) {
      return json(
        { success: false, error: 'unauthorized', message: '유효하지 않은 세션입니다.' },
        401
      );
    }

    const user = userData.user;

    // 2. 입력 검증: verify-sms가 발급한 단회성 verificationId
    const { verificationId } = await req.json();

    if (!verificationId || typeof verificationId !== 'string') {
      return json(
        { success: false, error: 'invalid_request', message: '유효한 인증 정보가 없습니다.' },
        400
      );
    }

    // 3. 원자적 소비: 미사용 + verified + 최근(1시간 이내) 기록을 단일 UPDATE로 소비한다.
    //    동시 요청 중 정확히 하나만 성공한다(consumed_at IS NULL 조건). phone도 함께 획득.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: consumed, error: consumeError } = await admin
      .from('phone_verifications')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', verificationId)
      .eq('verified', true)
      .is('consumed_at', null)
      .gte('updated_at', oneHourAgo)
      .select('phone_number')
      .maybeSingle();

    if (consumeError) {
      console.error('confirm-phone consume error:', consumeError);
      throw new Error('인증 기록 처리에 실패했습니다.');
    }

    if (!consumed) {
      // 존재하지 않거나, 미인증/만료/이미 소비된 기록
      return json(
        {
          success: false,
          error: 'not_verified',
          message: '휴대전화 인증이 확인되지 않았습니다. 다시 인증해주세요.',
        },
        400
      );
    }

    const phone = consumed.phone_number;

    // 4. 사용자 식별 정보(app_metadata)에 서버가 직접 인증 상태를 기록한다.
    //    app_metadata는 클라이언트가 수정할 수 없는 영역이다. 기존 값은 명시적으로 보존한다.
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        phone_verified: true,
        phone,
      },
    });

    if (updateError) {
      // 롤백: 소비를 취소해 재시도가 가능하도록 한다(best-effort).
      await admin
        .from('phone_verifications')
        .update({ consumed_at: null })
        .eq('id', verificationId);

      console.error('confirm-phone updateUser error:', updateError);
      throw new Error('인증 상태 저장에 실패했습니다.');
    }

    return json(
      { success: true, message: '휴대전화 인증이 확정되었습니다.' },
      200
    );
  } catch (error) {
    console.error('confirm-phone error:', error);
    return json(
      {
        success: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : '처리에 실패했습니다.',
      },
      500
    );
  }
});
