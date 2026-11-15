import type { ReactNode } from 'react';
import type { Fit } from './fit';
import './iso.css';

/* Isometric toon icon kit: a 64×64 canvas, three shaded faces per solid, a 1px ink outline and a soft ground shadow. */

export type V3 = [number, number, number];
type V2 = [number, number];

const CX = Math.cos(Math.PI / 6);
const SY = 0.5;
const ORIGIN: V2 = [32, 36];
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Project a 3D point (x right-down, y left-down, z up) onto the canvas. */
export const pt = ([x, y, z]: V3): V2 => [ORIGIN[0] + (x - y) * CX, ORIGIN[1] + (x + y) * SY - z];
const s = (p: V3) => pt(p).map(r1).join(' ');
export const poly = (...p: V3[]) => `M${p.map(s).join('L')}Z`;
export const line = (...p: V3[]) => `M${p.map(s).join('L')}`;
/** Cubic curve through 3D control points. */
export const bez = (a: V3, c1: V3, c2: V3, b: V3) => `M${s(a)}C${s(c1)} ${s(c2)} ${s(b)}`;
/** Circle of radius r around c, in the plane spanned by u and v. */
export function ring(c: V3, r: number, u: V3 = [1, 0, 0], v: V3 = [0, 1, 0], n = 28): string {
  const pts: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = r * Math.cos(a);
    const sa = r * Math.sin(a);
    pts.push([c[0] + u[0] * ca + v[0] * sa, c[1] + u[1] * ca + v[1] * sa, c[2] + u[2] * ca + v[2] * sa]);
  }
  return poly(...pts);
}
/** Flat-screen arc, angles in degrees, counter-clockwise from the right. */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number) => [r1(cx + r * Math.cos((a * Math.PI) / 180)), r1(cy - r * Math.sin((a * Math.PI) / 180))];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0} ${y0}A${r} ${r} 0 ${+(Math.abs(a1 - a0) > 180)} ${a1 > a0 ? 0 : 1} ${x1} ${y1}`;
}

const HUES = {
  metal: '--metal', steel: '--metal-dark', gold: '--gold', copper: '--copper',
  pcb: '--pcb', edge: '--pcb-edge', plastic: '--plastic', white: '--card-white', silk: '--silk',
  glass: '--part-glass', screen: '--part-screen',
  red: '--part-red', green: '--part-green', blue: '--part-blue', sky: '--part-sky', yellow: '--part-yellow',
  orange: '--part-orange', purple: '--part-purple', pink: '--part-pink', teal: '--part-teal',
  link: '--w-sda', radio: '--fam-radio',
} as const;
export type Hue = keyof typeof HUES;
export type Tone = 'lit' | 'mid' | 'shade' | 'deep';

export function tint(hue: Hue, t: Tone = 'mid'): string {
  const v = `var(${HUES[hue]})`;
  if (t === 'lit') return `color-mix(in oklab, ${v} 74%, var(--part-light))`;
  if (t === 'shade') return `color-mix(in oklab, ${v} 70%, var(--model-ink))`;
  if (t === 'deep') return `color-mix(in oklab, ${v} 45%, var(--model-ink))`;
  return v;
}

/** One filled, inked shape. */
export function Face({ d, hue, t = 'mid', ink = true, opacity }: { d: string; hue: Hue; t?: Tone; ink?: boolean; opacity?: number }) {
  return <path d={d} className={ink ? 'iso-ink' : undefined} style={{ fill: tint(hue, t) }} opacity={opacity} />;
}

/** A box sitting at `at`, `size` = [along x, along y, height]. */
export function Box({ at: [x, y, z], size: [w, d, h], hue, top }: { at: V3; size: V3; hue: Hue; top?: Hue }) {
  const X = x + w;
  const Y = y + d;
  const Z = z + h;
  return (
    <>
      <Face d={poly([x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z])} hue={hue} />
      <Face d={poly([X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z])} hue={hue} t="shade" />
      <Face d={poly([x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z])} hue={top ?? hue} t="lit" />
    </>
  );
}

/** A rectangle lying flat at height z. */
export function Flat({ at: [x, y, z], size: [w, d], hue, t = 'mid', ink = true }: { at: V3; size: [number, number]; hue: Hue; t?: Tone; ink?: boolean }) {
  return <Face d={poly([x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z])} hue={hue} t={t} ink={ink} />;
}

/** A rectangle on the left-facing wall (plane y = const): spans x and z. */
export function WallY({ at: [x, y, z], size: [w, h], hue, t = 'mid', ink = true }: { at: V3; size: [number, number]; hue: Hue; t?: Tone; ink?: boolean }) {
  return <Face d={poly([x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h])} hue={hue} t={t} ink={ink} />;
}

function ellipse(c: V3, r: number) {
  const [cx, cy] = pt(c);
  return { cx, cy, rx: r1(r * Math.SQRT2 * CX), ry: r1(r * Math.SQRT2 * SY) };
}
const ellipsePath = ({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) =>
  `M${r1(cx - rx)} ${r1(cy)}a${rx} ${ry} 0 1 0 ${r1(2 * rx)} 0a${rx} ${ry} 0 1 0 ${r1(-2 * rx)} 0Z`;

/** A flat disc on the ground plane. */
export function Disc({ at, r, hue, t = 'lit', ink = true }: { at: V3; r: number; hue: Hue; t?: Tone; ink?: boolean }) {
  return <Face d={ellipsePath(ellipse(at, r))} hue={hue} t={t} ink={ink} />;
}

/** An upright cylinder: base centre `at`, radius r, height h. */
export function Cyl({ at, r, h, hue, top }: { at: V3; r: number; h: number; hue: Hue; top?: Hue }) {
  const e = ellipse(at, r);
  const L = r1(e.cx - e.rx);
  const R = r1(e.cx + e.rx);
  const yT = r1(e.cy - h);
  const yB = r1(e.cy);
  const side = `M${L} ${yT}L${L} ${yB}A${e.rx} ${e.ry} 0 0 0 ${R} ${yB}L${R} ${yT}A${e.rx} ${e.ry} 0 0 1 ${L} ${yT}Z`;
  return (
    <>
      <Face d={side} hue={hue} />
      <Face d={ellipsePath({ ...e, cy: e.cy - h })} hue={top ?? hue} t="lit" />
    </>
  );
}

/** A rounded cap on top of a cylinder of radius r. */
export function Dome({ at, r, hue, t = 'mid' }: { at: V3; r: number; hue: Hue; t?: Tone }) {
  const e = ellipse(at, r);
  const L = r1(e.cx - e.rx);
  const R = r1(e.cx + e.rx);
  const y = r1(e.cy);
  return <Face d={`M${L} ${y}A${e.rx} ${e.rx} 0 0 1 ${R} ${y}A${e.rx} ${e.ry} 0 0 1 ${L} ${y}Z`} hue={hue} t={t} />;
}

/** A cable: coloured core over an ink casing. */
export function Tube({ d, hue, w = 2, t = 'lit' }: { d: string; hue: Hue; w?: number; t?: Tone }) {
  return (
    <>
      <path d={d} className="iso-casing" style={{ strokeWidth: w + 1.6 }} />
      <path d={d} className="iso-wire" style={{ stroke: tint(hue, t), strokeWidth: w }} />
    </>
  );
}

/** A plain coloured stroke (signal arcs, printed marks). */
export function Stroke({ d, hue, w = 1.6, t = 'mid', dash, opacity }: { d: string; hue: Hue; w?: number; t?: Tone; dash?: string; opacity?: number }) {
  return <path d={d} className="iso-wire" style={{ stroke: tint(hue, t), strokeWidth: w, strokeDasharray: dash }} opacity={opacity} />;
}

/** A flat-screen shape given thickness downwards. */
export function Slab({ d, hue, depth = 3, t = 'mid' }: { d: string; hue: Hue; depth?: number; t?: Tone }) {
  const steps = Array.from({ length: Math.max(1, Math.round(depth * 2)) }, (_, i) => (i + 1) / 2);
  return (
    <>
      {steps.map((dy, i) => (
        <path key={dy} d={d} transform={`translate(0 ${dy})`} style={{ fill: tint(hue, 'shade') }} className={i === steps.length - 1 ? 'iso-ink' : undefined} />
      ))}
      <path d={d} style={{ fill: tint(hue, t) }} className="iso-ink" />
    </>
  );
}

/** Soft light around a screen point. */
export function Glow({ at, r, hue }: { at: V3; r: number; hue: Hue }) {
  const [x, y] = pt(at);
  return (
    <g className="iso-glow" style={{ fill: tint(hue, 'lit') }}>
      <circle cx={r1(x)} cy={r1(y)} r={r} opacity={0.2} />
      <circle cx={r1(x)} cy={r1(y)} r={r1(r * 0.62)} opacity={0.32} />
      <circle cx={r1(x)} cy={r1(y)} r={r1(r * 0.3)} opacity={0.5} />
    </g>
  );
}

/** Radio arcs fanning out from a 3D point. */
export function Waves({ at, hue, a0 = 20, a1 = 80, radii = [5, 9], w = 1.8 }: { at: V3; hue: Hue; a0?: number; a1?: number; radii?: number[]; w?: number }) {
  const [x, y] = pt(at);
  return (
    <>
      {radii.map((r, i) => (
        <Stroke key={r} d={arc(r1(x), r1(y), r, a0, a1)} hue={hue} w={w} t={i === radii.length - 1 ? 'lit' : 'mid'} />
      ))}
    </>
  );
}

export function Shadow({ rx = 20, y = 47 }: { rx?: number; y?: number }) {
  return <ellipse cx={32} cy={y} rx={rx} ry={r1(rx * 0.32)} className="iso-shadow" />;
}

/** Move and scale a group of solids in screen space. */
export function G({ dx = 0, dy = 0, k = 1, children }: { dx?: number; dy?: number; k?: number; children: ReactNode }) {
  return <g transform={`translate(${dx + 32} ${dy + 38}) scale(${k}) translate(-32 -38)`}>{children}</g>;
}

/** The svg shell every illustrated icon sits in. `fit` centres the drawing and scales it to fill the canvas. */
export function IsoIcon({ size = 32, fit, children, className }: { size?: number; fit?: Fit; children: ReactNode; className?: string }) {
  const [cx, cy, k] = fit ?? [32, 37, 1.26];
  return (
    <svg className={`iso${className ? ` ${className}` : ''}`} data-small={size < 26 ? '' : undefined} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g transform={`translate(32 32) scale(${k}) translate(${-cx} ${-cy})`}>{children}</g>
    </svg>
  );
}
