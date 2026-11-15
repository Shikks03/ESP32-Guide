import { useCallback, useEffect, useSyncExternalStore } from 'react';

export const KEYS = {
  ticks: 'esp-labs-wroom32:ticks',
  bench: 'esp-labs-wroom32:bench',
  settings: 'esp-labs-wroom32:settings',
  words: 'esp-labs-wroom32:words',
  tour: 'esp-labs-wroom32:tour',
  lesson: 'esp-labs-wroom32:lesson',
  codeProgress: 'esp-labs-wroom32:code-progress',
} as const;

const listeners = new Map<string, Set<() => void>>();
/** In-memory copy, used when localStorage throws. */
const memory = new Map<string, string | null>();

function rawRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

export function readStored<T>(key: string, fallback: T): T {
  const raw = rawRead(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    /* storage unavailable: the memory copy keeps this session working */
  }
  emit(key);
}

export function removeStored(key: string): void {
  memory.set(key, null);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  emit(key);
}

function subscribe(key: string, cb: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  const s = set;
  s.add(cb);
  return () => {
    s.delete(cb);
  };
}

/** Returns [value, setValue]. Safe if localStorage throws; syncs across tabs and components. */
export function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const raw = useSyncExternalStore(
    useCallback((cb: () => void) => subscribe(key, cb), [key]),
    () => rawRead(key),
    () => null,
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) emit(key);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  let value = fallback;
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStored<T>(key, fallback);
      writeStored(key, typeof next === 'function' ? (next as (p: T) => T)(prev) : next);
    },
    // fallback is only a first-visit default; key identifies the slot
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, setValue];
}
