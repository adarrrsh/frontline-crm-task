import { create } from 'zustand';

import { repositories } from '@/repositories';

export const useCatalogStore = create()((set, get) => ({
  status: 'idle',
  jobs: [],
  jobsById: new Map(),
  employersById: new Map(),
  load: async () => {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading' });
    try {
      const [jobs, employers] = await Promise.all([repositories.jobs.getJobs(), repositories.jobs.getEmployers()]);
      set({
        status: 'ready',
        jobs,
        jobsById: new Map(jobs.map((j) => [j.id, j])),
        employersById: new Map(employers.map((e) => [e.id, e])),
      });
    } catch {
      set({ status: 'error' });
    }
  },
}));
