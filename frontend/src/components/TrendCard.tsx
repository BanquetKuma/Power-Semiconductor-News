import type { MetaTrend, TrendMomentum } from '../types/news';

interface TrendCardProps {
  trend: MetaTrend;
  index: number;
}

const momentumConfig: Record<TrendMomentum, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  rising: {
    label: '上昇',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  stable: {
    label: '安定',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
  },
  declining: {
    label: '下降',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
  },
};

const FIELD_LABELS: Record<string, string> = {
  power: 'パワー半導体',
  memory: 'メモリ',
  logic: 'ロジック',
  analog: 'アナログ',
  image: 'イメージセンサ',
  ai: 'AI半導体',
  automotive: '車載',
  datacenter: 'データセンター',
  industrial: '産業機器',
  foundry: 'ファウンドリ',
  fabless: 'ファブレス',
  idm: 'IDM',
  geopolitics: '地政学',
  frontend: '前工程',
  backend: '後工程',
  miniaturization: '微細化',
  equipment: '製造装置',
  wafer: 'ウェーハ',
  general: '全般',
};

export function TrendCard({ trend, index }: TrendCardProps) {
  const momentum = momentumConfig[trend.momentum];
  const confidencePercent = Math.round(trend.confidence * 100);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0747A6] to-[#0052CC] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white font-bold text-sm">
              {index + 1}
            </span>
            <h3 className="text-lg font-bold text-white">{trend.name}</h3>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${momentum.bgColor} ${momentum.color}`}>
            {momentum.icon}
            <span className="text-sm font-medium">{momentum.label}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Summary */}
        <p className="text-gray-700 leading-relaxed">{trend.summary}</p>

        {/* Confidence meter */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium w-16">信頼度</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#0052CC] to-[#00B8D9] h-2 rounded-full transition-all duration-500"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-[#0052CC] w-12 text-right">{confidencePercent}%</span>
        </div>

        {/* Analysis sections */}
        <div className="grid gap-3">
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold text-blue-700">短期見通し（1-3ヶ月）</span>
            </div>
            <p className="text-sm text-blue-900">{trend.analysis.short_term}</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-purple-700">中期見通し（半年-1年）</span>
            </div>
            <p className="text-sm text-purple-900">{trend.analysis.mid_term}</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold text-amber-700">投資示唆</span>
            </div>
            <p className="text-sm text-amber-900">{trend.analysis.investment_implications}</p>
          </div>
        </div>

        {/* Related fields */}
        {trend.related_fields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {trend.related_fields.map((field) => (
              <span
                key={field}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium"
              >
                {FIELD_LABELS[field] || field}
              </span>
            ))}
          </div>
        )}

        {/* Keywords and companies */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {trend.keywords.map((keyword) => (
            <span
              key={keyword}
              className="px-2 py-0.5 bg-[#0052CC]/10 text-[#0052CC] text-xs rounded font-medium"
            >
              #{keyword}
            </span>
          ))}
          {trend.companies_mentioned.map((company) => (
            <span
              key={company}
              className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium"
            >
              {company}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
