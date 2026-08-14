// 상점에서 구매한 이미지 기반 별을 여러 화면(2D 캔버스)에서 공유해서 로드/캐싱하기 위한 유틸.
// 이미지는 비동기로 로드되므로, 로드가 끝나면 'star-image-loaded' 이벤트를 window에 쏴서
// 각 화면의 캔버스 그리기 useEffect가 다시 그리도록 한다.
const cache = new Map(); // url -> HTMLImageElement

// 이미 로드된 이미지는 즉시 반환하고, 아니면 로드를 시작한 뒤 null을 반환한다.
// (호출부는 null이면 이번 프레임엔 그리지 않고, 로드 완료 이벤트를 받으면 다시 그림)
export function getStarImage(url) {
  if (!url) return null;

  const cached = cache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) return cached;
  if (cached) return null; // 로딩 중

  const img = new Image();
  // CORS 허용 없이 그리면 캔버스가 "오염"되어 toDataURL/getImageData가 막힌다
  // (AI 별자리 이름 찾기 캡처, 별자리 이미지 캡쳐 등에서 SecurityError 발생 원인).
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    window.dispatchEvent(new CustomEvent('star-image-loaded', { detail: { url } }));
  };
  img.onerror = () => {
    cache.delete(url);
  };
  img.src = url;
  cache.set(url, img);
  return null;
}
