export interface NewsSource {
  name: string;
  url: string;
}

export interface NewsField {
  primary: string | null;
  device: string | null;
  process: string | null;
  market: string | null;
  industry: string | null;
}

export interface SnsInfo {
  handle: string;
  display_name: string;
  posted_at: string;
}

export interface NewsItem {
  title: string;
  blurb: string;
  category: 'business' | 'tools' | 'company' | 'sns';
  date: string;
  stars: number;
  source: NewsSource;
  field: NewsField | null;
  sns?: SnsInfo;
}

export interface Highlight {
  category: string;
  stars: number;
  title: string;
  summary: string;
  sources: NewsSource[];
}

export interface NewsData {
  generated_at: string;
  highlight: Highlight | null;
  sections: {
    business: NewsItem[];
    tools: NewsItem[];
    company: NewsItem[];
    sns: NewsItem[];
  };
}

export interface FieldNewsData {
  generated_at: string;
  field: string;
  field_label: string;
  highlight: Highlight | null;
  sections: {
    news: NewsItem[];
    tech: NewsItem[];
    market: NewsItem[];
  };
}

export type FieldKey =
  | 'power' | 'memory' | 'logic' | 'analog' | 'image'
  | 'ai' | 'automotive' | 'datacenter' | 'industrial'
  | 'foundry' | 'fabless' | 'idm' | 'geopolitics'
  | 'frontend' | 'backend' | 'miniaturization' | 'equipment' | 'wafer'
  | 'general';

// --- Trends types for investor view ---

export type TrendMomentum = 'rising' | 'stable' | 'declining';

export interface TrendAnalysis {
  short_term: string;
  mid_term: string;
  investment_implications: string;
}

export interface MetaTrend {
  name: string;
  confidence: number;
  momentum: TrendMomentum;
  related_fields: FieldKey[];
  summary: string;
  analysis: TrendAnalysis;
  keywords: string[];
  companies_mentioned: string[];
}

export interface MarketSignals {
  bullish: string[];
  bearish: string[];
  neutral: string[];
}

export interface TrendsData {
  generated_at: string;
  date: string;
  meta_trends: MetaTrend[];
  market_signals: MarketSignals;
  source_count: number;
}

export type ViewMode = 'news' | 'trends';
