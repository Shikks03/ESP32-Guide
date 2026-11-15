import type { TrackId } from './types';

/** Each track's accent (CSS colour expression); used by the home track cards, the hero strip and lesson banners. */
export const TRACK_COLOR: Record<TrackId, string> = {
  intro: 'var(--ok)',
  wifi: 'var(--w-sda)',
  radar: 'var(--part-teal)',
  bulb: 'var(--part-yellow)',
  zones: 'var(--copper)',
};
