import * as Haptics from 'expo-haptics';
import { useCallback, useEffect } from 'react';

import { dueInterests, nextResolveAt } from '@/domain/interest';
import { useAppStore } from '@/store/useAppStore';
import { useUiStore } from '@/store/useUiStore';

import { useAppForeground } from './useAppForeground';

/**
 * Reveals employer replies when they're due. One timer, aimed at the earliest pending reply;
 * also catches up on mount (after hydration) and when the app returns to the foreground,
 * so replies survive the app being killed or backgrounded.
 */
export function useMatchResolver() {
  const likedJobs = useAppStore((s) => s.likedJobs);

  const resolveDue = useCallback(() => {
    const now = Date.now();
    const due = dueInterests(useAppStore.getState().likedJobs, now);
    if (due.length === 0) return;
    const matched = useAppStore.getState().resolveInterests(
      due.map((l) => l.jobId),
      now,
    );
    if (matched.length > 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      useUiStore.getState().enqueueMatches(matched);
    }
  }, []);

  useEffect(() => {
    resolveDue();
    const next = nextResolveAt(likedJobs);
    if (next === null) return;
    const timer = setTimeout(resolveDue, Math.max(0, next - Date.now()));
    return () => clearTimeout(timer);
  }, [likedJobs, resolveDue]);

  useAppForeground(resolveDue);
}
