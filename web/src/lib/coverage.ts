import type { ChipBlock, LabStatus, Lesson } from '../content/types';

export type BlockState = LabStatus | 'none';

/** Best first. */
export const STATE_ORDER: BlockState[] = ['done', 'runs', 'built', 'planned', 'none'];
const RANK: Record<BlockState, number> = { done: 0, runs: 1, built: 2, planned: 3, none: 4 };

/** Plain words for a coverage state. */
export const STATE_WORD: Record<BlockState, string> = {
  done: 'done',
  runs: 'works',
  built: 'built',
  planned: 'planned',
  none: 'not used yet',
};

/** Longer legend labels (reference wording). */
export const STATE_LEGEND: Record<BlockState, string> = {
  done: 'done by you',
  runs: 'runs on the board',
  built: 'built, not flashed',
  planned: 'planned',
  none: 'Not yet used',
};

/**
 * A block's state = best effective status among non-planned lessons whose chipBlocks include it
 * (done > runs > built); 'planned' if only planned lessons list it; else 'none'.
 */
export function blockStates(
  blocks: ChipBlock[],
  lessons: Lesson[],
  statuses: Record<string, LabStatus>,
): Record<string, BlockState> {
  const out: Record<string, BlockState> = {};
  for (const bl of blocks) {
    let best: BlockState = 'none';
    for (const l of lessons) {
      if (!l.chipBlocks.includes(bl.id)) continue;
      const s = statuses[l.id] ?? l.status;
      if (RANK[s] < RANK[best]) best = s;
    }
    out[bl.id] = best;
  }
  return out;
}

export function countStates(states: Record<string, BlockState>): Record<BlockState, number> {
  const c: Record<BlockState, number> = { done: 0, runs: 0, built: 0, planned: 0, none: 0 };
  for (const s of Object.values(states)) c[s]++;
  return c;
}

/** Blocks a lab has really covered (done, runs or built). */
export function usedCount(counts: Record<BlockState, number>): number {
  return counts.done + counts.runs + counts.built;
}

export interface NextBlock {
  block: ChipBlock;
  lesson: Lesson;
}

/**
 * Blocks a lab reaches but you have not finished yet (state runs, built or planned), each with the
 * first lesson in order that lists it and is not done. Blocks nothing reaches ('none') have no lab to
 * link to. Empty list = the reference's "every block the labs reach is done" message.
 */
export function nextToUnlock(
  blocks: ChipBlock[],
  lessons: Lesson[],
  statuses: Record<string, LabStatus>,
  states: Record<string, BlockState>,
  limit = 3,
): NextBlock[] {
  const out: NextBlock[] = [];
  for (const bl of blocks) {
    const st = states[bl.id];
    if (st === 'done' || st === 'none') continue;
    const listing = lessons.filter((l) => l.chipBlocks.includes(bl.id) && (statuses[l.id] ?? l.status) !== 'done');
    const lesson = listing.find((l) => (statuses[l.id] ?? l.status) !== 'planned') ?? listing[0];
    if (lesson) out.push({ block: bl, lesson });
  }
  out.sort((a, b) => RANK[blockOrder(a)] - RANK[blockOrder(b)]);
  return out.slice(0, limit);

  function blockOrder(n: NextBlock): BlockState {
    return states[n.block.id];
  }
}
