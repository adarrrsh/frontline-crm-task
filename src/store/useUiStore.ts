import { create } from 'zustand';

interface UiState {
  /** Matches waiting for their "It's a match!" moment, shown one at a time. */
  matchQueue: string[];
  enqueueMatches: (jobIds: string[]) => void;
  dismissMatch: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  matchQueue: [],
  enqueueMatches: (jobIds) =>
    set((s) => ({ matchQueue: [...s.matchQueue, ...jobIds.filter((id) => !s.matchQueue.includes(id))] })),
  dismissMatch: () => set((s) => ({ matchQueue: s.matchQueue.slice(1) })),
}));
