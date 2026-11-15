import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Settings } from '../content/types';
import { KEYS, removeStored, useStored } from './storage';

export const DEFAULT_SETTINGS: Settings = {
  depth: 'beginner',
  // Defaults follow the reference site (esp-code-settings): full view, guess first on, pop-up word cards.
  readerView: 'full',
  guessFirst: true,
  cppHints: 'pop',
  pace: 'normal',
  codeSize: 'md',
  lineNumbers: true,
  wrap: false,
  softenComments: false,
  foldData: true,
  theme: 'auto',
  motion: 'device',
};

type Ctx = [Settings, (patch: Partial<Settings>) => void, () => void];
const SettingsContext = createContext<Ctx | null>(null);

const EMPTY: Partial<Settings> = {};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useStored<Partial<Settings>>(KEYS.settings, EMPTY);
  const settings = useMemo<Settings>(() => ({ ...DEFAULT_SETTINGS, ...stored }), [stored]);

  const update = useCallback(
    (patch: Partial<Settings>) => setStored((prev) => ({ ...prev, ...patch })),
    [setStored],
  );
  const reset = useCallback(() => removeStored(KEYS.settings), []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
    if (settings.motion === 'calm') root.setAttribute('data-motion', 'calm');
    else root.removeAttribute('data-motion');
  }, [settings.theme, settings.motion]);

  const value = useMemo<Ctx>(() => [settings, update, reset], [settings, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}

/** Calm setting OR prefers-reduced-motion, live-updating. */
export function useCalm(): boolean {
  const [settings] = useSettings();
  const [reduced, setReduced] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return settings.motion === 'calm' || reduced;
}
