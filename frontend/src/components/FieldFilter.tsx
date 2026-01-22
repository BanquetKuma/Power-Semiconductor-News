import { FIELD_AXES, FIELD_LABELS } from '../constants/fields';
import { useNewsStore, fetchFieldNews } from '../stores/newsStore';
import type { FieldKey, FieldNewsData } from '../types/news';

// Atlassian-style color palette for each axis
const AXIS_COLORS: Record<string, { gradient: string; icon: string }> = {
  material: {
    gradient: 'from-blue-500 to-indigo-600',
    icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  },
  application: {
    gradient: 'from-green-500 to-emerald-600',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  process: {
    gradient: 'from-purple-500 to-fuchsia-600',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
};

// Field-specific colors
const FIELD_COLORS: Record<string, { bg: string; bgHover: string; text: string; border: string; selected: string }> = {
  sic: { bg: 'bg-blue-50', bgHover: 'hover:bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', selected: 'bg-blue-600' },
  gan: { bg: 'bg-purple-50', bgHover: 'hover:bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', selected: 'bg-purple-600' },
  gaas: { bg: 'bg-indigo-50', bgHover: 'hover:bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', selected: 'bg-indigo-600' },
  diamond: { bg: 'bg-cyan-50', bgHover: 'hover:bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', selected: 'bg-cyan-600' },
  galliumoxide: { bg: 'bg-teal-50', bgHover: 'hover:bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', selected: 'bg-teal-600' },
  ev: { bg: 'bg-green-50', bgHover: 'hover:bg-green-100', text: 'text-green-700', border: 'border-green-200', selected: 'bg-green-600' },
  renewable: { bg: 'bg-emerald-50', bgHover: 'hover:bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', selected: 'bg-emerald-600' },
  datacenter: { bg: 'bg-orange-50', bgHover: 'hover:bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', selected: 'bg-orange-600' },
  industrial: { bg: 'bg-amber-50', bgHover: 'hover:bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', selected: 'bg-amber-600' },
  wafer: { bg: 'bg-rose-50', bgHover: 'hover:bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', selected: 'bg-rose-600' },
  epitaxy: { bg: 'bg-pink-50', bgHover: 'hover:bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', selected: 'bg-pink-600' },
  module: { bg: 'bg-fuchsia-50', bgHover: 'hover:bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200', selected: 'bg-fuchsia-600' },
  general: { bg: 'bg-slate-50', bgHover: 'hover:bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', selected: 'bg-slate-700' },
};

export function FieldFilter() {
  const { selectedField, selectField, fieldNews, setFieldNews, setLoading, setError } = useNewsStore();

  const handleFieldClick = async (field: FieldKey) => {
    if (selectedField === field) {
      // Toggle off if same field clicked
      selectField(null);
      return;
    }

    selectField(field);

    // Fetch field data if not already loaded
    if (!fieldNews[field]) {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFieldNews(field);
        if (data) {
          setFieldNews(field, data);
        } else {
          // 404の場合は空のデータを設定（再フェッチ防止）
          const emptyData: FieldNewsData = {
            generated_at: new Date().toISOString(),
            field: field,
            field_label: FIELD_LABELS[field] || field,
            highlight: null,
            sections: {
              news: [],
              tech: [],
              market: [],
            },
          };
          setFieldNews(field, emptyData);
        }
      } catch (err) {
        setError(`分野「${field}」のデータを読み込めませんでした`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <aside className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#0052CC] to-[#00B8D9]">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          分野フィルター
        </h2>
      </div>

      <div className="p-4 space-y-5">
        {FIELD_AXES.map((axis) => {
          const axisColors = AXIS_COLORS[axis.nameEn] || AXIS_COLORS.material;
          return (
            <div key={axis.nameEn} className="space-y-2.5">
              {/* Axis Header */}
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${axisColors.gradient} flex items-center justify-center`}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={axisColors.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {axis.name}
                </h3>
              </div>

              {/* Field Buttons */}
              <div className="flex flex-wrap gap-2 pl-8">
                {axis.fields.map((field) => {
                  const isSelected = selectedField === field.key;
                  const colors = FIELD_COLORS[field.key] || FIELD_COLORS.general;

                  return (
                    <button
                      key={field.key}
                      onClick={() => handleFieldClick(field.key)}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-lg
                        transition-all duration-200 transform
                        ${isSelected
                          ? `${colors.selected} text-white shadow-md scale-105`
                          : `${colors.bg} ${colors.text} ${colors.bgHover} border ${colors.border} hover:scale-102 hover:shadow-sm`
                        }
                      `}
                    >
                      {isSelected && (
                        <span className="inline-flex mr-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      {field.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white text-xs text-gray-400">その他</span>
          </div>
        </div>

        {/* General field button */}
        <button
          onClick={() => handleFieldClick('general')}
          className={`
            w-full px-4 py-2.5 text-sm font-medium rounded-xl
            transition-all duration-200 flex items-center justify-center gap-2
            ${selectedField === 'general'
              ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 hover:shadow-sm'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          半導体全般
          {selectedField === 'general' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Clear filter button */}
        {selectedField && (
          <button
            onClick={() => selectField(null)}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-gray-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            フィルターをクリア
          </button>
        )}
      </div>
    </aside>
  );
}
