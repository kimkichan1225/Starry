import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

// 감정 이미지 파일 목록
const emotionImages = [
  'emotion-anger,annoying,enrage',
  'emotion-angry,furious,seething',
  'emotion-boring,Languid,Exhausted',
  'emotion-calm,zen,mindful',
  'emotion-challenging,fierce,determined',
  'emotion-embarrassed,shy,envy',
  'emotion-expect,curious,wondering',
  'emotion-expect,honor,respect',
  'emotion-fun,cheerful,playful',
  'emotion-happy,jump,jubilant',
  'emotion-hate,irritated,grumpy',
  'emotion-heart,loving,affectionate',
  'emotion-jump,starry-eye,enchanted',
  'emotion-lonely,isolated,forlorn',
  'emotion-love,adore,heart',
  'emotion-numb,listless,bored',
  'emotion-regret,frustrated,Distressed',
  'emotion-sad,sorrow,gloomy',
  'emotion-search,interpretation,experiment',
  'emotion-sulky,irritation,pouty',
  'emotion-suspicious,indifference,stare',
  'emotion-tear,sad,lonely',
  'emotion-thrill,discover,fate',
  'emotion-tired,disappoint,exhausted ',
  'emotion-win,goal,arrogant',
  'emotion-wink,prank,joke',
  'emotion-wonder,question,curious',
  'emotion-worry,overthinking, nervous',
  'emotion-yawn,boring,sleepy',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { birthdate } = await req.json();

    if (!birthdate) {
      throw new Error('생년월일 정보가 없습니다.');
    }

    const today = new Date().toISOString().split('T')[0];
    const emotionList = emotionImages.map(e => e.replace('emotion-', '')).join(', ');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: `당신은 친근하고 따뜻한 운세 전문가입니다. 사용자의 생년월일과 오늘 날짜를 기반으로 오늘의 운세를 알려주세요.

응답은 반드시 JSON 형식으로만 반환하세요. 다른 텍스트 없이 JSON만 반환하세요.

JSON 구조:
{
  "message": "오늘의 운세 메시지 (2~3문장, 따뜻하고 긍정적인 톤)",
  "emotion": "감정 키워드 (아래 목록에서 정확히 하나를 선택)",
  "love": 별점 (1~5 정수),
  "health": 별점 (1~5 정수),
  "wealth": 별점 (1~5 정수),
  "luck": 별점 (1~5 정수)
}

감정 키워드 목록 (emotion 필드에 이 중 하나를 정확히 사용):
${emotionList}

규칙:
- message는 반말이 아닌 친근한 존댓말로 작성하세요 (~에요, ~이에요 체).
- 생년월일의 별자리, 띠, 수비학적 요소를 참고하여 운세를 작성하세요.
- emotion은 오늘의 운세 메시지 분위기에 가장 잘 맞는 것을 선택하세요.
- 각 별점은 1~5 사이의 정수입니다.`,
          },
          {
            role: 'user',
            content: `생년월일: ${birthdate}\n오늘 날짜: ${today}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.choices[0].message.content.trim();
    // JSON 파싱 (```json ... ``` 형태도 처리)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }

    const fortune = JSON.parse(jsonMatch[0]);

    // emotion 키워드로 이미지 파일명 매칭
    const emotionKey = fortune.emotion || '';
    const matchedImage = emotionImages.find(img => img.includes(emotionKey)) || 'emotion-calm,zen,mindful';
    fortune.emotionImage = `/emotions/${matchedImage}.png`;

    return new Response(JSON.stringify(fortune), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
