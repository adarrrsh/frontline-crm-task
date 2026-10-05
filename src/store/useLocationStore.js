import { create } from 'zustand';

import { repositories } from '@/repositories';

export const LOCATION_TIMEOUT_MS = 10_000;

let inflight = null;

export const useLocationStore = create()((set, get) => {
  const locate = (prompt) => {
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
