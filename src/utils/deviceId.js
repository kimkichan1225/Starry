// 비로그인 설문 응답자의 기기를 구분하기 위한 ID (localStorage에 보관)
// 서버(submit_survey_star)는 같은 기기에서 같은 대상에게 연속 전송하는 것을 막는 용도로만 사용한다.
const STORAGE_KEY = 'starry_device_id';
let memoryId = null;

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // randomUUID가 없는 구형 인앱 브라우저용 대체 생성
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getDeviceId() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    const id = createId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // 저장소 접근이 막힌 환경에서는 페이지 세션 동안만 유지
    if (!memoryId) memoryId = createId();
    return memoryId;
  }
}
