import type { Lesson } from '../types';
import { TRACKS } from '../tracks';
import l00 from './00';
import l01 from './01';
import l02 from './02';
import w1 from './w1';
import w2 from './w2';
import w3 from './w3';
import w4 from './w4';
import s1 from './s1';
import s2 from './s2';
import s3 from './s3';
import s4 from './s4';
import l1 from './l1';
import l2 from './l2';
import l3 from './l3';
import z1 from './z1';
import z2 from './z2';
import z3 from './z3';
import z4 from './z4';

export const LESSONS: Lesson[] = [l00, l01, l02, w1, w2, w3, w4, s1, s2, s3, s4, l1, l2, l3, z1, z2, z3, z4];

export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);

export const lessonsInTrack = (trackId: string): Lesson[] => {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return [];
  return track.lessonIds.map((id) => lessonById(id)).filter((l): l is Lesson => !!l);
};

/** The lesson after `id` in track order (crossing into the next track), or undefined at the end. */
export const nextLesson = (id: string): Lesson | undefined => {
  const order = TRACKS.flatMap((t) => t.lessonIds);
  const i = order.indexOf(id);
  return i >= 0 && i < order.length - 1 ? lessonById(order[i + 1]) : undefined;
};
