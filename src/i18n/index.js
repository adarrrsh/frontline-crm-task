import de from './de';
import en from './en';
import fr from './fr';
import it from './it';
import rm from './rm';

const DICTS = { en, de, fr, it, rm };

/** App languages, each named in itself so the picker is readable whatever is currently selected. */
export const UI_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'rm', name: 'Rumantsch' },
];

/** For Intl/date formatting. */
export const LOCALE = { en: 'en-US', de: 'de-CH', fr: 'fr-CH', it: 'it-CH', rm: 'rm-CH' };

const fill = (s, params) => (params ? s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : s);

/**
 * Translator for one language. Missing keys fall back to English, then to the key itself.
 * `params.count` picks `key_one` / `key_other` when those exist.
 */
export function makeT(lang) {
  const dict = DICTS[lang] ?? en;
  const lookup = (key) => dict[key] ?? en[key];
  const t = (key, params) => {
    if (params && typeof params.count === 'number') {
      const plural = lookup(`${key}_${params.count === 1 ? 'one' : 'other'}`);
      if (plural !== undefined) return fill(plural, params);
    }
    return fill(lookup(key) ?? key, params);
  };
  t.lang = DICTS[lang] ? lang : 'en';
  return t;
}
