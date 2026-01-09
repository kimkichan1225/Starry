// Rate Limiting 유틸리티
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequestsPerMinute: 1,  // 1분에 1회
  maxRequestsPerHour: 5,     // 1시간에 5회
};

/**
 * Rate Limiting 체크
 * @param supabaseClient - Supabase 클라이언트
 * @param phoneNumber - 전화번호
 * @param config - Rate Limit 설정
 * @returns Promise<{ allowed: boolean; reason?: string }>
 */
export async function checkRateLimit(
  supabaseClient: ReturnType<typeof createClient>,
  phoneNumber: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // 1분 내 요청 수 확인
  const { data: recentRequests, error: recentError } = await supabaseClient
    .from('sms_rate_limits')
    .select('*')
    .eq('phone_number', phoneNumber)
    .gte('window_start', oneMinuteAgo.toISOString())
    .order('window_start', { ascending: false });

  if (recentError) {
    console.error('Rate limit check error:', recentError);
    return { allowed: true }; // 에러 시 허용 (fallback)
  }

  // 1분 내 요청이 있는 경우
  if (recentRequests && recentRequests.length > 0) {
    const totalRecentRequests = recentRequests.reduce(
      (sum, record) => sum + record.request_count,
      0
    );

    if (totalRecentRequests >= config.maxRequestsPerMinute) {
      const lastRequest = recentRequests[0];
      const nextAllowedTime = new Date(lastRequest.window_start);
      nextAllowedTime.setMinutes(nextAllowedTime.getMinutes() + 1);
      const retryAfter = Math.ceil((nextAllowedTime.getTime() - now.getTime()) / 1000);

      return {
        allowed: false,
        reason: '1분에 1회만 요청할 수 있습니다.',
        retryAfter,
      };
    }
  }

  // 1시간 내 요청 수 확인
  const { data: hourlyRequests, error: hourlyError } = await supabaseClient
    .from('sms_rate_limits')
    .select('*')
    .eq('phone_number', phoneNumber)
    .gte('window_start', oneHourAgo.toISOString());

  if (hourlyError) {
    console.error('Hourly rate limit check error:', hourlyError);
    return { allowed: true }; // 에러 시 허용 (fallback)
  }

  if (hourlyRequests && hourlyRequests.length > 0) {
    const totalHourlyRequests = hourlyRequests.reduce(
      (sum, record) => sum + record.request_count,
      0
    );

    if (totalHourlyRequests >= config.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: '1시간에 최대 5회까지만 요청할 수 있습니다.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Rate Limit 기록 추가
 * @param supabaseClient - Supabase 클라이언트
 * @param phoneNumber - 전화번호
 */
export async function recordRequest(
  supabaseClient: ReturnType<typeof createClient>,
  phoneNumber: string
): Promise<void> {
  const now = new Date();

  // 새로운 요청 기록 추가
  const { error } = await supabaseClient
    .from('sms_rate_limits')
    .insert({
      phone_number: phoneNumber,
      request_count: 1,
      window_start: now.toISOString(),
    });

  if (error) {
    console.error('Failed to record request:', error);
  }
}

/**
 * 오래된 Rate Limit 기록 정리 (1시간 이전 데이터 삭제)
 * @param supabaseClient - Supabase 클라이언트
 */
export async function cleanupOldRecords(
  supabaseClient: ReturnType<typeof createClient>
): Promise<void> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { error } = await supabaseClient
    .from('sms_rate_limits')
    .delete()
    .lt('window_start', oneHourAgo.toISOString());

  if (error) {
    console.error('Failed to cleanup old records:', error);
  }
}
