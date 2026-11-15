import { useEffect, useState } from 'react';

/** CSS expression per colour. Resolved through a probe element so var() chains and color-mix() work. */
const EXPR = {
  pcb: 'var(--pcb)',
  pcbEdge: 'var(--pcb-edge)',
  metal: 'var(--metal)',
  metalDark: 'var(--metal-dark)',
  pad: 'var(--pad)',
  plastic: 'var(--plastic)',
  hotspot: 'var(--hotspot)',
  red: 'var(--part-red)',
  blue: 'var(--part-blue)',
  sky: 'var(--part-sky)',
  green: 'var(--part-green)',
  glass: 'var(--part-glass)',
  System: 'var(--fam-system)',
  Memory: 'var(--fam-memory)',
  Security: 'var(--fam-security)',
  Connectivity: 'var(--fam-connectivity)',
  Timing: 'var(--fam-timing)',
  Analog: 'var(--fam-analog)',
  Radio: 'var(--fam-radio, var(--part-sky))',
} as const;

export type TokenColors = Record<keyof typeof EXPR, string>;

function read(): TokenColors {
  const root = document.documentElement;
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  root.appendChild(probe);
  const ctx = document.createElement('canvas').getContext('2d');
  const out = {} as TokenColors;
  for (const k of Object.keys(EXPR) as (keyof typeof EXPR)[]) {
    probe.style.color = '';
    probe.style.color = EXPR[k];
    let v = getComputedStyle(probe).color;
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillStyle = v; // normalises color(srgb ...) etc. to #rrggbb / rgba()
      v = String(ctx.fillStyle);
    }
    out[k] = v;
  }
  root.removeChild(probe);
  return out;
}

/** Theme colours for 3D materials; re-read when data-theme changes or the colour scheme flips. */
export function useTokenColors(): TokenColors {
  const [c, setC] = useState<TokenColors>(read);
  useEffect(() => {
    const update = () => setC(read());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener('change', update);
    update();
    return () => {
      mo.disconnect();
      mq?.removeEventListener('change', update);
    };
  }, []);
  return c;
}

export default useTokenColors;
