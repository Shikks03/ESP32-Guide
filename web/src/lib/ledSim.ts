import type { LedSim, TermLine } from '../content/types';

/** Port of the original guide's LED simulation (same maths as the firmware). */
export interface LedState {
  mode: 'off' | 'on' | 'blink' | 'fade' | 'sos';
  blinkMs: number;
  level: number; // 0-255
}

export const SOS = [200, 200, 200, 200, 200, 600, 600, 200, 600, 200, 600, 600, 200, 200, 200, 200, 200, 1400];
const SOS_TOTAL = SOS.reduce((a, b) => a + b, 0);

export const HELP = 'Commands: on | off | blink [ms] | fade | sos | level <0-255> | touch | help';

export function initialLedState(led?: LedSim): LedState {
  return {
    mode: led?.mode ?? 'off',
    blinkMs: led?.blinkMs || 500,
    level: led?.level == null ? 255 : led.level,
  };
}

/** Brightness 0..1 at time `now` (ms). */
export function ledLevel(state: LedState, now: number): number {
  const lv = state.level / 255;
  switch (state.mode) {
    case 'on':
      return lv;
    case 'off':
      return 0;
    case 'blink':
      return Math.floor(now / state.blinkMs) % 2 === 0 ? lv : 0;
    case 'fade': {
      const t = now % 2000;
      const tri = t < 1000 ? t : 2000 - t;
      return (tri / 1000) * lv;
    }
    case 'sos': {
      let u = now % SOS_TOTAL;
      for (let i = 0; i < SOS.length; i++) {
        if (u < SOS[i]) return i % 2 === 0 ? lv : 0;
        u -= SOS[i];
      }
      return 0;
    }
  }
}

export function ledStateLine(s: LedState): string {
  return 'Now: mode=' + s.mode + ' level=' + s.level + ' blink=' + s.blinkMs + 'ms';
}

export function ledBootLines(state: LedState = initialLedState()): TermLine[] {
  return [
    { text: '[I] LED on GPIO 2 ready. Touch wire on GPIO 4.', cls: 'hi' },
    { text: HELP },
    { text: ledStateLine(state) },
  ];
}

/** Runs one typed command. Returns the new state and the lines to append (none for blank input). */
export function runLedCommand(state: LedState, raw: string): { state: LedState; lines: TermLine[] } {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return { state, lines: [] };
  const next: LedState = { ...state };
  const lines: TermLine[] = [{ text: '> ' + cmd, cls: 'in' }];
  const sp = cmd.indexOf(' ');
  const name = sp < 0 ? cmd : cmd.slice(0, sp);
  let arg = sp < 0 ? -1 : parseInt(cmd.slice(sp + 1), 10);
  if (isNaN(arg)) arg = 0;
  const setMode = (m: LedState['mode']) => {
    next.mode = m;
    lines.push({ text: '[I] mode -> ' + m });
  };
  if (name === 'on' || name === 'off' || name === 'fade' || name === 'sos') setMode(name);
  else if (name === 'blink') {
    if (arg > 0) next.blinkMs = arg;
    setMode('blink');
  } else if (name === 'level' && arg >= 0 && sp >= 0) next.level = Math.max(0, Math.min(255, arg));
  else if (name === 'touch')
    lines.push({ text: '[I] touch printing on (a real board prints the live reading every 250 ms)' });
  else lines.push({ text: HELP });
  lines.push({ text: ledStateLine(next) });
  return { state: next, lines };
}
