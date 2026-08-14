// 상점 결제 승인 Edge Function
// 토스 결제 성공 후 클라이언트가 "성공했다"고 보고하는 것을 그대로 믿지 않고,
// 시크릿 키로 토스 서버에 직접 승인 요청을 보내 검증한 뒤에만 별가루/보관소 슬롯을 지급한다.
// (TOSS_SECRET_KEY는 이 함수 환경변수에만 존재하며 클라이언트에는 절대 노출되지 않는다)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const TOSS_SECRET_KEY = Deno.env.get('TOSS_SECRET_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: '로그인이 필요합니다.' }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: '유효하지 않은 세션입니다.' }, 401);

    const { paymentKey, orderId, amount } = await req.json();
    if (!paymentKey || !orderId || typeof amount !== 'number') {
      return json({ error: '잘못된 결제 정보입니다.' }, 400);
    }

    // 본인 소유의 대기중인 결제만 조회
    const { data: payment, error: paymentErr } = await admin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (paymentErr || !payment) {
      return json({ error: '결제 정보를 찾을 수 없습니다.' }, 404);
    }

    if (payment.status === 'paid') {
      // 이미 처리된 결제(중복 콜백/새로고침) - 그대로 성공 응답
      return json({ success: true });
    }

    if (payment.status !== 'pending') {
      return json({ error: '처리할 수 없는 결제 상태입니다.' }, 400);
    }

    // 금액 위변조 방지: 결제 준비 시 서버가 기록해둔 금액과 대조
    if (payment.amount_krw !== amount) {
      await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id).eq('status', 'pending');
      return json({ error: '결제 금액이 일치하지 않습니다.' }, 400);
    }

    // 토스 결제 승인 API 호출
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${TOSS_SECRET_KEY}:`)}`,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id).eq('status', 'pending');
      console.error('토스 결제 승인 실패:', tossData);
      return json({ error: tossData?.message || '결제 승인에 실패했습니다.' }, 400);
    }

    // pending -> paid 원자 전이. 실제로 이 요청이 상태를 바꾼 경우에만 아래 지급 로직을 실행해
    // 동시에 들어온 중복 콜백이 두 번 지급되는 것을 막는다.
    const { data: updated, error: updateErr } = await admin
      .from('payments')
      .update({ status: 'paid', payment_key: paymentKey, approved_at: new Date().toISOString() })
      .eq('id', payment.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (updateErr) {
      console.error('payments 상태 갱신 실패:', updateErr);
      throw new Error('결제 처리 중 오류가 발생했습니다.');
    }

    if (updated) {
      const { data: product } = await admin
        .from('store_products')
        .select('*')
        .eq('id', payment.product_id)
        .maybeSingle();

      if (product && payment.product_type === 'star_dust_package') {
        const total = (product.star_dust_amount || 0) + (product.bonus_star_dust || 0);
        const { error: creditErr } = await admin.rpc('credit_star_dust', {
          p_user_id: user.id,
          p_amount: total,
          p_description: product.name,
          p_product_id: product.id,
        });
        if (creditErr) console.error('별가루 지급 실패:', creditErr);
      } else if (product && payment.product_type === 'storage_expansion') {
        const { error: expandErr } = await admin.rpc('expand_storage', {
          p_user_id: user.id,
          p_slot_count: product.slot_count,
        });
        if (expandErr) console.error('보관소 확장 실패:', expandErr);
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error('confirm-store-payment error:', error);
    return json(
      { error: error instanceof Error ? error.message : '결제 처리에 실패했습니다.' },
      500
    );
  }
});
