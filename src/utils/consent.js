import { supabase } from '../lib/supabase';

// 약관·개인정보처리방침 버전 (각 페이지 부칙의 시행일과 맞춘다)
export const TERMS_VERSION = '2026-07-12';
export const PRIVACY_VERSION = '2026-09-11';

// 가입 가능한 최소 만 나이 (DB 트리거·record_consent와 같은 기준)
export const MIN_SIGNUP_AGE = 14;

export const EMPTY_CONSENT = { terms: false, privacy: false, age: false };

export const isConsentComplete = (consent) => consent.terms && consent.privacy && consent.age;

// 'YYYY-MM-DD'가 실제로 존재하는 날짜인지 (2월 31일 등 차단)
export function isValidBirthdate(birthdate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate || '');
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// 오늘 기준 만 나이가 기준 이상인지
export function isOldEnough(birthdate, minAge = MIN_SIGNUP_AGE) {
  if (!isValidBirthdate(birthdate)) return false;
  const [year, month, day] = birthdate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1;
  }
  return age >= minAge;
}

// 만 14세가 되는 가장 늦은 생년월일 (날짜 입력 max 값용)
export function getMaxBirthdate(minAge = MIN_SIGNUP_AGE) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - minAge);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// 동의 기록 저장 (서버 시각으로 기록, profiles 생년월일 기준 만 14세 미만이면 거절)
export async function recordConsent() {
  const { data, error } = await supabase.rpc('record_consent', {
    p_terms_version: TERMS_VERSION,
    p_privacy_version: PRIVACY_VERSION,
  });
  if (error) {
    console.error('동의 기록 요청 실패:', error);
    return { success: false, error: 'request_failed' };
  }
  return data;
}
