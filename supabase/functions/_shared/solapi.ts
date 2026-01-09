// Solapi SMS 발송 유틸리티

export interface SolapiConfig {
  apiKey: string;
  apiSecret: string;
  sender: string; // 발신번호 (하이픈 없이)
}

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * HMAC-SHA256 서명 생성
 */
async function createSignature(
  message: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatureHex;
}

/**
 * 랜덤 Salt 생성
 */
function generateSalt(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 20; i++) {
    salt += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return salt;
}

/**
 * Solapi API를 사용하여 SMS 발송
 * @param config - Solapi 설정
 * @param to - 수신 전화번호 (010-1234-5678 형식)
 * @param message - 메시지 내용
 * @returns Promise<SendSMSResult>
 */
export async function sendSMS(
  config: SolapiConfig,
  to: string,
  message: string
): Promise<SendSMSResult> {
  try {
    // 전화번호에서 하이픈 제거
    const cleanTo = to.replace(/-/g, '');
    const cleanFrom = config.sender.replace(/-/g, '');

    // Solapi API 요청
    const url = 'https://api.solapi.com/messages/v4/send';

    // 인증 헤더 생성
    const date = new Date().toISOString();
    const salt = generateSalt();
    const signature = await createSignature(date + salt, config.apiSecret);

    const authHeader = `HMAC-SHA256 apiKey=${config.apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

    const payload = {
      message: {
        to: cleanTo,
        from: cleanFrom,
        text: message,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        messageId: result.messageId || result.groupId,
      };
    } else {
      console.error('Solapi API error:', result);
      return {
        success: false,
        error: result.errorMessage || result.message || 'SMS 발송에 실패했습니다.',
      };
    }
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS 발송 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 인증번호 SMS 메시지 생성
 * @param code - 인증번호
 * @returns 메시지 내용
 */
export function createVerificationMessage(code: string): string {
  return `[Starry] 인증번호는 [${code}]입니다. 3분 내에 입력해주세요.`;
}

/**
 * 전화번호 유효성 검사 (한국 휴대전화 번호)
 * @param phoneNumber - 전화번호 (010-1234-5678 형식)
 * @returns boolean - 유효 여부
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // 010-1234-5678 형식 검증
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  return phoneRegex.test(phoneNumber);
}
