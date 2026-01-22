import type { NewsItem } from '../types/news';
import { FIELD_LABELS } from '../constants/fields';
import type { FieldKey } from '../types/news';

interface NewsCardProps {
  item: NewsItem;
  index?: number;
}

// Atlassian-style color mapping for fields
const FIELD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  sic: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  gan: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  gaas: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  diamond: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  galliumoxide: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  ev: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  renewable: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  datacenter: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  industrial: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  wafer: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  epitaxy: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  module: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  general: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

function StarRating({ stars }: { stars: number }) {
  const filledStars = Math.min(stars, 5);
  const emptyStars = Math.max(0, 5 - stars);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(filledStars)].map((_, i) => (
        <span
          key={`filled-${i}`}
          className="text-amber-400 text-sm drop-shadow-sm"
          style={{
            animationDelay: `${i * 50}ms`,
          }}
        >
          ★
        </span>
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-300 text-sm">
          ☆
        </span>
      ))}
    </div>
  );
}

function FieldBadge({ fieldKey }: { fieldKey: FieldKey }) {
  const label = FIELD_LABELS[fieldKey];
  const colors = FIELD_COLORS[fieldKey] || FIELD_COLORS.general;

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1
        ${colors.bg} ${colors.text} ${colors.border}
        text-xs font-semibold rounded-md border
        transition-all duration-200 hover:scale-105
      `}
    >
      {label}
    </span>
  );
}

export function NewsCard({ item, index = 0 }: NewsCardProps) {
  const primaryField = item.field?.primary as FieldKey | undefined;

  // High importance cards (4-5 stars) get special styling
  const isHighImportance = item.stars >= 4;

  return (
    <article
      className={`
        relative overflow-hidden
        bg-white rounded-xl
        border transition-all duration-300
        hover:shadow-lg hover:-translate-y-1
        ${isHighImportance
          ? 'border-amber-200 shadow-md ring-1 ring-amber-100'
          : 'border-gray-100 shadow-sm'
        }
      `}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* High importance indicator */}
      {isHighImportance && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
      )}

      <div className="p-5">
        <div className="flex flex-col gap-3">
          {/* Header with date and stars */}
          <div className="flex items-center justify-between">
            <time className="text-xs font-medium text-gray-400 tracking-wide uppercase">
              {item.date}
            </time>
            <StarRating stars={item.stars} />
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 leading-snug group">
            <a
              href={item.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0052CC] transition-colors duration-200 inline-flex items-start gap-1"
            >
              <span className="flex-1">{item.title}</span>
              <svg
                className="w-4 h-4 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-[#0052CC]"
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
          </h3>

          {/* Blurb */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {item.blurb}
          </p>

          {/* Footer with source and field badge */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-500">
                  {item.source.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {item.source.name}
              </span>
            </div>
            {primaryField && <FieldBadge fieldKey={primaryField} />}
          </div>
        </div>
      </div>
    </article>
  );
}
