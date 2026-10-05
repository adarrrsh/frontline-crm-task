import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { EMPTY_PROFILE } from '@/data/demoProfile';

const INITIAL = {
  profile: EMPTY_PROFILE,
  hasOnboarded: false,
  swipes: [],
  likedJobs: {},
  locationMode: 'device',
  manualLocation: null,
  matchesSeenAt: 0,
  uiLanguage: 'en',
};

export const RADIUS_MIN = 1;
export const RADIUS_MAX = 50;
const clampRadius = (km) => Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, Math.round(km)));

export const useAppStore = create()(
  persist(
    (set, get) => ({
      ...INITIAL,

      saveProfile: (profile) =>
        set({
          profile: {
            ...profile,
            maxDistanceKm: clampRadius(profile.maxDistanceKm),
          },
        }),
      completeOnboarding: () => set({ hasOnboarded: true }),
      setRadius: (km) =>
        set((s) => ({
          profile: { ...s.profile, maxDistanceKm: clampRadius(km) },
        })),

      recordSwipe: (jobId, direction, now) =>
        set((s) => (s.swipes.some((x) => x.jobId === jobId) ? s : { swipes: [...s.swipes, { jobId, direction, at: now }] })),

      addPendingInterest: (jobId, likedAt, resolveAt, outcome) =>
        set((s) => ({
          likedJobs: {
            ...s.likedJobs,
            [jobId]: { jobId, status: 'pending', likedAt, resolveAt, outcome },
          },
        })),

      resolveInterests: (jobIds, now) => {
        const likedJobs = { ...get().likedJobs };
        const matched = [];
        for (const id of jobIds) {
          const l = likedJobs[id];
          if (!l || l.status !== 'pending') continue;
          likedJobs[id] = { ...l, status: l.outcome, resolvedAt: now };
          if (l.outcome === 'matched') matched.push(id);
        }
        set({ likedJobs });
        return matched;
      },

      undoLastSwipe: () => {
        const { swipes, likedJobs } = get();
        const last = swipes[swipes.length - 1];
        if (!last) return null;
        if (last.direction === 'like' && likedJobs[last.jobId]?.status !== 'pending') return null;
        const { [last.jobId]: _removed, ...rest } = likedJobs;
        set({ swipes: swipes.slice(0, -1), likedJobs: rest });
        return last.jobId;
      },

      setManualLocation: (manualLocation) => set({ manualLocation, locationMode: 'manual' }),
      chooseDeviceLocation: () => set({ locationMode: 'device' }),
      markMatchesSeen: (now) => set({ matchesSeenAt: now }),
      setUiLanguage: (uiLanguage) => set({ uiLanguage }),

      resetDemo: (opts) =>
        set((s) => ({
          swipes: [],
          likedJobs: {},
          matchesSeenAt: 0,
          // The app language is a device setting, not demo data, so it survives both resets.
          ...(opts?.profile ? { ...INITIAL, profile: EMPTY_PROFILE, uiLanguage: s.uiLanguage } : { profile: s.profile }),
        })),
    }),
    {
      name: 'shiftmatch/app',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ profile, hasOnboarded, swipes, likedJobs, locationMode, manualLocation, matchesSeenAt, uiLanguage }) => ({
        profile,
        hasOnboarded,
        swipes,
        likedJobs,
        locationMode,
        manualLocation,
        matchesSeenAt,
        uiLanguage,
      }),
      // v1 is the first schema. Anything unrecognised falls back to defaults instead of crashing.
      migrate: (persisted, version) => (version === 1 && persisted && typeof persisted === 'object' ? persisted : INITIAL),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        profile: { ...EMPTY_PROFILE, ...persisted?.profile },
      }),
    },
  ),
);

/** Derived selectors (no stored copies). */
export const selectNewMatchCount = (s) =>
  Object.values(s.likedJobs).filter((l) => l.status === 'matched' && (l.resolvedAt ?? 0) > s.matchesSeenAt).length;
export const selectCanUndo = (s) => {
  const last = s.swipes[s.swipes.length - 1];
  return !!last && (last.direction === 'pass' || s.likedJobs[last.jobId]?.status === 'pending');
};
