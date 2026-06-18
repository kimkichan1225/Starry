// Vercel 서버리스 함수: survey 링크를 메신저에 공유할 때 대상자 닉네임이 들어간
// 동적 링크 미리보기(Open Graph)를 제공한다.
// - 크롤러/사용자 모두에게 OG 태그가 주입된 HTML을 반환하고, 실제 화면은 SPA가 렌더한다.
// - /survey/:userId 만 처리한다 (vercel.json rewrite). 하위 경로(/questions 등)는 SPA로 간다.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://aifioxdvjtxwxzxgdugs.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZmlveGR2anR4d3h6eGdkdWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MjYyMzcsImV4cCI6MjA4MTIwMjIzN30.7AJPuTaQ7URKXX4RrrQaMCBiVM_BK9tQrNc6sN0toXs';

// HTML 속성에 안전하게 넣기 위한 이스케이프
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  const { userId } = req.query;
  const host = req.headers.host;
  const origin = `https://${host}`;

  // 대상자 닉네임 조회 (public_profiles)
  let nickname = '';
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/public_profiles?id=eq.${encodeURIComponent(userId)}&select=nickname`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const rows = await r.json();
    nickname = rows?.[0]?.nickname || '';
  } catch {
    // 조회 실패 시 닉네임 없이 기본 문구로 폴백
  }

  const title = nickname
    ? `${nickname}님에게 별을 선물해주세요! ⭐`
    : '별을 선물해주세요! ⭐';
  const description = nickname
    ? `간단한 설문에 답하고 ${nickname}님의 밤하늘에 별 하나를 더해주세요.`
    : '간단한 설문에 답하고 친구의 밤하늘에 별 하나를 더해주세요.';
  const image = `${origin}/BackGround.jpg`;
  const url = `${origin}/survey/${encodeURIComponent(userId)}`;

  // 빌드된 SPA HTML을 가져와(자산 해시 유지) head의 기존 OG/타이틀을 동적 값으로 교체
  let html;
  try {
    html = await fetch(`${origin}/index.html`).then((r) => r.text());
  } catch {
    html = '<!doctype html><html><head></head><body><div id="root"></div></body></html>';
  }

  // 기존 OG/twitter/description 메타 및 title 제거 후 재주입 (중복 방지)
  html = html
    .replace(/<meta\s+(?:property|name)="(?:og:[^"]*|twitter:[^"]*|description)"[^>]*>\s*/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/i, '');

  const injected = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  `;

  const out = html.replace('</head>', `${injected}</head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // 크롤러 캐시: 5분 신선 + 10분 stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).send(out);
}
