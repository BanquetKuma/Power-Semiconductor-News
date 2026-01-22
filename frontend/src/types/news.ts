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
