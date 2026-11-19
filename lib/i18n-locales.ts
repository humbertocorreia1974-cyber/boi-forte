export type LocaleCode =
  | 'pt-BR' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'zh' | 'ru'
  | 'ar' | 'hi' | 'id' | 'nl' | 'pl' | 'tr' | 'ko' | 'th' | 'vi';

export interface LocaleMeta {
  code: LocaleCode;
  label: string;
  native: string;
  flag: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: 'pt-BR', label: 'Português (Brasil)', native: 'Português', flag: '🇧🇷' },
  { code: 'en',    label: 'English',            native: 'English',   flag: '🇺🇸' },
  { code: 'es',    label: 'Español',            native: 'Español',   flag: '🇪🇸' },
  { code: 'fr',    label: 'Français',           native: 'Français',  flag: '🇫🇷' },
  { code: 'de',    label: 'Deutsch',            native: 'Deutsch',   flag: '🇩🇪' },
  { code: 'it',    label: 'Italiano',           native: 'Italiano',  flag: '🇮🇹' },
  { code: 'ja',    label: '日本語',              native: '日本語',     flag: '🇯🇵' },
  { code: 'zh',    label: '中文',                native: '中文',       flag: '🇨🇳' },
  { code: 'ru',    label: 'Русский',            native: 'Русский',   flag: '🇷🇺' },
  { code: 'ar',    label: 'العربية',             native: 'العربية',    flag: '🇸🇦' },
  { code: 'hi',    label: 'हिन्दी',                native: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'id',    label: 'Bahasa Indonesia',   native: 'Indonesia', flag: '🇮🇩' },
  { code: 'nl',    label: 'Nederlands',         native: 'Nederlands',flag: '🇳🇱' },
  { code: 'pl',    label: 'Polski',             native: 'Polski',    flag: '🇵🇱' },
  { code: 'tr',    label: 'Türkçe',             native: 'Türkçe',    flag: '🇹🇷' },
  { code: 'ko',    label: '한국어',              native: '한국어',     flag: '🇰🇷' },
  { code: 'th',    label: 'ไทย',                 native: 'ไทย',        flag: '🇹🇭' },
  { code: 'vi',    label: 'Tiếng Việt',         native: 'Tiếng Việt',flag: '🇻🇳' },
];

export const DEFAULT_LOCALE: LocaleCode = 'pt-BR';

export function isLocale(x: string): x is LocaleCode {
  return LOCALES.some((l) => l.code === x);
}
