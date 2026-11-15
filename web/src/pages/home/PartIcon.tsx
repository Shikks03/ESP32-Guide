import type { PartId } from '../../content/types';
import { IsoIcon } from '../../components/iso/iso';
import { FIT } from '../../components/iso/fit';
import { FALLBACK_ART, PART_ART } from '../../components/iso/art';

/** Illustrated icon per bench part. */
export function PartIcon({ id, size = 34 }: { id: PartId; size?: number }) {
  return <IsoIcon size={size} fit={FIT.part[id] ?? FIT.fallback._}>{PART_ART[id] ?? FALLBACK_ART}</IsoIcon>;
}
