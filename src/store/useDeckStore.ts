import { create } from 'zustand';

/**
 * Ids of the cards the worker can currently see (top + the one underneath). Updated on swipe /
 * undo — never during render — so a re-rank never reshuffles cards under the finger.
 */
interface DeckState {
  pins: string[];
  setPins: (ids: string[]) => void;
}

export const useDeckStore = create<DeckState>()((set) => ({
  pins: [],
  setPins: (pins) => set({ pins }),
}));
