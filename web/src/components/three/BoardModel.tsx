import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { CanvasTexture, Object3D, Path, Shape, SRGBColorSpace, type Group, type InstancedMesh, type MeshStandardMaterial, type Texture } from 'three';
import type { HotspotId } from '../../content/types';
import type { TokenColors } from './useTokenColors';

/*
 * The user's board, modelled from a top-down photo (USB-C on the left): a 30-pin ESP32 DevKit with a
 * CH340C, an AMS1117 regulator, EN/BOOT buttons, a red PWR LED, a blue D2 LED and an ESP-WROOM-32.
 * Coordinates are millimetres from the board's top-left corner (x right, z down), 1 mm = U scene units.
 * Simple geometry only: boxes, cylinders, extrusions and canvas-drawn silkscreen / shield text.
 */
export const BOARD_W = 51.8;
export const BOARD_H = 28;
export const U = 0.16;
const T = 1.6; // PCB thickness
export const mx = (x: number) => (x - BOARD_W / 2) * U;
export const mz = (z: number) => (z - BOARD_H / 2) * U;
const mm = (v: number) => v * U;

/** Header geometry (photo: 15 + 15 pins, 2.54 mm pitch). Pin 0 is the left end of each row. */
export const PIN_X0 = 9.7;
export const PITCH = 2.54;
export const ROW_TOP_Z = 1.6;
export const ROW_BOT_Z = 26.4;
export const TOP_LABELS = ['VIN', 'GND', 'D13', 'D12', 'D14', 'D27', 'D26', 'D25', 'D33', 'D32', 'D35', 'D34', 'VN', 'VP', 'EN'];
export const BOT_LABELS = ['3V3', 'GND', 'D15', 'D2', 'D4', 'D16', 'D17', 'D5', 'D18', 'D19', 'D21', 'RX0', 'TX0', 'D22', 'D23'];
const pinX = (i: number) => PIN_X0 + PITCH * i;

/** Module and shield can (photo). */
const MOD = { x0: 26.0, x1: 51.5, z0: 5.0, z1: 23.0, y0: 0.1, y1: 0.9 };
const CAN = { x0: 27.25, x1: 45.25, z0: 5.8, z1: 22.2, h: 2.3 };
/** Centre of the WROOM-32 can, for camera targets (scene units). */
export const MODULE_CENTER: [number, number] = [mx((CAN.x0 + CAN.x1) / 2), mz((CAN.z0 + CAN.z1) / 2)];

/** Hotspot anchors in mm: [x, z, height above the PCB]. */
export const HOTSPOT_MM: Record<HotspotId, [number, number, number]> = {
  usb: [1.6, 14, 6.4],
  buttons: [3.3, 6.4, 5],
  leds: [22.9, 16.3, 4.2],
  module: [(CAN.x0 + CAN.x1) / 2, 14, 6.6],
  antenna: [48.4, 14, 4.2],
  headers: [pinX(7), ROW_TOP_Z, 4.4],
};

/* Fixed physical colours: the board looks the same in both themes; only the highlight follows the theme. */
const COL = {
  mask: '#040405',
  maskEdge: '#202224',
  silver: '#c9cbcd',
  steel: '#9a9da0',
  dark: '#1a1b1c',
  black: '#0d0e0f',
  tan: '#b89b72',
  gold: '#c9a24c',
  tin: '#d6d3cb',
  btnBody: '#b7b9bb',
  ledBody: '#ece8de',
  red: '#ff2a2a',
  blue: '#2f7bff',
};

/** Mutable animation state (written by ChipLayers3D, read by the materials every frame). */
export interface Fade {
  board: number;
  can: number;
  canLift: number;
  module: number;
  die: number;
}
export const FADE_FULL: Fade = { board: 1, can: 1, canLift: 0, module: 1, die: 0 };

type FadeGroup = 'board' | 'can' | 'module' | 'die';

interface Ctx {
  c: TokenColors;
  selected?: HotspotId;
  fade: MutableRefObject<Fade>;
}
const BoardCtx = createContext<Ctx | null>(null);
export const useBoardCtx = () => {
  const v = useContext(BoardCtx);
  if (!v) throw new Error('BoardCtx');
  return v;
};

interface MatProps {
  color: string;
  group?: FadeGroup;
  op?: number;
  emissive?: string;
  ei?: number;
  metal?: number;
  rough?: number;
  hot?: HotspotId;
  map?: Texture;
  /** Decals (silkscreen, markings): always blended, never write depth. */
  decal?: boolean;
}

