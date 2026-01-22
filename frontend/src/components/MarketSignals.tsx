import type { MarketSignals as MarketSignalsType } from '../types/news';

interface MarketSignalsProps {
  signals: MarketSignalsType;
}

export function MarketSignals({ signals }: MarketSignalsProps) {
  const hasSignals = signals.bullish.length > 0 || signals.bearish.length > 0 || signals.neutral.length > 0;

  if (!hasSignals) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          マーケットシグナル
        </h3>
      </div>

      <div className="p-5 grid gap-4 md:grid-cols-3">
        {/* Bullish signals */}
        {signals.bullish.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="font-semibold text-green-700">強気シグナル</span>
            </div>
            <ul className="space-y-2">
              {signals.bullish.map((signal, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 bg-green-50 rounded-lg p-3"
                >
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bearish signals */}
        {signals.bearish.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <span className="font-semibold text-red-700">弱気シグナル</span>
            </div>
            <ul className="space-y-2">
              {signals.bearish.map((signal, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 rounded-lg p-3"
                >
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Neutral signals */}
        {signals.neutral.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              </div>
              <span className="font-semibold text-blue-700">中立シグナル</span>
            </div>
            <ul className="space-y-2">
              {signals.neutral.map((signal, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 bg-blue-50 rounded-lg p-3"
                >
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
