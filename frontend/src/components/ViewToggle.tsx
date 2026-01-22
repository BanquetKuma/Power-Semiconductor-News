import { useNewsStore } from '../stores/newsStore';
import type { ViewMode } from '../types/news';

interface ViewOption {
  key: ViewMode;
  label: string;
  icon: React.ReactNode;
}

const viewOptions: ViewOption[] = [
  {
    key: 'news',
    label: 'ニュース',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    key: 'trends',
    label: '投資家向けトレンド',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

export function ViewToggle() {
  const { currentView, setCurrentView } = useNewsStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
      {viewOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => setCurrentView(option.key)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${currentView === option.key
              ? 'bg-white text-[#0052CC] shadow-lg'
              : 'text-white/80 hover:text-white hover:bg-white/10'
            }
          `}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
