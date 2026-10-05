import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

import type { Job } from '@/domain/types';
import { repositories } from '@/repositories';
import { useAppStore } from '@/store/useAppStore';

const RETRY_MS = 2_000;
const MAX_ATTEMPTS = 3;

/** Swipe → record (optimistic) → for likes, send interest and store the pending reply. */
export function useSwipeActions() {
  const recordSwipe = useAppStore((s) => s.recordSwipe);
  const addPendingInterest = useAppStore((s) => s.addPendingInterest);
  const undoLastSwipe = useAppStore((s) => s.undoLastSwipe);

  const pass = useCallback(
    (job: Job) => {
      void Haptics.selectionAsync();
      recordSwipe(job.id, 'pass', Date.now());
    },
    [recordSwipe],
  );

  const like = useCallback(
    async (job: Job) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const now = Date.now();
      recordSwipe(job.id, 'like', now);
      const profile = useAppStore.getState().profile;
      // The swipe is already recorded; retry sending interest a few times. (The mock never fails.)
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const { resolveAt, outcome } = await repositories.interest.submit(job, profile, now);
          addPendingInterest(job.id, now, resolveAt, outcome);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, RETRY_MS * (attempt + 1)));
        }
      }
    },
    [recordSwipe, addPendingInterest],
  );

  const undo = useCallback(() => {
    const id = undoLastSwipe();
    if (id) void Haptics.selectionAsync();
    return id;
  }, [undoLastSwipe]);

  return { like, pass, undo };
}
