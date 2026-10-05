import { create } from 'zustand';

import type { Employer, Job } from '@/domain/types';
import { repositories } from '@/repositories';

interface CatalogState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  jobs: Job[];
  jobsById: Map<string, Job>;
  employersById: Map<string, Employer>;
  load: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>()((set, get) => ({
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
