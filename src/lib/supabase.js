import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aifioxdvjtxwxzxgdugs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZmlveGR2anR4d3h6eGdkdWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MjYyMzcsImV4cCI6MjA4MTIwMjIzN30.7AJPuTaQ7URKXX4RrrQaMCBiVM_BK9tQrNc6sN0toXs';

// 비밀번호 재설정 메일 링크로 들어왔는지 기록한다.
// 클라이언트 초기화가 URL의 토큰(#...type=recovery)을 정리하기 전에 확인해야 하므로 createClient보다 먼저 실행한다.
// (재설정 화면은 이 기록이 있을 때만 비밀번호 변경을 허용 — 로그인된 기기를 가진 제3자의 무단 변경 방지)
const PASSWORD_RECOVERY_KEY = 'starry_password_recovery_at';
const PASSWORD_RECOVERY_TTL_MS = 60 * 60 * 1000;

if (typeof window !== 'undefined' && /(^|[#&])type=recovery(&|$)/.test(window.location.hash)) {
  try {
    sessionStorage.setItem(PASSWORD_RECOVERY_KEY, String(Date.now()));
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 PASSWORD_RECOVERY 이벤트로만 판단한다
  }
}

export const isPasswordRecoveryPending = () => {
  try {
    const startedAt = Number(sessionStorage.getItem(PASSWORD_RECOVERY_KEY));
    return !!startedAt && Date.now() - startedAt < PASSWORD_RECOVERY_TTL_MS;
  } catch {
    return false;
  }
};

export const clearPasswordRecovery = () => {
  try {
    sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
  } catch {
    // 무시
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
