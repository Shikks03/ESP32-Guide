import { useCallback, useMemo } from 'react';
import type { LabStatus, Lesson, PartId } from '../content/types';
import { PARTS } from '../content/bench';
import { LESSONS, lessonById } from '../content/lessons';
import { KEYS, removeStored, useStored } from './storage';

type TicksRecord = Record<string, boolean[]>;

const EMPTY_TICKS: TicksRecord = {};
const EMPTY_STRINGS: string[] = [];
const EMPTY_TOUR: Record<string, number> = {};

/* ------------------------------------------------------------------ ticks */

export function useTicks(lessonId: string) {
  const [record, setRecord] = useStored<TicksRecord>(KEYS.ticks, EMPTY_TICKS);
  const count = lessonById(lessonId)?.steps.length ?? 0;
  const saved = record[lessonId];
  const ticks = useMemo(() => Array.from({ length: count }, (_, i) => !!saved?.[i]), [saved, count]);
  const toggle = useCallback(
    (i: number) =>
      setRecord((prev) => {
        const cur = Array.from({ length: count }, (_, k) => !!prev[lessonId]?.[k]);
        cur[i] = !cur[i];
        return { ...prev, [lessonId]: cur };
      }),
    [setRecord, lessonId, count],
  );
  const reset = useCallback(
    () =>
      setRecord((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      }),
    [setRecord, lessonId],
  );
  return { ticks, toggle, reset };
}

/** planned stays planned; all steps ticked -> done; otherwise the starting status. */
export function effectiveStatus(lesson: Lesson, ticksRecord: TicksRecord): LabStatus {
  if (lesson.status === 'planned') return 'planned';
  const t = ticksRecord[lesson.id];
  if (lesson.steps.length > 0 && t && lesson.steps.every((_, i) => !!t[i])) return 'done';
  return lesson.status;
}

export function useLabStatus(lesson: Lesson): LabStatus {
  const [record] = useStored<TicksRecord>(KEYS.ticks, EMPTY_TICKS);
  return effectiveStatus(lesson, record);
}

export function useAllStatuses(): Record<string, LabStatus> {
  const [record] = useStored<TicksRecord>(KEYS.ticks, EMPTY_TICKS);
  return useMemo(() => {
    const out: Record<string, LabStatus> = {};
    for (const l of LESSONS) out[l.id] = effectiveStatus(l, record);
    return out;
  }, [record]);
}

/* ------------------------------------------------------------------ bench */

const DEFAULT_BENCH: PartId[] = PARTS.filter((p) => p.defaultHave).map((p) => p.id);
const ALL_PARTS: PartId[] = PARTS.map((p) => p.id);

export function useBench() {
  const [list, setList] = useStored<PartId[]>(KEYS.bench, DEFAULT_BENCH);
  const have = useMemo(() => new Set<PartId>([...list, 'board']), [list]);
  const toggle = useCallback(
    (id: PartId) => {
      if (id === 'board') return;
      setList((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    },
    [setList],
  );
  const setAll = useCallback(() => setList(ALL_PARTS), [setList]);
  const clear = useCallback(() => setList([]), [setList]);
  return { have, toggle, setAll, clear };
}

/* ------------------------------------------------------------------ words */

export function useWordsMet() {
  const [list, setList] = useStored<string[]>(KEYS.words, EMPTY_STRINGS);
  const met = useMemo(() => new Set(list), [list]);
  const meet = useCallback(
    (id: string) => setList((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [setList],
  );
  const reset = useCallback(() => setList([]), [setList]);
  return { met, meet, reset };
}

/* ------------------------------------------------------------------ tour */

export function useTourStop(lessonId: string): [number, (n: number) => void] {
  const [record, setRecord] = useStored<Record<string, number>>(KEYS.tour, EMPTY_TOUR);
  const stop = record[lessonId] ?? 0;
  const setStop = useCallback(
    (n: number) => setRecord((prev) => ({ ...prev, [lessonId]: n })),
    [setRecord, lessonId],
  );
  return [stop, setStop];
}

/* ------------------------------------------------------------------ last lesson */

export function useLastLesson(): [string | null, (id: string) => void] {
  const [id, setId] = useStored<string | null>(KEYS.lesson, null);
  const set = useCallback((next: string) => setId(next), [setId]);
  return [id, set];
}

/* ------------------------------------------------------------------ code progress */

export interface CodeProgress {
  stops: number[];
  lines: Record<string, number[]>;
}
type CodeProgressRecord = Record<string, CodeProgress>;
const EMPTY_CODE: CodeProgressRecord = {};
const NO_PROGRESS: CodeProgress = { stops: [], lines: {} };

/** Number of tour stops read for a lesson, from the stored record. */
export function stopsRead(lessonId: string, record: CodeProgressRecord): number {
  return record[lessonId]?.stops.length ?? 0;
}

export function useCodeProgress(lessonId: string) {
  const [record, setRecord] = useStored<CodeProgressRecord>(KEYS.codeProgress, EMPTY_CODE);
  const progress = record[lessonId] ?? NO_PROGRESS;
  /** Visiting a stop marks it (by index in the lesson's full tour) and every line in its range as read. */
  const markStop = useCallback(
    (stopIndex: number, file: string, from: number, to: number) =>
      setRecord((prev) => {
        const cur = prev[lessonId] ?? NO_PROGRESS;
        const lines = new Set(cur.lines[file] ?? []);
        const before = lines.size;
        for (let n = from; n <= to; n++) lines.add(n);
        const hasStop = cur.stops.includes(stopIndex);
        if (hasStop && lines.size === before) return prev;
        return {
          ...prev,
          [lessonId]: {
            stops: hasStop ? cur.stops : [...cur.stops, stopIndex],
            lines: { ...cur.lines, [file]: [...lines].sort((a, b) => a - b) },
          },
        };
      }),
    [setRecord, lessonId],
  );
  const reset = useCallback(
    () =>
      setRecord((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      }),
    [setRecord, lessonId],
  );
  return { progress, stopsRead: progress.stops.length, markStop, reset };
}

/** Just the count, for components that only show "{n} stops read". */
export function useStopsRead(lessonId: string): number {
  const [record] = useStored<CodeProgressRecord>(KEYS.codeProgress, EMPTY_CODE);
  return stopsRead(lessonId, record);
}

/* ------------------------------------------------------------------ reset */

export function resetProgress(kind: 'ticks' | 'bench' | 'words' | 'tour' | 'code' | 'all'): void {
  const keys =
    kind === 'all'
      ? [KEYS.ticks, KEYS.bench, KEYS.words, KEYS.tour, KEYS.codeProgress]
      : [kind === 'code' ? KEYS.codeProgress : KEYS[kind]];
  keys.forEach(removeStored);
}
