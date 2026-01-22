import type { FieldKey } from '../types/news';

export interface FieldDefinition {
  key: FieldKey;
  label: string;
  labelEn: string;
}

export interface FieldAxis {
  name: string;
  nameEn: string;
  fields: FieldDefinition[];
}

export const FIELD_LABELS: Record<FieldKey, string> = {
  power: 'パワー半導体',
  memory: 'メモリ半導体',
  logic: 'ロジック半導体',
  analog: 'アナログ半導体',
  image: 'イメージセンサ',
  ai: 'AI半導体',
  automotive: '車載半導体',
  datacenter: 'データセンター',
  industrial: '産業機器',
  foundry: 'ファウンドリ',
  fabless: 'ファブレス',
  idm: 'IDM',
  geopolitics: '地政学・規制',
  frontend: '前工程',
  backend: '後工程',
  miniaturization: '微細化',
  equipment: '製造装置',
  wafer: 'ウェーハ',
  general: '半導体全般',
};

export const FIELD_AXES: FieldAxis[] = [
  {
    name: 'デバイスの種類',
    nameEn: 'Device Type',
    fields: [
      { key: 'power', label: 'パワー半導体', labelEn: 'Power' },
      { key: 'memory', label: 'メモリ半導体', labelEn: 'Memory' },
      { key: 'logic', label: 'ロジック半導体', labelEn: 'Logic' },
      { key: 'analog', label: 'アナログ半導体', labelEn: 'Analog' },
      { key: 'image', label: 'イメージセンサ', labelEn: 'Image Sensor' },
    ],
  },
  {
    name: '製造工程・技術',
    nameEn: 'Manufacturing Process',
    fields: [
      { key: 'frontend', label: '前工程', labelEn: 'Front-end' },
      { key: 'backend', label: '後工程', labelEn: 'Back-end' },
      { key: 'miniaturization', label: '微細化', labelEn: 'Miniaturization' },
      { key: 'equipment', label: '製造装置', labelEn: 'Equipment' },
      { key: 'wafer', label: 'ウェーハ', labelEn: 'Wafer' },
    ],
  },
  {
    name: '市場・アプリケーション',
    nameEn: 'Market / Application',
    fields: [
      { key: 'ai', label: 'AI半導体', labelEn: 'AI Chip' },
      { key: 'automotive', label: '車載半導体', labelEn: 'Automotive' },
      { key: 'datacenter', label: 'データセンター', labelEn: 'Data Center' },
      { key: 'industrial', label: '産業機器', labelEn: 'Industrial' },
    ],
  },
  {
    name: '業界構造',
    nameEn: 'Industry Structure',
    fields: [
      { key: 'foundry', label: 'ファウンドリ', labelEn: 'Foundry' },
      { key: 'fabless', label: 'ファブレス', labelEn: 'Fabless' },
      { key: 'idm', label: 'IDM', labelEn: 'IDM' },
      { key: 'geopolitics', label: '地政学・規制', labelEn: 'Geopolitics' },
    ],
  },
];

export const ALL_FIELDS: FieldKey[] = FIELD_AXES.flatMap(axis => axis.fields.map(f => f.key));
