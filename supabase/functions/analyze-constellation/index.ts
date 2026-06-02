import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 대시보드 단일 파일 배포를 위해 cors 헤더를 인라인한다(_shared import 미사용).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// rate limit 설정 (로그인 user 기준): gpt-4o 비전 모델은 비용이 크므로 엄격히 제한
const RL_ENDPOINT = 'analyze-constellation';
const RL_PER_MINUTE = 5;
const RL_PER_HOUR = 20;

// 이미지 base64 최대 길이(약 2.2MB). 작은 별자리 캔버스 기준 충분히 넉넉.
const MAX_IMAGE_LEN = 3_000_000;

// rate limit 체크 + 기록 (원자적 RPC). 초과 시 retryAfter(초) 반환.
async function checkRateLimit(
  // deno-lint-ignore no-explicit-any
  admin: any,
  identifier: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const { data, error } = await admin.rpc('ai_rate_limit_hit', {
    p_identifier: identifier,
    p_endpoint: RL_ENDPOINT,
    p_per_minute: RL_PER_MINUTE,
    p_per_hour: RL_PER_HOUR,
  });

  if (error) {
    console.error('ai rate limit rpc error:', error);
    return { allowed: false, retryAfter: 60 };
  }

  return { allowed: data?.allowed === true, retryAfter: data?.retry_after };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. 인증 필수: 로그인 사용자만 호출 가능 (비싼 비전 모델 보호)
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 세션입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 휴대전화 인증을 마친 사용자만 허용 (계정 대량생성 기반 비용 우회 방지)
    if (userData.user.app_metadata?.phone_verified !== true) {
      return new Response(
        JSON.stringify({ error: '휴대전화 인증이 필요합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. rate limit (user 기준)
    const rl = await checkRateLimit(admin, userData.user.id);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', retryAfter: rl.retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 입력 검증
    const { image } = await req.json();

    if (!image || typeof image !== 'string') {
      throw new Error('별자리 이미지가 없습니다.');
    }
    if (image.length > MAX_IMAGE_LEN) {
      return new Response(
        JSON.stringify({ error: '이미지 크기가 너무 큽니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(image)) {
      return new Response(
        JSON.stringify({ error: '올바른 이미지 형식이 아닙니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `당신은 별자리 모양 분석 전문가입니다. 어두운 배경 위에 밝은 점(별)들이 선으로 연결된 이미지를 받게 됩니다.

분석 순서:
1. 먼저 별들의 위치와 연결선이 이루는 전체 윤곽/실루엣을 파악하세요.
2. 선의 각도, 꺾임, 곡선, 대칭 여부를 관찰하세요.
3. 이 윤곽이 실제로 닮은 구체적인 사물/동물/물체를 떠올리세요.
4. 반드시 모양에 기반한 이름을 지어야 합니다. 모양과 무관한 추상적이거나 임의의 이름은 절대 금지입니다.

응답 규칙:
- 반드시 JSON 배열로만 응답하세요. 다른 텍스트 없이 배열만 반환하세요.
- 정확히 3개의 이름을 추천하세요.
- 각 이름은 "OO XX자리" 형식입니다 (OO: 한국어 형용사, XX: 닮은 사물 명사).
- 예시: ["귀여운 토끼자리", "웅장한 왕관자리", "반짝이는 다이아몬드자리"]`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${image}`,
                },
              },
              {
                type: 'text',
                text: '이 별자리의 모양을 분석하고 모양에 어울리는 이름 3개를 추천해주세요.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', response.status, errText);
      throw new Error('별자리 분석에 실패했습니다.');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('AI 응답이 비어 있습니다.');
    }

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }

    const suggestions = JSON.parse(match[0]);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : '별자리 분석에 실패했습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
