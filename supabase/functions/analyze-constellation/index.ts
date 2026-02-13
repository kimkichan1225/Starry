import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      throw new Error('별자리 이미지가 없습니다.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: image,
              },
            },
            {
              type: 'text',
              text: `이 이미지는 밤하늘에 별들을 연결해서 만든 별자리입니다. 별자리의 전체적인 모양을 보고, 이 별자리가 어떤 모양이나 물체를 닮았는지 분석해주세요.

재미있고 창의적인 별자리 이름을 3개 추천해주세요.
각 이름은 반드시 "OO적인 XX자리" 형식이어야 합니다.
- OO: 한국어 형용사/수식어 (예: 신비로운, 귀여운, 웅장한, 반짝이는, 장난스러운)
- XX: 이 별자리가 닮은 사물/음식/동물 등의 명사 (예: 햄버거, 로봇, 토끼, 피자, 왕관)

반드시 JSON 배열로만 응답하세요. 다른 텍스트 없이 배열만 반환하세요.
예시: ["신비로운 햄버거자리", "웅장한 로봇자리", "귀여운 토끼자리"]`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.content[0].text.trim();
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
