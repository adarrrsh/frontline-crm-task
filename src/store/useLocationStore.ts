import { create } from 'zustand';

import type { Coordinates } from '@/domain/types';
import { repositories } from '@/repositories';

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export const LOCATION_TIMEOUT_MS = 10_000;

interface LocationState {
  status: LocationStatus;
  coords: Coordinates | null;
  canAskAgain: boolean;
  lastTriedAt: number | null;
  /** Ask for permission if needed (shows the iOS prompt), then get a fix. */
  request: () => Promise<void>;
  /** Re-check without prompting — used on app start and when returning from Settings. */
  refresh: () => Promise<void>;
  openSettings: () => void;
}

let inflight: Promise<void> | null = null;

export const useLocationStore = create<LocationState>()((set, get) => {
  const locate = (prompt: boolean) => {
    if (inflight) return inflight;
    inflight = (async () => {
      const { location } = repositories;
      set({ status: 'requesting' });
      try {
        const perm = prompt ? await location.requestPermission() : await location.getPermission();
        set({ canAskAgain: perm.canAskAgain });
        if (perm.status !== 'granted') {
          set({ status: perm.status === 'denied' ? 'denied' : 'idle' });
          return;
        }
        const coords = await location.getPosition(LOCATION_TIMEOUT_MS);
        set({ status: 'granted', coords, lastTriedAt: Date.now() });
      } catch {
        set({ status: 'unavailable', lastTriedAt: Date.now() });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  };

  return {
    status: 'idle',
    coords: null,
    canAskAgain: true,
    lastTriedAt: null,
    request: () => (get().status === 'denied' && !get().canAskAgain ? locate(false) : locate(true)),
    refresh: () => locate(false),
    openSettings: () => repositories.location.openSettings(),
  };
});
