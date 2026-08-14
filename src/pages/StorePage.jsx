import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useStars } from '../contexts/StarsContext';
import NavBar from '../components/NavBar';

const ERROR_MESSAGES = {
  insufficient_balance: '별가루가 부족합니다.',
  sold_out: '품절된 상품입니다.',
  product_not_found: '구매할 수 없는 상품입니다.',
};

// 섹션 제목 아이콘들
function StarPurchaseIcon() {
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.657 0L8.303 4.735L13.314 4.837L9.32 7.865L10.773 12.663L6.657 9.8L2.541 12.663L3.994 7.865L0 4.837L5.011 4.735L6.657 0Z" fill="#8B5CF6" />
    </svg>
  );
}

function StorageExpandIcon() {
  return (
    <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0H6.07143L7.89286 2.94737H17V14H0V0Z" fill="#8B5CF6" />
      <path d="M12 6H11V11H12V6Z" fill="#F9F7FD" />
      <path d="M14 8H9V9H14V8Z" fill="#F9F7FD" />
    </svg>
  );
}

function StoreCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="7" fill="#8B5CF6" />
      <circle cx="7" cy="7" r="4" fill="#F9F7FD" />
    </svg>
  );
}

const INITIAL_STAR_ITEM_COUNT = 4;

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hour}:${minute}`;
};

function StorePage() {
  const { user } = useAuth();
  const { skyStars, maxSkySlots } = useStars();

  const [products, setProducts] = useState([]);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [showAllStarItems, setShowAllStarItems] = useState(false);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2200);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('store_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error) setProducts(data || []);
  };

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('star_dust_balance')
      .eq('id', user.id)
      .single();
    setBalance(data?.star_dust_balance ?? 0);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('star_dust_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setTransactions(data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchBalance(), fetchTransactions()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePurchaseStarItem = async (product) => {
    if (purchasingId) return;
    if (product.stock !== null && product.stock <= 0) return;

    setPurchasingId(product.id);
    try {
      const { data, error } = await supabase.rpc('purchase_star_item', { p_product_id: product.id });
      if (error) throw error;

      if (!data.success) {
        showMessage(ERROR_MESSAGES[data.error] || '구매에 실패했습니다.');
      } else {
        setBalance(data.balance);
        showMessage(`${product.name}을(를) 구매했어요! 창고에서 확인해보세요.`);
        fetchProducts();
        fetchTransactions();
      }
    } catch (error) {
      console.error('별 구매 실패:', error);
      showMessage('구매 중 오류가 발생했습니다.');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleComingSoon = () => {
    showMessage('결제 기능은 준비 중입니다.');
  };

  const starItems = products.filter((p) => p.product_type === 'star_item');
  const visibleStarItems = showAllStarItems ? starItems : starItems.slice(0, INITIAL_STAR_ITEM_COUNT);
  const expansionOptions = products.filter((p) => p.product_type === 'storage_expansion');
  const starDustPackages = products.filter((p) => p.product_type === 'star_dust_package');

  const storageRatio = maxSkySlots > 0 ? Math.min(100, (skyStars.length / maxSkySlots) * 100) : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030025]">
      {/* 배경 이미지 */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat opacity-100"
        style={{ backgroundImage: 'url(/BackGround.jpg)' }}
      ></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-col min-h-screen pb-24">
        {/* 상단 네비게이션 */}
        <nav className="px-6 py-5">
          <div className="max-w-[370px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white font-bold text-2xl">별가루 스토어</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-300" />
              <span className="text-white text-sm font-bold">{balance ?? '-'}</span>
            </div>
          </div>
        </nav>

        {/* 안내 메시지 토스트 */}
        {message && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/90 px-5 py-3 rounded-xl shadow-lg">
            <span className="text-[#6155F5] text-sm font-bold">{message}</span>
          </div>
        )}

        <div className="flex-1 px-6">
          <div className="max-w-[370px] mx-auto space-y-8">
            {loading ? (
              <div className="text-white/60 text-center py-20">불러오는 중...</div>
            ) : (
              <>
                {/* 스타리 별 구매 */}
                <section>
                  <h2 className="text-white font-bold text-lg flex items-center gap-1.5">
                    <StarPurchaseIcon /> 스타리 별 구매
                  </h2>
                  <p className="text-white/50 text-xs mt-1">별자리에 특별함을 더해줄 커스텀 별!</p>

                  {starItems.length === 0 ? (
                    <p className="text-white/40 text-sm mt-4">등록된 상품이 없습니다.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {visibleStarItems.map((product) => {
                          const isSoldOut = product.stock !== null && product.stock <= 0;
                          return (
                            <button
                              key={product.id}
                              onClick={() => handlePurchaseStarItem(product)}
                              disabled={isSoldOut || purchasingId === product.id}
                              className="relative aspect-square bg-white/5 border border-white/10 rounded-2xl p-2 flex flex-col items-center justify-center gap-1 disabled:cursor-not-allowed hover:bg-white/10 transition"
                            >
                              {product.tag && (
                                <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#6155F5]/40 text-white text-[10px] font-bold flex items-center justify-center">
                                  {product.tag}
                                </span>
                              )}
                              <span className="absolute top-2 right-2 flex items-center gap-1 text-white/80 text-xs">
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                                {product.price_star_dust}
                              </span>

                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-[64%] aspect-square object-contain mt-3"
                                />
                              )}
                              <span className="text-white text-base font-bold">{product.name}</span>

                              {isSoldOut && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden">
                                  <span className="-rotate-12 text-white font-bold text-xs border-2 border-white px-3 py-1 tracking-wide">
                                    SOLD OUT
                                  </span>
                                </div>
                              )}
                              {purchasingId === product.id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                                  <span className="text-white text-xs">구매 중...</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {starItems.length > INITIAL_STAR_ITEM_COUNT && (
                        <button
                          onClick={() => setShowAllStarItems((v) => !v)}
                          className="w-full text-center text-white/50 text-sm mt-4 hover:text-white/80 transition"
                        >
                          {showAllStarItems ? '접기 -' : '더보기 +'}
                        </button>
                      )}
                    </>
                  )}
                </section>

                <div className="border-t border-white/10" />

                {/* 별 보관소 확장 */}
                <section>
                  <h2 className="text-white font-bold text-lg flex items-center gap-1.5">
                    <StorageExpandIcon /> 별 보관소 확장
                  </h2>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-4">
                    <div className="flex justify-between text-white text-sm mb-2">
                      <span>현재 보관함</span>
                      <span>{skyStars.length} / {maxSkySlots}칸</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6155F5] transition-all"
                        style={{ width: `${storageRatio}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    {expansionOptions.map((p) => (
                      <button
                        key={p.id}
                        onClick={handleComingSoon}
                        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition"
                      >
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                          +{p.slot_count}칸 확장
                          {p.tag && (
                            <span className="text-[10px] bg-[#6155F5]/40 text-white px-1.5 py-0.5 rounded">
                              {p.tag}
                            </span>
                          )}
                        </span>
                        <span className="text-white/70 text-sm">₩{p.price_krw?.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="border-t border-white/10" />

                {/* 별가루 충전 */}
                <section>
                  <h2 className="text-white font-bold text-lg flex items-center gap-1.5">
                    <StoreCircleIcon /> 별가루 충전
                  </h2>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {starDustPackages.map((p) => (
                      <button
                        key={p.id}
                        onClick={handleComingSoon}
                        className="relative rounded-2xl overflow-hidden border border-white/10 hover:brightness-110 transition"
                      >
                        {p.tag && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-[10px] font-bold bg-white text-[#6155F5] px-2 py-0.5 rounded-full shadow">
                            {p.tag}
                          </span>
                        )}
                        <div className="bg-[#8B5CF6] px-4 py-3 flex items-center justify-center gap-1.5">
                          <span className="text-white font-extrabold text-lg">{p.star_dust_amount}개</span>
                          {p.bonus_star_dust ? (
                            <span className="text-white text-[11px] font-bold bg-white/25 px-2 py-0.5 rounded-full">
                              +{p.bonus_star_dust}개
                            </span>
                          ) : null}
                        </div>
                        <div className="px-4 py-3 border-t border-white/20">
                          <span className="text-white font-bold text-base">{p.price_krw?.toLocaleString()}원</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="border-t border-white/10" />

                {/* 별가루 이용내역 */}
                <section>
                  <h2 className="text-white font-bold text-lg flex items-center gap-1.5">
                    <StoreCircleIcon /> 별가루 이용내역
                  </h2>

                  {transactions.length === 0 ? (
                    <p className="text-white/40 text-sm mt-4">이용 내역이 없습니다.</p>
                  ) : (
                    <div className="mt-3">
                      {transactions.map((tx, index) => (
                        <div
                          key={tx.id}
                          className={`flex justify-between items-center gap-4 max-w-[260px] mx-auto py-2.5 ${
                            index !== transactions.length - 1 ? 'border-b border-white/15' : ''
                          }`}
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="text-white font-bold text-base">
                              {tx.type === 'charge' ? '충전' : '구매'}
                            </span>
                            <span className="text-white/40 text-xs">
                              {formatDateTime(tx.created_at)}
                            </span>
                          </div>
                          <span className="text-white font-bold text-lg">
                            {tx.amount > 0 ? '+' : ''}{tx.amount}개
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 네비게이션 바 */}
      <NavBar />
    </div>
  );
}

export default StorePage;
