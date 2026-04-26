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
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: `당신은 친근하고 통찰력 있는 운세 전문가입니다. 사용자의 생년월일과 오늘 날짜를 기반으로 오늘의 운세를 알려주세요.

응답은 반드시 JSON 형식으로만 반환하세요. 다른 텍스트 없이 JSON만 반환하세요.

JSON 구조:
{
  "message": "7단어 이내의 운세 요약 문장",
  "explanation": "애정운, 건강운, 재물운, 전체 정리를 포함한 상세 풀이 (아래 형식 참고)",
  "emotion": "감정 키워드 (아래 목록에서 정확히 하나를 선택)",
  "love": 별점 (1~5 정수),
  "health": 별점 (1~5 정수),
  "wealth": 별점 (1~5 정수),
  "luck": 별점 (1~5 정수)
}

감정 키워드 목록 (emotion 필드에 이 중 하나를 정확히 사용):
${emotionList}

explanation 작성 형식 (반드시 이 구조를 따르세요):

❤️ 애정운
: (핵심 요약 한 줄, 예: "소통이 중요한 시기예요")

(현재 연애/관계 흐름 + 상황별 구체적 조언을 자연스럽게 4~5줄로 작성)

🧠 건강운
: (핵심 요약 한 줄, 예: "루틴을 잡으면 컨디션이 올라가요")

(전반적인 건강 흐름 + 주의할 점이나 팁을 자연스럽게 4~5줄로 작성)

💰 재물운
: (핵심 요약 한 줄, 예: "꾸준한 노력이 돈으로 연결되는 시기예요")

(재물 흐름 + 구체적 조언을 자연스럽게 4~5줄로 작성)

규칙:
- message는 7단어 이내로 짧고 임팩트 있게 (~에요, ~세요 체). 예: "오늘은 잠깐 쉬어가는 하루에요!"
- explanation은 위 형식대로 구체적이고 실용적인 조언을 담아 작성하세요 (~에요, ~세요 체).
- 추상적이고 뻔한 말 대신, 상황별 분기(있다면/없다면), 구체적 행동 조언을 포함하세요.
- 👉, "한마디로", "핵심", "전체 정리" 같은 요약 섹션은 절대 사용하지 마세요.
- 각 카테고리는 "이모지 카테고리명\\n: 핵심 요약\\n\\n상세 풀이" 형식만 사용하세요.
- 생년월일의 별자리, 띠, 수비학적 요소를 참고하여 운세를 작성하세요.
- emotion은 오늘의 운세 메시지 분위기에 가장 잘 맞는 것을 선택하세요.
- 각 별점은 1~5 사이의 정수입니다.
- explanation 내 줄바꿈은 반드시 \\n으로 표현하세요.`,
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
