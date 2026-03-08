import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      throw new Error('별자리 이미지가 없습니다.');
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

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.choices[0].message.content.trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }

    const suggestions = JSON.parse(match[0]);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
