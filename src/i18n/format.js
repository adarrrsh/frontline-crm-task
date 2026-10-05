import { currencyOf, formatMoney } from '@/domain/money';

import { LOCALE } from './index';

/** "German", "German or Romansh", "French, Italian or German" */
export function languageList(t, codes) {
  const names = codes.map((c) => t(`langInline.${c}`));
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${t('common.or')} ${names[names.length - 1]}`;
}

export function reasonText(t, { kind, params }) {
  switch (kind) {
    case 'distance':
      return t('reason.distance', params);
    case 'pay':
      return t('reason.pay', { amount: formatMoney(params.amount) });
    case 'shifts':
      return params.shift ? t('reason.shiftsOne', { shifts: t(`shifts.${params.shift}`) }) : t('reason.shiftsAll');
    case 'category':
      return t('reason.category', { category: t(`category.${params.category}`) });
    case 'language':
      return t('reason.language', { language: t(`langInline.${params.language}`) });
    default:
      return t(`reason.${kind}`);
  }
}

export function warningText(t, { kind, params }) {
  if (kind === 'partialShifts') return t(params.none ? 'warning.outsideShifts' : 'warning.partialShifts');
  if (kind === 'language') return t('warning.language', { languages: languageList(t, params.languages) });
  return t(`warning.${kind}`);
}

/** "$20/hr + tips", "CHF 26/hr" */
export const payLabel = (t, job) =>
  t(job.tips ? 'pay.perHourTips' : 'pay.perHour', { amount: formatMoney(job.payPerHour, currencyOf(job)) });

export const hoursLabel = (t, { hoursPerWeek: { min, max } }) =>
  min === max ? t('hours.single', { min }) : t('hours.range', { min, max });

export const experienceLabel = (t, years) => (years >= 3 ? t('experience.max') : t('experience', { count: years }));

/** "2 min ago", "3 h ago", "yesterday", "4 days ago" */
export function timeAgo(t, then, now) {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return t('time.justNow');
  const m = Math.round(s / 60);
  if (m < 60) return t('time.minutes', { count: m });
  const h = Math.round(m / 60);
  if (h < 24) return t('time.hours', { count: h });
  const d = Math.round(h / 24);
  return d === 1 ? t('time.yesterday') : t('time.days', { count: d });
}

export const clockTime = (t, at) => new Date(at).toLocaleTimeString(LOCALE[t.lang], { hour: 'numeric', minute: '2-digit' });

/** useEffectiveLocation names an unrecognised spot "you"; word that in the app language. */
export const placeLabel = (t, placeName) => (placeName === 'you' ? t('location.you') : placeName);
