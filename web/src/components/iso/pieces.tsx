import type { ReactNode } from 'react';
import { Box, Cyl, Dome, Face, Flat, Glow, Stroke, Tube, WallY, arc, line, pt, type Hue } from './iso';

/* Shared solids the icons are assembled from. */

const PADS = [-11, -8, -5, -2, 1, 4, 7, 10];

/** The 30-pin DevKit: dark PCB, USB socket, USB chip, WROOM can, gold pin pads. */
export function Board({ led = false }: { led?: boolean }) {
  return (
    <>
      <Box at={[-13, -6, 0]} size={[26, 12, 1.6]} hue="edge" />
      {PADS.map((x) => <Flat key={`b${x}`} at={[x, -5.6, 1.6]} size={[1.3, 1.3]} hue="gold" t="lit" ink={false} />)}
      <Box at={[-14.5, -2.5, 1.6]} size={[4.5, 5, 2.2]} hue="metal" />
      <Box at={[-7.5, -1.5, 1.6]} size={[3, 3.4, 0.9]} hue="plastic" />
      <Flat at={[10.6, -4.2, 1.6]} size={[1.6, 8.4]} hue="gold" ink={false} />
      <Box at={[1, -4.4, 1.6]} size={[9, 8.8, 2]} hue="metal" />
      {PADS.map((x) => <Flat key={`f${x}`} at={[x, 4.3, 1.6]} size={[1.3, 1.3]} hue="gold" t="lit" ink={false} />)}
      {led && (
        <>
          <Glow at={[-3, 2, 2.4]} r={9} hue="blue" />
          <Box at={[-3.8, 1.2, 1.6]} size={[1.8, 1.8, 0.9]} hue="blue" />
        </>
      )}
    </>
  );
}

/** A bare piece of the PCB to stand board parts on. */
export function PcbTile() {
  return <Box at={[-11, -9, 0]} size={[22, 18, 1.5]} hue="edge" />;
}

/** A light bulb standing on its screw base. `lit` adds the glow. */
export function Bulb({ hue = 'yellow', lit = true }: { hue?: Hue; lit?: boolean }) {
  const [x, y] = pt([0, 0, 7]);
  const cy = y - 12;
  const globe = `M${x - 4.2} ${y}C${x - 4.2} ${y - 4} ${x - 11} ${cy + 6} ${x - 11} ${cy}A11 11 0 1 1 ${x + 11} ${cy}C${x + 11} ${cy + 6} ${x + 4.2} ${y - 4} ${x + 4.2} ${y}Z`;
  return (
    <>
      {lit && <Glow at={[0, 0, 19]} r={18} hue={hue} />}
      <Cyl at={[0, 0, -1.4]} r={1.8} h={1.4} hue="steel" />
      <Cyl at={[0, 0, 0]} r={3.5} h={7} hue="metal" />
      <Stroke d={arc(x, y - 2.2, 4.4, 200, 340)} hue="steel" w={0.9} />
      <Stroke d={arc(x, y - 4.6, 4.4, 200, 340)} hue="steel" w={0.9} />
      <Face d={globe} hue={hue} t={lit ? 'lit' : 'mid'} />
      <Stroke d={arc(x, cy, 7.4, 105, 165)} hue="white" t="lit" w={1.7} />
    </>
  );
}

/** A home router: white box, status lights, one antenna. */
export function Router() {
  return (
    <>
      <Box at={[-9, -6, 0]} size={[18, 12, 5]} hue="white" />
      <WallY at={[-7, 6, 1.8]} size={[2, 1.4]} hue="green" ink={false} />
      <WallY at={[-3.6, 6, 1.8]} size={[2, 1.4]} hue="green" ink={false} />
      <WallY at={[-0.2, 6, 1.8]} size={[2, 1.4]} hue="orange" ink={false} />
      <Tube d={line([6, -4, 5], [6, -4, 17])} hue="plastic" w={1.6} />
    </>
  );
}

/** A phone lying flat; children are drawn on its screen (z = 1.6). */
export function Phone({ children }: { children?: ReactNode }) {
  return (
    <>
      <Box at={[-7, -11, 0]} size={[14, 22, 1.6]} hue="plastic" />
      <Flat at={[-6, -10, 1.6]} size={[12, 20]} hue="glass" />
      {children}
    </>
  );
}

const PATCH_X = [-9.5, -5.5, -1.5, 2.5];

/** The HLK-LD2450 radar board: patch antennas and a white connector. */
export function Radar() {
  return (
    <>
      <Box at={[-12, -5, 0]} size={[24, 10, 1.6]} hue="teal" />
      {PATCH_X.map((x) => <Flat key={`a${x}`} at={[x, -3.4, 1.6]} size={[2.6, 2.6]} hue="gold" t="lit" />)}
      {PATCH_X.map((x) => <Flat key={`b${x}`} at={[x, 0.8, 1.6]} size={[2.6, 2.6]} hue="gold" t="lit" />)}
      <Box at={[7.6, -3, 1.6]} size={[3, 6, 2.2]} hue="white" />
    </>
  );
}

/** A through-hole LED on two legs. */
export function Led({ hue = 'red' }: { hue?: Hue }) {
  return (
    <>
      <Tube d={line([-1.4, 0, 0], [-1.4, 0, 7])} hue="metal" w={1} />
      <Tube d={line([1.4, 0, -1.5], [1.4, 0, 7])} hue="metal" w={1} />
      <Glow at={[0, 0, 13]} r={11} hue={hue} />
      <Cyl at={[0, 0, 6]} r={4.3} h={1.2} hue={hue} />
      <Cyl at={[0, 0, 7.2]} r={3.6} h={4.5} hue={hue} />
      <Dome at={[0, 0, 11.7]} r={3.6} hue={hue} t="lit" />
    </>
  );
}

/** A tactile push button. */
export function Tact({ at: [x, y, z], cap = 'plastic' }: { at: [number, number, number]; cap?: Hue }) {
  return (
    <>
      <Box at={[x - 3, y - 3, z]} size={[6, 6, 2]} hue="metal" />
      <Cyl at={[x, y, z + 2]} r={1.7} h={1.4} hue={cap} />
    </>
  );
}

/** A room floor split into three coloured zones. */
export function ZoneFloor({ muted = false }: { muted?: boolean }) {
  const a: Hue = muted ? 'metal' : 'teal';
  const b: Hue = muted ? 'metal' : 'orange';
  const c: Hue = muted ? 'metal' : 'purple';
  return (
    <>
      <Box at={[-12, -12, 0]} size={[24, 24, 1.4]} hue="white" />
      <Flat at={[-11, -11, 1.4]} size={[10, 10]} hue={a} t="lit" />
      <Flat at={[1, -11, 1.4]} size={[10, 22]} hue={c} t={muted ? 'mid' : 'lit'} />
      <Flat at={[-11, 1, 1.4]} size={[10, 10]} hue={b} t="lit" />
    </>
  );
}
