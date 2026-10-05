import { create } from 'zustand';

export const useDeckStore = create()((set) => ({
  pins: [],
  setPins: (pins) => set({ pins }),
}));
