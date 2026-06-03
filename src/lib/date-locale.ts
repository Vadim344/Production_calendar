import { de, enUS, ru } from "date-fns/locale";

const localeMap: Record<string, Locale> = { de, en: enUS, ru };

export function getDateLocale(locale: string): Locale {
  return localeMap[locale] || de;
}