import { useEffect } from 'react';
import { Header } from './components/Header';
import { FieldFilter } from './components/FieldFilter';
import { NewsList } from './components/NewsList';
import { useNewsStore, fetchLatestNews } from './stores/newsStore';

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#00B8D9] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Semiconductor News</h3>
                <p className="text-xs text-gray-500">Power Semiconductor Edition</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              半導体業界の最新ニュースをAIで自動収集・分析。重要度でランク付けし、効率的な情報収集をサポートします。
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">機能</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                重要度スコアリング
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                自動ニュース収集
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                分野別フィルタリング
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                AI要約・分析
              </li>
            </ul>
          </div>

          {/* Coverage */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">カバー分野</h4>
            <div className="flex flex-wrap gap-2">
              {['SiC', 'GaN', 'GaAs', 'ダイヤモンド', 'EV', '再エネ', 'データセンター'].map((field) => (
                <span key={field} className="px-2 py-1 bg-gray-800 rounded-md text-xs text-gray-400 border border-gray-700">
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; 2024 Semiconductor News. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              データは自動更新されています
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const { setLatestNews, setLoading, setError } = useNewsStore();

  useEffect(() => {
    async function loadLatestNews() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLatestNews();
        setLatestNews(data);
      } catch (err) {
        setError('ニュースデータの読み込みに失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadLatestNews();
  }, [setLatestNews, setLoading, setError]);

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with filters */}
          <div className="lg:w-72 flex-shrink-0">
            <FieldFilter />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <NewsList />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
