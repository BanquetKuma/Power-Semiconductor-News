import { create } from 'zustand';
import type { NewsData, FieldNewsData, NewsItem, FieldKey } from '../types/news';

interface NewsState {
  // Data
  latestNews: NewsData | null;
  fieldNews: Record<string, FieldNewsData>;

  // UI State
  selectedField: FieldKey | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setLatestNews: (data: NewsData) => void;
  setFieldNews: (field: FieldKey, data: FieldNewsData) => void;
  selectField: (field: FieldKey | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getCurrentItems: () => NewsItem[];
}

const getBasePath = (): string => {
  // For GitHub Pages deployment
  return import.meta.env.BASE_URL || '/Power-Semiconductor-News/';
};

export const useNewsStore = create<NewsState>((set, get) => ({
  latestNews: null,
  fieldNews: {},
  selectedField: null,
  isLoading: false,
  error: null,

  setLatestNews: (data) => set({ latestNews: data }),

  setFieldNews: (field, data) => set((state) => ({
    fieldNews: { ...state.fieldNews, [field]: data },
  })),

  selectField: (field) => set({ selectedField: field }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  getCurrentItems: () => {
    const { selectedField, latestNews, fieldNews } = get();

    if (!selectedField) {
      // Show all items from latest.json
      if (!latestNews) return [];
      const sections = latestNews.sections;
      return [
        ...sections.company,
        ...sections.tools,
        ...sections.business,
        ...sections.sns,
      ];
    }

    // Show items from field-specific JSON
    const fieldData = fieldNews[selectedField];
    if (!fieldData) return [];

    return [
      ...fieldData.sections.news,
      ...fieldData.sections.tech,
      ...fieldData.sections.market,
    ];
  },
}));

// Async data fetching
export async function fetchLatestNews(): Promise<NewsData> {
  const basePath = getBasePath();
  const response = await fetch(`${basePath}news/latest.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch latest news: ${response.status}`);
  }
  return response.json();
}

export async function fetchFieldNews(field: FieldKey): Promise<FieldNewsData | null> {
  const basePath = getBasePath();
  const response = await fetch(`${basePath}news/${field}.json`);

  // 404の場合は記事がない分野としてnullを返す
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${field} news: ${response.status}`);
  }

  // Content-Typeがjsonでない場合もnullを返す（Vite SPAフォールバック対策）
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}
