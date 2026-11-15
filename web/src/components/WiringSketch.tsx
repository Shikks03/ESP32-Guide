import { useId } from 'react';
import type { PinId, Preview, WireRow } from '../content/types';
import './WiringSketch.css';

type Wire = { from: PinId; to: string; color?: 'signal' | 'power' | 'ground' };

function deriveSketch(wire: WireRow[] | null | undefined): Wire[] {
  const out: Wire[] = [];
  for (const r of wire ?? []) {
    if (r.later) continue;
    const m = /^\s*(?:GPIO\s*(\d+)|(VIN)|(GND)|(3V3))\b/i.exec(r.from);
    if (!m) continue;
    if (m[1]) out.push({ from: m[1], to: r.to, color: 'signal' });
    else if (m[2]) out.push({ from: 'VIN', to: r.to, color: 'power' });
    else if (m[3]) out.push({ from: 'GND', to: r.to, color: 'ground' });
    else out.push({ from: '3V3', to: r.to, color: 'power' });
  }
  return out;
}

const WIRE_VAR = { signal: 'var(--w-res)', power: 'var(--w-vcc)', ground: 'var(--w-gnd)' } as const;

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function WiringSketch({ preview, wire }: { preview: Preview; wire?: WireRow[] | null }) {
  const uid = useId();
  const wires: Wire[] = preview.sketch && preview.sketch.length ? preview.sketch : deriveSketch(wire);
  if (!wires.length) return null;
  const ROW = 38;
  const H = 20 + wires.length * ROW;
  const label = wires.map((w) => `${/^\d+$/.test(w.from) ? 'GPIO ' + w.from : w.from} to ${w.to}`).join('; ');
  return (
    <figure className="ui-sketch">
      <svg viewBox={`0 0 420 ${H}`} role="img" aria-labelledby={uid}>
        <title id={uid}>Wiring sketch: {label}</title>
        <rect x={64} y={6} width={22} height={H - 12} rx={5} className="ui-sketch-strip" />
        {wires.map((w, i) => {
          const y = 20 + i * ROW + ROW / 2 - 10;
          const color = WIRE_VAR[w.color ?? 'signal'];
          const pinLabel = /^\d+$/.test(w.from) ? `GPIO ${w.from}` : w.from;
          return (
            <g key={i}>
              <text x={56} y={y + 4} textAnchor="end" className="ui-sketch-pin">{pinLabel}</text>
              <circle cx={75} cy={y} r={4.5} className="ui-sketch-hole" />
              <path d={`M79 ${y} C 150 ${y}, 170 ${y}, 236 ${y}`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
              <rect x={236} y={y - 14} width={176} height={28} rx={6} className="ui-sketch-box" />
              <circle cx={236} cy={y} r={3.5} fill={color} />
              <text x={248} y={y + 4} className="ui-sketch-to">{clip(w.to, 26)}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export default WiringSketch;
