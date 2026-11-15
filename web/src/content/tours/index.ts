import type { Tour } from '../types';

// One chunk per tour: the code reader loads only the lesson it shows.
// Zones (z1–z4) are planned stubs: no firmware, so no tours.
const LOADERS: Record<string, () => Promise<{ default: Tour }>> = {
  '01': () => import('./01'),
  '02': () => import('./02'),
  w1: () => import('./w1'),
  w2: () => import('./w2'),
  w3: () => import('./w3'),
  w4: () => import('./w4'),
  s1: () => import('./s1'),
  s2: () => import('./s2'),
  s3: () => import('./s3'),
  s4: () => import('./s4'),
  l1: () => import('./l1'),
  l2: () => import('./l2'),
  l3: () => import('./l3'),
};

export const hasTour = (lessonId: string): boolean => lessonId in LOADERS;

export const loadTour = async (lessonId: string): Promise<Tour | undefined> => {
  const load = LOADERS[lessonId];
  return load ? (await load()).default : undefined;
};
