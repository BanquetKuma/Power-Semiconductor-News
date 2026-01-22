import { useEffect } from 'react';
import { useNewsStore, fetchTrendsData } from '../stores/newsStore';
import { TrendCard } from './TrendCard';
import { MarketSignals } from './MarketSignals';

export function TrendsView() {
  const { trendsData, isTrendsLoading, setTrendsData, setTrendsLoading, setError } = useNewsStore();

  useEffect(() => {
    async function loadTrends() {
      setTrendsLoading(true);
      try {
        const data = await fetchTrendsData();
        setTrendsData(data);
      } catch (err) {
        setError('トレンドデータの読み込みに失敗しました');
        console.error(err);
      } finally {
        setTrendsLoading(false);
      }
    }

    if (!trendsData) {
      loadTrends();
    }
  }, [trendsData, setTrendsData, setTrendsLoading, setError]);

  // Loading state
  if (isTrendsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-[#0052CC]/20 border-t-[#0052CC] rounded-full animate-spin mb-4" />
        <p className="text-gray-500">トレンドを分析中...</p>
      </div>
    );
  }

  // No data state
  if (!trendsData || trendsData.meta_trends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">トレンドデータがありません</h3>
        <p className="text-gray-500 text-sm">本日のニュース分析後に更新されます</p>
      </div>
    );
  }

  const generatedAt = trendsData.generated_at
    ? new Date(trendsData.generated_at).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Get the main trend for the analyst to speak about
  const mainTrend = trendsData.meta_trends[0];
  const otherTrends = trendsData.meta_trends.slice(1);

  return (
    <div className="space-y-8">
      {/* Analyst Character Section */}
      <div className="bg-gradient-to-br from-[#0747A6] via-[#0052CC] to-[#00B8D9] rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Character Image */}
          <div className="lg:w-1/3 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0052CC]/50 lg:bg-gradient-to-l z-10" />
            <img
              src={`${import.meta.env.BASE_URL}assets/analyst-character.png`}
              alt="Analyst"
              className="w-full h-64 lg:h-full object-cover object-center"
            />
          </div>

          {/* Speech Bubble */}
          <div className="lg:w-2/3 p-6 lg:p-8 flex flex-col justify-center">
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl">

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#0052CC] to-[#00B8D9]">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">本日の注目トレンド</h3>
                  <p className="text-xs text-gray-500">{generatedAt} 更新</p>
                </div>
              </div>

              {/* Main insight */}
              {mainTrend && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-semibold
                      ${mainTrend.momentum === 'rising' ? 'bg-green-100 text-green-700' : ''}
                      ${mainTrend.momentum === 'stable' ? 'bg-blue-100 text-blue-700' : ''}
                      ${mainTrend.momentum === 'declining' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {mainTrend.momentum === 'rising' && '↗ 上昇トレンド'}
                      {mainTrend.momentum === 'stable' && '→ 安定トレンド'}
                      {mainTrend.momentum === 'declining' && '↘ 下降トレンド'}
                    </span>
                    <span className="text-sm text-gray-500">
                      信頼度 {Math.round(mainTrend.confidence * 100)}%
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-[#0747A6]">{mainTrend.name}</h4>
                  <p className="text-gray-700 leading-relaxed">{mainTrend.summary}</p>

                  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-amber-800">投資示唆</span>
                    </div>
                    <p className="text-amber-900">{mainTrend.analysis.investment_implications}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow border border-gray-100">
          <svg className="w-5 h-5 text-[#0052CC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {trendsData.meta_trends.length} トレンド検出
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow border border-gray-100">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {trendsData.source_count} 件のニュースを分析
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-500">
            Gemini AI による分析
          </span>
        </div>
      </div>

      {/* Market Signals */}
      <MarketSignals signals={trendsData.market_signals} />

      {/* Other Trend Cards */}
      {otherTrends.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#0052CC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            その他のトレンド
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {otherTrends.map((trend, index) => (
              <TrendCard key={trend.name} trend={trend} index={index + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-gray-500">
            <p className="font-medium text-gray-600 mb-1">ご注意</p>
            <p>
              本分析はAIによる自動生成であり、投資助言ではありません。投資判断は自己責任で行ってください。
              掲載情報の正確性・完全性は保証されません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
