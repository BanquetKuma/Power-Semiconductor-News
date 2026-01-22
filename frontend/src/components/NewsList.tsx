import { useNewsStore } from '../stores/newsStore';
import { NewsCard } from './NewsCard';
import { FIELD_LABELS } from '../constants/fields';
import type { FieldKey } from '../types/news';

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
        {/* Spinning ring */}
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-[#0052CC] animate-spin"></div>
      </div>
      <span className="mt-4 text-sm font-medium text-gray-500">読み込み中...</span>
    </div>
  );
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        {isFiltered ? '本日は配信ニュースがありません' : 'ニュースがありません'}
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        {isFiltered
          ? 'この分野の最新ニュースは現在ありません。他の分野を選択してみてください。'
          : 'ニュースデータを取得中です。しばらくお待ちください。'}
      </p>
    </div>
  );
}

function StarExplanation() {
  return (
    <div className="group relative inline-flex items-center gap-1.5 cursor-help">
      <span className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200/50">
        <span className="text-amber-500">★</span>
        <span className="text-xs font-medium text-amber-700">重要度（1〜5）</span>
        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="font-semibold mb-2">重要度スコアの計算方法</div>
        <ul className="space-y-1 text-gray-300">
          <li className="flex justify-between">
            <span>鮮度</span>
            <span className="text-amber-400 font-medium">40%</span>
          </li>
          <li className="flex justify-between">
            <span>サプライズ度</span>
            <span className="text-amber-400 font-medium">25%</span>
          </li>
          <li className="flex justify-between">
            <span>大手企業関連</span>
            <span className="text-amber-400 font-medium">20%</span>
          </li>
          <li className="flex justify-between">
            <span>技術関連</span>
            <span className="text-amber-400 font-medium">10%</span>
          </li>
          <li className="flex justify-between">
            <span>ビジネス</span>
            <span className="text-amber-400 font-medium">5%</span>
          </li>
        </ul>
        {/* Arrow */}
        <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
      </div>
    </div>
  );
}

export function NewsList() {
  const { selectedField, isLoading, error, getCurrentItems, latestNews, fieldNews } = useNewsStore();
  const items = getCurrentItems();

  // Get highlight based on selected field
  const highlight = selectedField
    ? fieldNews[selectedField]?.highlight
    : latestNews?.highlight;

  const fieldLabel = selectedField ? FIELD_LABELS[selectedField as FieldKey] : null;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-red-800">エラーが発生しました</h3>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">
            {fieldLabel ? (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#0052CC] to-[#00B8D9]"></span>
                {fieldLabel}のニュース
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#0052CC] to-[#00B8D9]"></span>
                最新ニュース
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <StarExplanation />
          <span className="px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
            {items.length} 件
          </span>
        </div>
      </div>

      {/* Highlight Card */}
      {highlight && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 border border-amber-200/50 shadow-lg">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative">
            {/* Badge */}
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-sm font-semibold text-amber-700 shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                {highlight.category}
              </span>
              <div className="flex items-center gap-0.5">
                {[...Array(highlight.stars)].map((_, i) => (
                  <span key={i} className="text-amber-500 text-lg drop-shadow-sm">★</span>
                ))}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
              {highlight.sources?.[0] ? (
                <a
                  href={highlight.sources[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0052CC] transition-colors inline-flex items-start gap-2 group"
                >
                  <span>{highlight.title}</span>
                  <svg
                    className="w-5 h-5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-[#0052CC]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ) : (
                highlight.title
              )}
            </h3>

            {/* Summary */}
            <p className="text-gray-600 leading-relaxed">{highlight.summary}</p>
          </div>
        </div>
      )}

      {/* News Grid */}
      {items.length === 0 ? (
        <EmptyState isFiltered={!!selectedField} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={`${item.source.url}-${index}`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <NewsCard item={item} index={index} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
