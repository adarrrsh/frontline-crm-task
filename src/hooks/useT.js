import { useMemo } from 'react';

import { makeT } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';

/** Translator for the worker's chosen app language. Re-renders the caller when it changes. */
export function useT() {
  const lang = useAppStore((s) => s.uiLanguage);
  return useMemo(() => makeT(lang), [lang]);
}