/** Standard material that follows the shared fade state and lights up when its hotspot is selected. */
export function Mat({ color, group = 'board', op = 1, emissive, ei = 0, metal = 0.1, rough = 0.6, hot, map, decal }: MatProps) {
  const { c, selected, fade } = useBoardCtx();
  const m = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    const mat = m.current;
    if (!mat) return;
    const o = fade.current[group] * op;
    if (mat.opacity !== o) {
      mat.opacity = o;
      const t = decal || o < 0.999;
      if (mat.transparent !== t) {
        mat.transparent = t;
        mat.needsUpdate = true;
      }
      mat.depthWrite = !decal && o > 0.6;
      mat.visible = o > 0.01;
    }
  });
  const on = hot !== undefined && selected === hot;
  return (
    <meshStandardMaterial
      ref={m}
      color={color}
      map={map ?? null}
      transparent={!!decal}
      depthWrite={!decal}
      polygonOffset={!!decal}
      polygonOffsetFactor={decal ? -2 : 0}
      metalness={metal}
      roughness={rough}
      emissive={on ? c.hotspot : (emissive ?? '#000000')}
      emissiveIntensity={on ? 0.35 : ei}
    />
  );
}

interface BxProps extends MatProps {
  /** centre x, z in mm */
  at: [number, number];
  /** size x, z in mm */
  sz: [number, number];
  /** bottom height and height, mm */
  y0?: number;
  h: number;
  ry?: number;
  edges?: boolean;
  name?: string;
}

/** A box placed in board millimetres. */
function Bx({ at, sz, y0 = 0, h, ry = 0, edges, name, ...mat }: BxProps) {
  const { c, selected } = useBoardCtx();
  const on = edges !== false && mat.hot !== undefined && selected === mat.hot;
  return (
    <mesh name={name} position={[mx(at[0]), mm(y0 + h / 2), mz(at[1])]} rotation={[0, ry, 0]}>
      <boxGeometry args={[mm(sz[0]), mm(h), mm(sz[1])]} />
      <Mat {...mat} />
      {on && <Edges color={c.hotspot} threshold={20} />}
    </mesh>
  );
}

type Pt = [number, number, number]; // x mm, y mm (centre), z mm

/** Many copies of one small part in a single draw call. */
function Inst({ pts, children, ...mat }: { pts: Pt[]; children: ReactNode } & MatProps) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    pts.forEach(([x, y, z], i) => {
      o.position.set(mx(x), mm(y), mz(z));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [pts]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]}>
      {children}
      <Mat {...mat} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ shapes and textures */

/** Rounded rectangle in board mm, as a Shape in the PCB's extrusion plane (shape y = -scene z). */
function roundRect(x0: number, z0: number, x1: number, z1: number, r: number): Shape {
  const into = new Shape();
  const a = mx(x0), b = mx(x1), top = -mz(z0), bot = -mz(z1), R = mm(r);
  into.moveTo(a + R, bot);
  into.lineTo(b - R, bot);
  into.quadraticCurveTo(b, bot, b, bot + R);
  into.lineTo(b, top - R);
  into.quadraticCurveTo(b, top, b - R, top);
  into.lineTo(a + R, top);
  into.quadraticCurveTo(a, top, a, top - R);
  into.lineTo(a, bot + R);
  into.quadraticCurveTo(a, bot, a + R, bot);
  return into;
}

const HOLES: [number, number][] = [[2.1, 2.2], [49.7, 2.2], [2.1, 25.8], [49.7, 25.8]];

function useCanvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Texture | undefined {
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return undefined;
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d');
    if (!g) return undefined;
    draw(g);
    const t = new CanvasTexture(cv);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
    // draw functions are static per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

const PX = 40; // silkscreen texture: pixels per mm

/** Text squeezed to fit `maxW` px, like condensed silkscreen lettering. */
function fitText(g: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number) {
  const w = g.measureText(s).width;
  const k = w > maxW ? maxW / w : 1;
  g.save();
  g.translate(x, y);
  g.scale(k, 1);
  g.fillText(s, 0, 0);
  g.restore();
}

function drawSilk(g: CanvasRenderingContext2D) {
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  g.fillStyle = '#ecece8';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 40px Arial, Helvetica, sans-serif';
  TOP_LABELS.forEach((s, i) => fitText(g, s, pinX(i) * PX, 3.3 * PX, 2.5 * PX));
  BOT_LABELS.forEach((s, i) => fitText(g, s, pinX(i) * PX, 24.75 * PX, 2.5 * PX));
  g.font = '700 34px Arial, Helvetica, sans-serif';
  fitText(g, 'EN', 3.45 * PX, 8.75 * PX, 3 * PX);
  fitText(g, 'BOOT', 3.45 * PX, 19.45 * PX, 3.6 * PX);
  fitText(g, '1', 20.2 * PX, 12.2 * PX, 1 * PX);
  // vertical labels beside the LED column, read top to bottom
  const vert = (s: string, x: number, z: number) => {
    g.save();
    g.translate(x * PX, z * PX);
    g.rotate(Math.PI / 2);
    g.fillText(s, 0, 0);
    g.restore();
  };
  g.font = '700 36px Arial, Helvetica, sans-serif';
  vert('PWR', 24.6, 13.2);
  vert('D2', 24.6, 20.6);
}

/** Etched lettering on the WROOM-32 can, rotated 90° clockwise as on the photo (reads top to bottom). */
function drawCan(g: CanvasRenderingContext2D) {
  const k = g.canvas.width / (CAN.x1 - CAN.x0); // px per mm
  const W = g.canvas.width, H = g.canvas.height;
  g.fillStyle = '#45484b';
  g.fillRect(0, 0, W, H);
  // pin-1 dot (top-left of the can)
  g.fillStyle = '#2a2c2e';
  g.beginPath();
  g.arc(2.2 * k, 2.4 * k, 0.4 * k, 0, Math.PI * 2);
  g.fill();
  // rotate: text x runs down the can (z), text lines step leftwards from the right edge
  g.save();
  g.translate(W, 0);
  g.rotate(Math.PI / 2);
  g.fillStyle = '#a3a5a7';
  g.strokeStyle = '#a3a5a7';
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  const line = (dFromRight: number) => dFromRight * k; // text-frame y
  // line 1: Wi-Fi mark + ESP-32
  const y1 = line(4.6);
  g.lineWidth = 0.2 * k;
  g.beginPath();
  g.roundRect(2.9 * k, y1 - 1.1 * k, 5.2 * k, 2.2 * k, 1.0 * k);
  g.stroke();
  g.font = `700 ${1.3 * k}px Arial, Helvetica, sans-serif`;
  g.textAlign = 'center';
  g.fillText('WiFi', 5.5 * k, y1 + 0.05 * k);
  g.textAlign = 'left';
  g.font = `600 ${2.7 * k}px Arial, Helvetica, sans-serif`;
  fitText(g, 'ESP-32', 8.6 * k, y1 + 0.1 * k, 7.4 * k);
  // line 2: certification marks
  const y2 = line(8.0);
  g.lineWidth = 0.2 * k;
  g.beginPath();
  g.arc(4.7 * k, y2, 1.35 * k, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(4.7 * k, y2, 0.75 * k, Math.PI, Math.PI * 2);
  g.moveTo(3.6 * k, y2 + 0.3 * k);
  g.lineTo(5.8 * k, y2 + 0.3 * k);
  g.stroke();
  g.beginPath();
  g.ellipse(8.9 * k, y2, 1.05 * k, 1.25 * k, 0, 0, Math.PI * 2);
  g.fill();
  g.font = `700 ${2.0 * k}px Arial, Helvetica, sans-serif`;
  fitText(g, 'FC', 10.5 * k, y2 + 0.05 * k, 2.4 * k);
  fitText(g, 'CE', 14.0 * k, y2 + 0.05 * k, 2.3 * k);
  // lines 3 and 4 run the length of the can
  g.font = `600 ${1.45 * k}px Arial, Helvetica, sans-serif`;
  fitText(g, 'WiFi+BT SoC Inside', 3.3 * k, line(10.9), 13.0 * k);
  fitText(g, 'ISM2.4G 802.11/b/g/n', 3.3 * k, line(12.9), 13.0 * k);
  g.restore();
}

function drawMark(lines: string[], rot = 0) {
  return (g: CanvasRenderingContext2D) => {
    const W = g.canvas.width, H = g.canvas.height;
    g.fillStyle = '#18191a';
    g.fillRect(0, 0, W, H);
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(rot);
    g.fillStyle = '#6c6f72';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const fs = Math.min(W, H) / (lines.length + 1.2);
    g.font = `600 ${fs}px Arial, Helvetica, sans-serif`;
    lines.forEach((s, i) => g.fillText(s, 0, (i - (lines.length - 1) / 2) * fs * 1.15));
    g.restore();
  };
}

/** A flat textured patch on top of a part. */
function Decal({ at, sz, y, map, hot, group }: { at: [number, number]; sz: [number, number]; y: number; map?: Texture; hot?: HotspotId; group?: FadeGroup }) {
  if (!map) return null;
  return (
    <mesh position={[mx(at[0]), mm(y) + 0.002, mz(at[1])]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[mm(sz[0]), mm(sz[1])]} />
      <Mat color="#ffffff" map={map} decal hot={hot} group={group} rough={0.7} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ parts */

function Pcb() {
  const geo = useMemo(() => {
    const s = roundRect(0, 0, BOARD_W, BOARD_H, 0.9);
    HOLES.forEach(([x, z]) => {
      const p = new Path();
      p.absarc(mx(x), -mz(z), mm(1.05), 0, Math.PI * 2, true);
      s.holes.push(p);
    });
    return s;
  }, []);
  return (
    <mesh position={[0, -mm(T), 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={[geo, { depth: mm(T), bevelEnabled: false, curveSegments: 10 }]} />
      <Mat color={COL.mask} rough={0.85} metal={0.05} />
    </mesh>
  );
}

function MountingHoles() {
  return (
    <>
      {HOLES.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[mx(x), 0, mz(z)]}>
          {[0.004, -mm(T) - 0.004].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[y > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0]}>
              <ringGeometry args={[mm(1.05), mm(1.6), 24]} />
              <Mat color={COL.silver} metal={0.4} rough={0.35} />
            </mesh>
          ))}
          <mesh position={[0, -mm(T) / 2, 0]}>
            <cylinderGeometry args={[mm(1.06), mm(1.06), mm(T), 20, 1, true]} />
            <Mat color={COL.steel} metal={0.4} rough={0.4} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Header pins: solder joints on top; pins, plastic strips and solder pads underneath (generic: no photo of the underside). */
function Headers() {
  const round = useMemo<Pt[]>(() => {
    const out: Pt[] = [];
    for (let i = 0; i < 15; i++) {
      if (i !== 14) out.push([pinX(i), 0.05, ROW_TOP_Z]); // EN: square pad
      if (i !== 14) out.push([pinX(i), 0.05, ROW_BOT_Z]); // D23: square pad
    }
    return out;
  }, []);
  const joints = useMemo<Pt[]>(() => {
    const out: Pt[] = [];
    for (let i = 0; i < 15; i++) out.push([pinX(i), 0.12, ROW_TOP_Z], [pinX(i), 0.12, ROW_BOT_Z]);
    return out;
  }, []);
  const under = useMemo<Pt[]>(() => joints.map(([x, , z]) => [x, -T - 4.25, z]), [joints]);
  const underPads = useMemo<Pt[]>(() => joints.map(([x, , z]) => [x, -T - 0.05, z]), [joints]);
  const midX = (pinX(0) + pinX(14)) / 2;
  return (
    <group>
      <Inst pts={round} color={COL.silver} metal={0.4} rough={0.3} hot="headers">
        <cylinderGeometry args={[mm(0.85), mm(0.85), mm(0.1), 20]} />
      </Inst>
      {[ROW_TOP_Z, ROW_BOT_Z].map((z) => (
        <Bx key={z} at={[pinX(14), z]} sz={[1.7, 1.7]} y0={0} h={0.1} color={COL.silver} metal={0.4} rough={0.3} hot="headers" edges={false} />
      ))}
      {/* solder joints seen from above (the pins point down) */}
      <Inst pts={joints} color={COL.silver} metal={0.45} rough={0.25} hot="headers">
        <sphereGeometry args={[mm(0.62), 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </Inst>
      {/* underside */}
      <Inst pts={underPads} color={COL.silver} metal={0.4} rough={0.3} hot="headers">
        <cylinderGeometry args={[mm(0.85), mm(0.85), mm(0.1), 20]} />
      </Inst>
      {[ROW_TOP_Z, ROW_BOT_Z].map((z) => (
        <Bx key={`s${z}`} at={[midX, z]} sz={[15 * PITCH, 2.5]} y0={-T - 2.5} h={2.5} color={COL.black} rough={0.75} hot="headers" />
      ))}
      <Inst pts={under} color={COL.gold} metal={0.5} rough={0.3} hot="headers">
        <boxGeometry args={[mm(0.64), mm(8.5), mm(0.64)]} />
      </Inst>
    </group>
  );
}

function UsbC() {
  const L = 7.3, Wd = 8.94, Hh = 3.2, xs = -1.9, zc = 14;
  const shape = useMemo(() => {
    // cross-section in the (u = -z, v = y) plane, extruded along x
    const s = new Shape();
    const a = -Wd / 2, b = Wd / 2, r = 1.45;
    const P = (u: number, v: number) => [mm(u), mm(v)] as const;
    s.moveTo(...P(a + r, 0));
    s.lineTo(...P(b - r, 0));
    s.quadraticCurveTo(...P(b, 0), ...P(b, r));
    s.lineTo(...P(b, Hh - r));
    s.quadraticCurveTo(...P(b, Hh), ...P(b - r, Hh));
    s.lineTo(...P(a + r, Hh));
    s.quadraticCurveTo(...P(a, Hh), ...P(a, Hh - r));
    s.lineTo(...P(a, r));
    s.quadraticCurveTo(...P(a, 0), ...P(a + r, 0));
    return s;
  }, []);
  const { c, selected } = useBoardCtx();
  return (
    <group>
      <mesh position={[mx(xs), 0, mz(zc)]} rotation={[0, Math.PI / 2, 0]}>
        <extrudeGeometry args={[shape, { depth: mm(L), bevelEnabled: false, curveSegments: 8 }]} />
        <Mat color={COL.silver} metal={0.45} rough={0.3} hot="usb" />
        {selected === 'usb' && <Edges color={c.hotspot} threshold={25} />}
      </mesh>
      {/* the opening on the left face, with its tongue */}
      <mesh position={[mx(xs) - 0.002, mm(Hh / 2), mz(zc)]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[mm(Wd - 0.7), mm(Hh - 0.7)]} />
        <Mat color={COL.black} rough={0.9} hot="usb" />
      </mesh>
      <Bx at={[xs + 0.6, zc]} sz={[1.2, 6.4]} y0={Hh / 2 - 0.35} h={0.7} color="#2b2c2e" rough={0.6} hot="usb" edges={false} />
      {/* latch slots in the top of the shell, and the side tabs */}
      {[-1.9, 1.9].map((dz) => (
        <Bx key={dz} at={[3.9, zc + dz]} sz={[1.9, 0.75]} y0={Hh} h={0.02} color={COL.black} rough={0.9} hot="usb" edges={false} />
      ))}
      {[-1, 1].map((sgn) => (
        <Bx key={`t${sgn}`} at={[4.2, zc + sgn * (Wd / 2 + 0.35)]} sz={[1.4, 0.7]} h={0.5} color={COL.silver} metal={0.4} rough={0.35} hot="usb" edges={false} />
      ))}
    </group>
  );
}

function Button({ z }: { z: number }) {
  const x = 3.3;
  return (
    <group>
      <Bx at={[x, z]} sz={[4.4, 3.1]} h={1.4} color={COL.btnBody} metal={0.55} rough={0.45} hot="buttons" />
      <mesh position={[mx(x), mm(1.4 + 0.3), mz(z)]}>
        <cylinderGeometry args={[mm(0.95), mm(1.0), mm(0.6), 20]} />
        <Mat color="#2a2b2d" rough={0.55} hot="buttons" />
      </mesh>
      {[-1, 1].map((s) =>
        [-0.85, 0.85].map((dz) => (
          <Bx key={`${s}${dz}`} at={[x + s * 2.55, z + dz]} sz={[0.8, 0.6]} h={0.25} color={COL.silver} metal={0.4} rough={0.35} hot="buttons" edges={false} />
        )),
      )}
    </group>
  );
}

/** 0603/0805-style passives: [x, z, vertical?]. */
const CAPS: [number, number, boolean][] = [
  [7.9, 5.5, true], [7.9, 8.25, true], [7.9, 11.15, true], [11.7, 11.2, true], [23.6, 6.4, true], [23.6, 9.0, true], [20.2, 22.0, true], [7.5, 22.4, true],
];
const RESISTORS: [number, number, boolean][] = [
  [22.0, 11.0, true], [22.9, 15.1, false], [22.9, 16.7, false], [22.9, 21.5, false], [22.9, 22.9, false],
  [14.6, 20.6, false], [14.6, 22.0, false], [8.1, 16.8, true], [9.6, 16.8, true],
];

function Passives() {
  const body = (list: [number, number, boolean][], v: boolean): Pt[] => list.filter((p) => p[2] === v).map(([x, z]) => [x, 0.25, z]);
  const ends = (list: [number, number, boolean][]): Pt[] =>
    list.flatMap(([x, z, v]) => (v ? [[x, 0.26, z - 0.65], [x, 0.26, z + 0.65]] : [[x - 0.65, 0.26, z], [x + 0.65, 0.26, z]]) as Pt[]);
  const all = [...CAPS, ...RESISTORS];
  return (
    <group>
      <Inst pts={body(CAPS, true)} color={COL.tan} rough={0.6}>
        <boxGeometry args={[mm(0.85), mm(0.5), mm(1.1)]} />
      </Inst>
      <Inst pts={body(RESISTORS, true)} color={COL.dark} rough={0.5}>
        <boxGeometry args={[mm(0.85), mm(0.5), mm(1.1)]} />
      </Inst>
      <Inst pts={body(RESISTORS, false)} color={COL.dark} rough={0.5}>
        <boxGeometry args={[mm(1.1), mm(0.5), mm(0.85)]} />
      </Inst>
      <Inst pts={ends(all)} color={COL.silver} metal={0.4} rough={0.35}>
        <boxGeometry args={[mm(0.45), mm(0.52), mm(0.45)]} />
      </Inst>
    </group>
  );
}

/** Larger parts on the left half: AMS1117 (SOT-223), two "106" capacitors, a SOD-123 diode, two SOT-23s, the CH340C. */
function LeftParts() {
  const reg = useCanvasTexture(160, 300, drawMark(['AMS1117', '3.3'], Math.PI / 2));
  const cap106 = useCanvasTexture(80, 160, drawMark(['106'], Math.PI / 2));
  const ch340 = useCanvasTexture(600, 240, drawMark(['CH340C', 'JCM']));
  const chLegs = useMemo<Pt[]>(() => {
    const out: Pt[] = [];
    for (let i = 0; i < 8; i++) {
      const x = 15.34 + (i - 3.5) * 1.27;
      out.push([x, 0.15, 16.35 - 2.45], [x, 0.15, 16.35 + 2.45]);
    }
    return out;
  }, []);
  return (
    <group>
      {/* AMS1117-3.3 regulator: body, three legs on the left, wide tab on the right */}
      <Bx at={[16.8, 7.45]} sz={[3.45, 6.5]} h={1.6} color={COL.dark} rough={0.5} />
      <Decal at={[16.8, 7.45]} sz={[3.0, 5.6]} y={1.6} map={reg} />
      {[5.15, 7.45, 9.75].map((z) => (
        <Bx key={z} at={[14.5, z]} sz={[1.3, 0.7]} h={0.3} color={COL.silver} metal={0.4} rough={0.35} />
      ))}
      <Bx at={[19.5, 7.45]} sz={[2.0, 3.3]} h={0.35} color={COL.silver} metal={0.4} rough={0.35} />
      {/* two "106" 1206 capacitors, the SOD-123 diode */}
      {[[11.7, 7.6], [22.0, 7.1]].map(([x, z]) => (
        <group key={x}>
          <Bx at={[x, z]} sz={[1.6, 3.2]} h={1.1} color={COL.dark} rough={0.5} />
          <Decal at={[x, z]} sz={[1.3, 2.0]} y={1.1} map={cap106} />
          <Bx at={[x, z - 1.45]} sz={[1.62, 0.5]} h={1.12} color={COL.silver} metal={0.4} rough={0.35} />
          <Bx at={[x, z + 1.45]} sz={[1.62, 0.5]} h={1.12} color={COL.silver} metal={0.4} rough={0.35} />
        </group>
      ))}
      <Bx at={[9.7, 9.5]} sz={[1.6, 2.7]} h={1.05} color="#2a2b2d" rough={0.5} />
      {[8.0, 11.0].map((z) => (
        <Bx key={z} at={[9.7, z]} sz={[0.9, 0.6]} h={0.3} color={COL.silver} metal={0.4} rough={0.35} />
      ))}
      {/* two SOT-23s below the CH340C */}
      {[11.7, 17.9].map((x) => (
        <group key={x}>
          <Bx at={[x, 22.0]} sz={[2.9, 1.4]} h={1.0} color={COL.dark} rough={0.5} />
          {[[x - 0.95, 21.0], [x + 0.95, 21.0], [x, 23.0]].map(([lx, lz]) => (
            <Bx key={`${lx}${lz}`} at={[lx, lz]} sz={[0.45, 0.7]} h={0.25} color={COL.silver} metal={0.4} rough={0.35} />
          ))}
        </group>
      ))}
      {/* CH340C USB-serial chip (SOIC-16, pin 1 top right as on the photo) */}
      <Bx at={[15.34, 16.35]} sz={[9.9, 3.9]} h={1.5} color="#151617" rough={0.45} hot="usb" />
      <Decal at={[15.34, 16.35]} sz={[9.4, 3.5]} y={1.5} map={ch340} hot="usb" />
      <mesh position={[mx(19.6), mm(1.5) + 0.003, mz(15.1)]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[mm(0.35), 16]} />
        <Mat color="#3a3c3e" rough={0.8} hot="usb" />
      </mesh>
      <Inst pts={chLegs} color={COL.silver} metal={0.4} rough={0.3} hot="usb">
        <boxGeometry args={[mm(0.42), mm(0.3), mm(1.0)]} />
      </Inst>
    </group>
  );
}

/** Red PWR LED and blue D2 LED (GPIO 2), both lit. */
function Leds() {
  return (
    <group>
      {[
        { z: 12.9, color: COL.red, ei: 1.1 },
        { z: 19.6, color: COL.blue, ei: 1.6 },
      ].map(({ z, color, ei }) => (
        <group key={z}>
          <Bx at={[22.9, z]} sz={[1.6, 0.8]} h={0.35} color={COL.ledBody} rough={0.4} hot="leds" />
          <Bx at={[22.9, z]} sz={[1.0, 0.6]} y0={0.35} h={0.25} color={color} emissive={color} ei={ei} rough={0.25} hot="leds" />
          {[-0.75, 0.75].map((dx) => (
            <Bx key={dx} at={[22.9 + dx, z]} sz={[0.3, 0.82]} h={0.37} color={COL.silver} metal={0.4} rough={0.35} hot="leds" edges={false} />
          ))}
        </group>
      ))}
    </group>
  );
}

function Module() {
  const can = useRef<Group>(null);
  const { fade } = useBoardCtx();
  useFrame(() => {
    if (can.current) can.current.position.y = fade.current.canLift;
  });
  const canShape = useMemo(() => roundRect(CAN.x0, CAN.z0, CAN.x1, CAN.z1, 0.7), []);
  const canTex = useCanvasTexture(1080, Math.round(((CAN.z1 - CAN.z0) / (CAN.x1 - CAN.x0)) * 1080), drawCan);
  const { c, selected } = useBoardCtx();
  // castellated pads: 14 + 14 along the long edges, 10 across the short edge opposite the antenna
  // half-hole strips on the module edge, and the solder pads they sit on
  const sideX = Array.from({ length: 14 }, (_, i) => 27.8 + 1.27 * i);
  const endZ = Array.from({ length: 10 }, (_, i) => 14 + (i - 4.5) * 1.45);
  const sideStrips = useMemo<Pt[]>(() => sideX.flatMap((x) => [[x, 0.5, MOD.z0 + 0.1], [x, 0.5, MOD.z1 - 0.1]] as Pt[]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const sidePads = useMemo<Pt[]>(() => sideX.flatMap((x) => [[x, 0.03, MOD.z0 - 0.35], [x, 0.03, MOD.z1 + 0.35]] as Pt[]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const endStrips = useMemo<Pt[]>(() => endZ.map((z) => [MOD.x0 + 0.1, 0.5, z] as Pt), []); // eslint-disable-line react-hooks/exhaustive-deps
  const endPads = useMemo<Pt[]>(() => endZ.map((z) => [MOD.x0 - 0.35, 0.03, z] as Pt), []); // eslint-disable-line react-hooks/exhaustive-deps
  // antenna meander under the solder mask
  const tw = 0.35;
  const rows = Array.from({ length: 8 }, (_, i) => 7.2 + i * 2.05);
  return (
    <group>
      {/* module PCB */}
      <Bx at={[(MOD.x0 + MOD.x1) / 2, (MOD.z0 + MOD.z1) / 2]} sz={[MOD.x1 - MOD.x0, MOD.z1 - MOD.z0]} y0={MOD.y0} h={MOD.y1 - MOD.y0} color={COL.mask} rough={0.7} group="module" hot="module" edges={false} />
      <Inst pts={sideStrips} color={COL.tin} metal={0.2} rough={0.3} group="module" hot="module">
        <boxGeometry args={[mm(0.8), mm(0.82), mm(0.3)]} />
      </Inst>
      <Inst pts={sidePads} color={COL.tin} metal={0.2} rough={0.3} group="module" hot="module">
        <boxGeometry args={[mm(0.85), mm(0.06), mm(0.8)]} />
      </Inst>
      <Inst pts={endStrips} color={COL.tin} metal={0.2} rough={0.3} group="module" hot="module">
        <boxGeometry args={[mm(0.3), mm(0.82), mm(0.8)]} />
      </Inst>
      <Inst pts={endPads} color={COL.tin} metal={0.2} rough={0.3} group="module" hot="module">
        <boxGeometry args={[mm(0.8), mm(0.06), mm(0.85)]} />
      </Inst>
      {/* antenna: the module's bare end with a meandered trace showing through the mask */}
      {rows.map((z) => (
        <Bx key={`h${z}`} at={[48.6, z]} sz={[4.2, tw]} y0={MOD.y1} h={0.02} color="#0d0e0f" rough={0.6} group="module" hot="antenna" edges={false} />
      ))}
      {rows.slice(0, -1).map((z, j) => (
        <Bx key={`v${z}`} at={[j % 2 === 0 ? 50.7 : 46.5, z + 1.025]} sz={[tw, 2.05 + tw]} y0={MOD.y1} h={0.02} color="#0d0e0f" rough={0.6} group="module" hot="antenna" edges={false} />
      ))}
      {/* under the can: ESP32 chip, flash chip, crystal */}
      <Bx at={[33.0, 14.0]} sz={[6, 6]} y0={MOD.y1} h={0.9} color="#1e1f21" rough={0.4} group="module" name="esp32-package" />
      <Bx at={[40.6, 10.2]} sz={[5, 4]} y0={MOD.y1} h={0.8} color="#1e1f21" rough={0.4} group="module" name="flash" />
      <Bx at={[40.6, 17.8]} sz={[3.2, 2.5]} y0={MOD.y1} h={0.8} color={COL.silver} metal={0.4} rough={0.3} group="module" name="crystal" />
      {/* the WROOM-32 metal can (lifts off in the layered view) */}
      <group ref={can}>
        <mesh position={[0, mm(MOD.y1), 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <extrudeGeometry args={[canShape, { depth: mm(CAN.h), bevelEnabled: false, curveSegments: 6 }]} />
          <Mat color="#55585b" metal={0.6} rough={0.45} group="can" hot="module" />
          {selected === 'module' && <Edges color={c.hotspot} threshold={25} />}
        </mesh>
        <Decal at={[(CAN.x0 + CAN.x1) / 2, (CAN.z0 + CAN.z1) / 2]} sz={[CAN.x1 - CAN.x0 - 0.6, CAN.z1 - CAN.z0 - 0.6]} y={MOD.y1 + CAN.h} map={canTex} hot="module" group="can" />
      </group>
    </group>
  );
}

function Silkscreen() {
  const tex = useCanvasTexture(Math.round(BOARD_W * PX), Math.round(BOARD_H * PX), drawSilk);
  return (
    <>
      <Decal at={[BOARD_W / 2, BOARD_H / 2]} sz={[BOARD_W, BOARD_H]} y={0} map={tex} />
    </>
  );
}

interface BoardModelProps {
  c: TokenColors;
  selected?: HotspotId;
  fade?: MutableRefObject<Fade>;
  children?: ReactNode;
}

/** The user's ESP32 DevKit (30-pin, USB-C, CH340C, WROOM-32). Shared by Board3D and ChipLayers3D. */
export function BoardModel({ c, selected, fade, children }: BoardModelProps) {
  const own = useRef<Fade>(FADE_FULL);
  const f = fade ?? own;
  return (
    <BoardCtx.Provider value={{ c, selected, fade: f }}>
      <group>
        <Pcb />
        <Silkscreen />
        <MountingHoles />
        <Headers />
        <UsbC />
        <Button z={6.4} />
        <Button z={21.8} />
        <Passives />
        <LeftParts />
        <Leds />
        <Module />
        {children}
      </group>
    </BoardCtx.Provider>
  );
}

export default BoardModel;
