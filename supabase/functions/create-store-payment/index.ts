// 상점 결제 준비 Edge Function
// 클라이언트가 가격을 임의로 보내는 것을 신뢰하지 않고, 서버가 store_products에서
// 가격을 직접 조회해 payments에 pending 주문을 기록한 뒤 그 값만 클라이언트에 돌려준다.
// (토스 결제 승인 단계에서 이 기록된 amount_krw와 실제 결제 금액을 대조해 위변조를 막는다)
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

    const { productId } = await req.json();
    if (!productId || typeof productId !== 'string') {
      return json({ error: '잘못된 요청입니다.' }, 400);
    }

    const { data: product, error: productErr } = await admin
      .from('store_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .in('product_type', ['star_dust_package', 'storage_expansion'])
      .maybeSingle();

    if (productErr || !product) {
      return json({ error: '구매할 수 없는 상품입니다.' }, 404);
    }
    if (!product.price_krw || product.price_krw <= 0) {
      return json({ error: '상품 가격 정보가 올바르지 않습니다.' }, 400);
    }

    const orderId = crypto.randomUUID();

    const { error: insertErr } = await admin.from('payments').insert({
      user_id: user.id,
      order_id: orderId,
      product_id: product.id,
      product_type: product.product_type,
      amount_krw: product.price_krw,
      status: 'pending',
    });

    if (insertErr) {
      console.error('create-store-payment insert error:', insertErr);
      throw new Error('결제 준비에 실패했습니다.');
    }

    return json({
      orderId,
      amount: product.price_krw,
      orderName: product.name,
    });
  } catch (error) {
    console.error('create-store-payment error:', error);
    return json(
      { error: error instanceof Error ? error.message : '결제 준비에 실패했습니다.' },
      500
    );
  }
});
