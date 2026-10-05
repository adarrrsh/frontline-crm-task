import { create } from 'zustand';

export const useUiStore = create()((set) => ({
  matchQueue: [],
  enqueueMatches: (jobIds) =>
    set((s) => ({
      matchQueue: [...s.matchQueue, ...jobIds.filter((id) => !s.matchQueue.includes(id))],
    })),
  dismissMatch: () => set((s) => ({ matchQueue: s.matchQueue.slice(1) })),
}));
