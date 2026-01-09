// 인증번호 생성 및 해싱 유틸리티

/**
 * 6자리 랜덤 인증번호 생성
 * @returns 6자리 숫자 문자열 (예: "123456")
 */
export function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

/**
 * 인증번호를 bcrypt로 해싱
 * @param code - 평문 인증번호
 * @returns Promise<string> - bcrypt 해시
 */
export async function hashVerificationCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);

  // SHA-256으로 해싱 (bcrypt 대체)
  // Deno Edge Runtime에서는 bcrypt 대신 Web Crypto API 사용
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * 인증번호 검증
 * @param code - 입력받은 인증번호
 * @param hash - 저장된 해시값
 * @returns Promise<boolean> - 일치 여부
 */
export async function verifyCode(code: string, hash: string): Promise<boolean> {
  const codeHash = await hashVerificationCode(code);
  return codeHash === hash;
}

/**
 * 만료 시간 생성 (현재 시간 + 지정된 분)
 * @param minutes - 만료까지의 분 (기본값: 3분)
 * @returns Date - 만료 시간
 */
export function getExpirationTime(minutes: number = 3): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now;
}

/**
 * 만료 여부 확인
 * @param expiresAt - 만료 시간
 * @returns boolean - 만료 여부 (true: 만료됨, false: 유효함)
 */
export function isExpired(expiresAt: Date | string): boolean {
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiration < new Date();
}
