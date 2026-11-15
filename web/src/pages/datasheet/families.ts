import type { BlockFamily } from '../../content/types';

export const FAMILIES: BlockFamily[] = ['System', 'Memory', 'Security', 'Connectivity', 'Timing', 'Analog', 'Radio'];

export const familyKey = (f: BlockFamily): string => f.toLowerCase();
export const familyFromKey = (k: string | null): BlockFamily | null =>
  FAMILIES.find((f) => f.toLowerCase() === k) ?? null;
