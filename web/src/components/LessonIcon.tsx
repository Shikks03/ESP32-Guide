import type { HotspotId, TrackId } from '../content/types';
import { IsoIcon } from './iso/iso';
import { FIT } from './iso/fit';
import { FALLBACK_ART, FAMILY_ART, HOTSPOT_ART, LESSON_ART, TRACK_ART } from './iso/art';

/** Illustrated icon for a lab. Unknown ids get the board. */
export function LessonIcon({ id, size = 32 }: { id: string; size?: number }) {
  return <IsoIcon size={size} fit={LESSON_ART[id] ? FIT.lesson[id] : FIT.fallback._}>{LESSON_ART[id] ?? FALLBACK_ART}</IsoIcon>;
}

/** Illustrated icon for a track. */
export function TrackIcon({ id, size = 32 }: { id: TrackId; size?: number }) {
  return <IsoIcon size={size} fit={FIT.track[id] ?? FIT.fallback._}>{TRACK_ART[id] ?? FALLBACK_ART}</IsoIcon>;
}

/** Illustrated icon for one of the six board parts on the home page. */
export function HotspotIcon({ id, size = 40 }: { id: HotspotId; size?: number }) {
  return <IsoIcon size={size} fit={FIT.hotspot[id] ?? FIT.fallback._}>{HOTSPOT_ART[id] ?? FALLBACK_ART}</IsoIcon>;
}

/** Illustrated icon for a chip-block family; `fam` is the lower-case family key. */
export function FamilyIcon({ fam, size = 24 }: { fam: string; size?: number }) {
  return <IsoIcon size={size} fit={FIT.family[fam] ?? FIT.fallback._}>{FAMILY_ART[fam] ?? FALLBACK_ART}</IsoIcon>;
}

export default LessonIcon;
