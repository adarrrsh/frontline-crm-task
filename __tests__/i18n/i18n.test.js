import { makeT, UI_LANGUAGES } from '@/i18n';
import de from '@/i18n/de';
import en from '@/i18n/en';
import fr from '@/i18n/fr';
import { languageList, payLabel, reasonText, timeAgo, warningText } from '@/i18n/format';
import italian from '@/i18n/it';
import rm from '@/i18n/rm';

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe.each([
  ['de', de],
  ['fr', fr],
  ['it', italian],
  ['rm', rm],
])('%s dictionary', (_, dict) => {
  it('has exactly the English keys', () => {
    expect(Object.keys(dict).sort()).toEqual(Object.keys(en).sort());
  });

  it('keeps every placeholder', () => {
    for (const key of Object.keys(en)) expect([key, placeholders(dict[key])]).toEqual([key, placeholders(en[key])]);
  });
});

describe('makeT', () => {
  it('offers the four national languages plus English', () => {
    expect(UI_LANGUAGES.map((l) => l.code)).toEqual(['en', 'de', 'fr', 'it', 'rm']);
  });

  it('fills params and picks plurals', () => {
    const t = makeT('de');
    expect(t('radius.within', { count: 1, km: 5 })).toBe('1 Job im Umkreis von 5 km');
    expect(t('radius.within', { count: 3, km: 5 })).toBe('3 Jobs im Umkreis von 5 km');
  });

  it('falls back to English, then to the key, and to English for an unknown language', () => {
    expect(makeT('xx')('tab.index')).toBe('Discover');
    expect(makeT('fr')('no.such.key')).toBe('no.such.key');
  });
});

describe('format', () => {
  const en_ = makeT('en');
  const it_ = makeT('it');

  it('joins languages with a localised "or", lowercase mid-sentence where the language wants it', () => {
    expect(languageList(en_, ['de', 'rm'])).toBe('German or Romansh');
    expect(languageList(it_, ['fr', 'it', 'de'])).toBe('francese, italiano o tedesco');
  });

  it('words reasons and warnings in the app language', () => {
    expect(reasonText(it_, { kind: 'language', params: { language: 'it' } })).toBe('Parli italiano');
    expect(reasonText(en_, { kind: 'pay', params: { amount: 6 } })).toBe('$6/hr above your minimum');
    expect(reasonText(en_, { kind: 'shifts', params: { shift: 'night' } })).toBe('Fits your nights');
    expect(warningText(makeT('fr'), { kind: 'language', params: { languages: ['de'] } })).toBe('Exige allemand');
    expect(warningText(en_, { kind: 'partialShifts', params: { none: true } })).toBe('Outside your availability');
  });

  it('shows CHF pay in francs', () => {
    expect(payLabel(makeT('rm'), { payPerHour: 26, currency: 'CHF', tips: true })).toBe('CHF 26/ura + bunamaun');
    expect(payLabel(en_, { payPerHour: 20 })).toBe('$20/hr');
  });

  it('localises relative time', () => {
    expect(timeAgo(makeT('de'), 0, 3 * 60_000)).toBe('vor 3 Min.');
    expect(timeAgo(makeT('fr'), 0, 86_400_000)).toBe('hier');
  });
});
