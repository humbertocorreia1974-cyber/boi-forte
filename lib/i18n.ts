export const LOCALES = [
  'pt-BR','en','es','fr','de','it','ja','zh','ru','ar','hi','id','nl','pl','tr','ko','th','vi',
] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  'pt-BR': 'Português (BR)',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ja: '日本語',
  zh: '中文',
  ru: 'Русский',
  ar: 'العربية',
  hi: 'हिन्दी',
  id: 'Bahasa Indonesia',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  ko: '한국어',
  th: 'ไทย',
  vi: 'Tiếng Việt',
};

const dict: Record<string, Record<Locale, string>> = {
  dashboard: {
    'pt-BR': 'Painel', en: 'Dashboard', es: 'Panel', fr: 'Tableau de bord', de: 'Übersicht',
    it: 'Dashboard', ja: 'ダッシュボード', zh: '仪表板', ru: 'Панель', ar: 'لوحة التحكم',
    hi: 'डैशबोर्ड', id: 'Dasbor', nl: 'Dashboard', pl: 'Panel', tr: 'Panel', ko: '대시보드',
    th: 'แดชบอร์ด', vi: 'Bảng điều khiển',
  },
  fazendas: {
    'pt-BR': 'Fazendas', en: 'Farms', es: 'Fincas', fr: 'Fermes', de: 'Farmen', it: 'Fattorie',
    ja: '農場', zh: '农场', ru: 'Фермы', ar: 'المزارع', hi: 'खेत', id: 'Peternakan', nl: 'Boerderijen',
    pl: 'Farmy', tr: 'Çiftlikler', ko: '농장', th: 'ฟาร์ม', vi: 'Trang trại',
  },
  animais: {
    'pt-BR': 'Animais', en: 'Animals', es: 'Animales', fr: 'Animaux', de: 'Tiere', it: 'Animali',
    ja: '家畜', zh: '牲畜', ru: 'Животные', ar: 'الحيوانات', hi: 'पशु', id: 'Hewan', nl: 'Dieren',
    pl: 'Zwierzęta', tr: 'Hayvanlar', ko: '가축', th: 'สัตว์', vi: 'Động vật',
  },
  lotes: {
    'pt-BR': 'Lotes', en: 'Batches', es: 'Lotes', fr: 'Lots', de: 'Chargen', it: 'Lotti',
    ja: 'ロット', zh: '批次', ru: 'Партии', ar: 'الدفعات', hi: 'बैच', id: 'Batch', nl: 'Koppels',
    pl: 'Partie', tr: 'Partiler', ko: '그룹', th: 'ล็อต', vi: 'Lô',
  },
  piquetes: {
    'pt-BR': 'Piquetes', en: 'Paddocks', es: 'Piquetes', fr: 'Parcelles', de: 'Koppeln', it: 'Recinti',
    ja: '牧区', zh: '围场', ru: 'Загоны', ar: 'الحقول', hi: 'चरागाह', id: 'Kandang', nl: 'Weiden',
    pl: 'Zagrody', tr: 'Padoklar', ko: '목초지', th: 'ทุ่งหญ้า', vi: 'Bãi cỏ',
  },
  sanidade: {
    'pt-BR': 'Sanidade', en: 'Health', es: 'Sanidad', fr: 'Santé', de: 'Gesundheit', it: 'Sanità',
    ja: '衛生', zh: '健康', ru: 'Здоровье', ar: 'الصحة', hi: 'स्वास्थ्य', id: 'Kesehatan', nl: 'Gezondheid',
    pl: 'Zdrowie', tr: 'Sağlık', ko: '위생', th: 'สุขภาพ', vi: 'Sức khỏe',
  },
  financeiro: {
    'pt-BR': 'Financeiro', en: 'Financial', es: 'Financiero', fr: 'Financier', de: 'Finanzen', it: 'Finanziario',
    ja: '財務', zh: '财务', ru: 'Финансы', ar: 'المالية', hi: 'वित्तीय', id: 'Keuangan', nl: 'Financieel',
    pl: 'Finanse', tr: 'Finans', ko: '재무', th: 'การเงิน', vi: 'Tài chính',
  },
  reproducao: {
    'pt-BR': 'Reprodução', en: 'Reproduction', es: 'Reproducción', fr: 'Reproduction', de: 'Fortpflanzung',
    it: 'Riproduzione', ja: '繁殖', zh: '繁殖', ru: 'Размножение', ar: 'التكاثر', hi: 'प्रजनन',
    id: 'Reproduksi', nl: 'Voortplanting', pl: 'Rozród', tr: 'Üreme', ko: '번식', th: 'การสืบพันธุ์', vi: 'Sinh sản',
  },
  relatorios: {
    'pt-BR': 'Relatórios', en: 'Reports', es: 'Informes', fr: 'Rapports', de: 'Berichte', it: 'Report',
    ja: 'レポート', zh: '报告', ru: 'Отчёты', ar: 'التقارير', hi: 'रिपोर्ट', id: 'Laporan', nl: 'Rapporten',
    pl: 'Raporty', tr: 'Raporlar', ko: '보고서', th: 'รายงาน', vi: 'Báo cáo',
  },
};

export function t(key: keyof typeof dict, locale: Locale = 'pt-BR') {
  return dict[key]?.[locale] ?? dict[key]?.['pt-BR'] ?? String(key);
}
