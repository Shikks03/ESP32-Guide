import type { ReactNode } from 'react';
import { Box, Cyl, Disc, Flat, G, Glow, Shadow, Slab, Stroke, Tube, WallY, Waves, arc, bez, line, pt, ring, type V3 } from './iso';
import { Board, Bulb, Led, PcbTile, Phone, Radar, Router, Tact, ZoneFloor } from './pieces';

/* One drawing per lab, bench part, board part, track and chip-block family. */

const sine: V3[] = Array.from({ length: 17 }, (_, i) => [-8 + i, 3.2 * Math.sin((i / 16) * Math.PI * 2), 3.05] as V3);
const BOLT = 'M35 5L25 19h6l-3 10 11-15h-6z';
const PLAY_PAD = 'M21 16h22a7 7 0 0 1 7 7v18a7 7 0 0 1-7 7H21a7 7 0 0 1-7-7V23a7 7 0 0 1 7-7z';

export const LESSON_ART: Record<string, ReactNode> = {
  /* Intro */
  '00': (
    <>
      <Shadow rx={14} y={44} />
      <Tube d={bez([0, -4, 3.5], [0, -11, 3.5], [5, -17, 7], [12, -24, 12])} hue="sky" w={3.4} />
      <Box at={[-3.6, -4, 1.5]} size={[7.2, 9, 4.2]} hue="sky" />
      <Box at={[-2.6, 5, 2.4]} size={[5.2, 4.2, 2.3]} hue="metal" />
      <WallY at={[-1.7, 9.2, 3]} size={[3.4, 1.1]} hue="plastic" t="deep" ink={false} />
    </>
  ),
  '01': (
    <>
      <Shadow />
      <Board led />
    </>
  ),
  '02': (
    <>
      <Shadow rx={15} y={46} />
      <Box at={[-9, -7, 0]} size={[18, 14, 1.6]} hue="edge" />
      <Cyl at={[0, 0, 1.6]} r={1.8} h={0.6} hue="gold" />
      <Glow at={[0, 0, 20]} r={12} hue="yellow" />
      <Tube d={bez([0, 0, 2.2], [-5, 3, 9], [5, -3, 12], [0, 0, 19])} hue="orange" w={2.4} />
      <Cyl at={[0, 0, 19]} r={1.2} h={2.2} hue="metal" />
      <Waves at={[0, 0, 21]} hue="yellow" a0={15} a1={75} radii={[5.5, 9]} />
      <Waves at={[0, 0, 21]} hue="yellow" a0={105} a1={165} radii={[5.5, 9]} />
    </>
  ),

  /* Wi-Fi & web server */
  w1: (
    <>
      <Shadow rx={17} y={45} />
      <Router />
      <Waves at={[6, -4, 18]} hue="blue" radii={[5, 9, 13]} a0={25} a1={85} />
    </>
  ),
  w2: (
    <>
      <Shadow rx={18} />
      <Phone>
        <Flat at={[-4.5, -7, 1.6]} size={[9, 5.5]} hue="green" t="lit" />
        <Cyl at={[1.6, -4.25, 1.6]} r={2} h={1} hue="white" />
        <Flat at={[-4.5, 1.5, 1.6]} size={[9, 1.5]} hue="silk" ink={false} />
        <Flat at={[-4.5, 4.5, 1.6]} size={[6, 1.5]} hue="steel" ink={false} />
      </Phone>
    </>
  ),
  w3: (
    <>
      <Shadow rx={18} />
      <Box at={[-12, -7, 0]} size={[24, 14, 1.6]} hue="white" />
      <Disc at={[-8, 0, 1.6]} r={2.4} hue="blue" t="mid" />
      <Flat at={[-3.5, -3.4, 1.6]} size={[12, 1.8]} hue="plastic" ink={false} />
      <Flat at={[-3.5, 0.6, 1.6]} size={[8, 1.6]} hue="steel" ink={false} />
      <Tube d="M43.5 23.5L50 31" hue="copper" w={2.6} t="mid" />
      <circle cx={38} cy={17} r={8.2} className="iso-ink" style={{ fill: 'color-mix(in oklab, var(--part-sky) 38%, transparent)' }} />
      <Stroke d={arc(38, 17, 8.2, 0, 359.9)} hue="steel" w={2.2} t="lit" />
      <Stroke d={arc(38, 17, 5, 110, 165)} hue="white" t="lit" w={1.4} />
    </>
  ),
  w4: (
    <>
      <Shadow y={52} />
      <G dy={5}>
        <Board />
      </G>
      <Waves at={[9, -14, 14]} hue="blue" radii={[4, 8]} a0={20} a1={80} />
      <Slab d={BOLT} hue="yellow" depth={2} t="lit" />
    </>
  ),

  /* Serial & radar */
  s1: (
    <>
      <Shadow rx={14} y={44} />
      <Box at={[-9, -3, 0]} size={[18, 6, 4]} hue="plastic" />
      {[-6, -2, 2, 6].map((x) => <Cyl key={x} at={[x, 0, 4]} r={1} h={2.4} hue="gold" />)}
      <Tube d={bez([-6, 0, 6], [-6, 0, 25], [6, 0, 25], [6, 0, 6])} hue="green" w={2.6} />
    </>
  ),
  s2: (
    <>
      <Shadow y={51} />
      <G dy={5}>
        <Radar />
      </G>
      <Box at={[-10, -2, 6]} size={[3.6, 3.6, 3.6]} hue="sky" />
      <Box at={[-3.5, -2, 11]} size={[3.6, 3.6, 3.6]} hue="yellow" />
      <Box at={[3, -2, 16]} size={[3.6, 3.6, 3.6]} hue="pink" />
    </>
  ),
  s3: (
    <>
      <Shadow y={46} />
      <Box at={[-12.5, -4, 0]} size={[25, 8, 1.4]} hue="plastic" />
      <Box at={[-11.5, -2.5, 1.4]} size={[5, 5, 4]} hue="steel" />
      <Box at={[-5.5, -2.5, 1.4]} size={[5, 5, 4]} hue="sky" />
      <Box at={[0.5, -2.5, 1.4]} size={[5, 5, 4]} hue="yellow" />
      <Box at={[6.5, -2.5, 1.4]} size={[5, 5, 4]} hue="pink" />
      <Stroke d={arc(32, 15, 6.5, 0, 359.9)} hue="teal" w={1.8} />
      <Stroke d="M32 5.5v4M32 20.5v4M22.5 15h4M37.5 15h4" hue="teal" w={1.8} />
      <circle cx={32} cy={15} r={2.2} className="iso-ink" style={{ fill: 'var(--part-pink)' }} />
    </>
  ),
  s4: (
    <>
      <Shadow y={50} />
      <Box at={[-12, -12, 0]} size={[24, 24, 1.6]} hue="glass" />
      <Stroke d={ring([0, 0, 1.6], 4.5)} hue="screen" w={1.1} t="shade" />
      <Stroke d={ring([0, 0, 1.6], 9)} hue="screen" w={1.1} t="shade" />
      <Stroke d={line([-10, 0, 1.6], [10, 0, 1.6])} hue="screen" w={0.8} t="deep" />
      <Stroke d={line([0, -10, 1.6], [0, 10, 1.6])} hue="screen" w={0.8} t="deep" />
      <Stroke d={bez([-7, 7, 1.6], [-3, 6, 1.6], [0, 1, 1.6], [5, -4, 1.6])} hue="pink" w={1.5} dash="0.1 2.6" />
      <Glow at={[5, -4, 2.6]} r={7} hue="pink" />
      <Cyl at={[5, -4, 1.6]} r={1.8} h={1.4} hue="pink" />
    </>
  ),

  /* Smart bulb */
  l1: (
    <>
      <Shadow rx={11} y={46} />
      <G dy={7}>
        <Bulb />
      </G>
    </>
  ),
  l2: (
    <>
      <Shadow y={49} />
      <G dx={8} dy={3} k={0.82}>
        <Bulb />
      </G>
      <G dx={-9} dy={8} k={0.62}>
        <Board />
      </G>
      <Waves at={[-13, 4, 9]} hue="blue" radii={[4, 7.5]} a0={15} a1={75} />
    </>
  ),
  l3: (
    <>
      <Shadow rx={19} y={47} />
      <G dx={4} dy={2} k={0.84}>
        <Bulb hue="pink" />
      </G>
      <Cyl at={[-12, 6, 0]} r={3.4} h={1.6} hue="red" />
      <Cyl at={[-5, 12, 0]} r={3.4} h={1.6} hue="green" />
      <Cyl at={[4, 14, 0]} r={3.4} h={1.6} hue="blue" />
    </>
  ),

  /* Zones */
  z1: (
    <>
      <Shadow rx={21} y={50} />
      <ZoneFloor />
      <Tube d={line([3, 7, 3.4], [10, 4, 17])} hue="yellow" w={3} />
      <Tube d={line([2.2, 7.3, 1.9], [3, 7, 3.4])} hue="plastic" w={1} t="mid" />
    </>
  ),
  z2: (
    <>
      <Shadow rx={21} y={54} />
      <G dy={4}>
        <ZoneFloor />
        <Glow at={[-6, 6, 4]} r={9} hue="orange" />
        <Cyl at={[-6, 6, 1.4]} r={2} h={4} hue="pink" />
        <Disc at={[-6, 6, 7.6]} r={1.7} hue="pink" />
      </G>
      <G dx={10} dy={-13} k={0.56}>
        <Bulb />
      </G>
    </>
  ),
  z3: (
    <>
      <Shadow rx={21} y={54} />
      <G dy={4}>
        <ZoneFloor muted />
      </G>
      <G dx={10} dy={-13} k={0.56}>
        <Bulb hue="metal" lit={false} />
      </G>
      <path d="M19 6a7.5 7.5 0 1 0 8.5 9.6A6 6 0 0 1 19 6z" className="iso-ink" style={{ fill: 'var(--part-yellow)' }} />
    </>
  ),
  z4: (
    <>
      <Shadow rx={18} y={51} />
      <Slab d={PLAY_PAD} hue="orange" depth={4} />
      <path d="M27 24l13 8-13 8z" className="iso-ink" style={{ fill: 'var(--card-white)' }} />
    </>
  ),
};

/** Shown for a lab that has no drawing yet. */
export const FALLBACK_ART: ReactNode = (
  <>
    <Shadow />
    <Board />
  </>
);

export const PART_ART: Record<string, ReactNode> = {
  board: (
    <>
      <Shadow />
      <Board />
    </>
  ),
  jumpers: (
    <>
      <Shadow />
      {([[-5, 'red'], [0, 'yellow'], [5, 'sky']] as const).map(([y, hue]) => (
        <g key={y}>
          <Box at={[-13, y - 1.2, 0]} size={[3.4, 2.4, 2.4]} hue="plastic" />
          <Tube d={bez([-10, y, 1.4], [-4, y, 15], [4, y, 15], [10, y, 1.4])} hue={hue} w={2.4} />
          <Box at={[9.6, y - 1.2, 0]} size={[3.4, 2.4, 2.4]} hue="plastic" />
        </g>
      ))}
    </>
  ),
  wifi: LESSON_ART.w1,
  ld2450: (
    <>
      <Shadow y={46} />
      <Radar />
      <Waves at={[0, -6, 6]} hue="teal" radii={[5, 9]} a0={50} a1={130} />
    </>
  ),
  shelly: LESSON_ART.l1,
  phone: (
    <>
      <Shadow rx={18} />
      <Phone>
        <Flat at={[-4.5, -8, 1.6]} size={[4, 4]} hue="sky" t="lit" />
        <Flat at={[0.5, -8, 1.6]} size={[4, 4]} hue="yellow" t="lit" />
        <Flat at={[-4.5, -2.5, 1.6]} size={[4, 4]} hue="pink" t="lit" />
        <Flat at={[0.5, -2.5, 1.6]} size={[4, 4]} hue="green" t="lit" />
        <Flat at={[-4.5, 4, 1.6]} size={[9, 1.5]} hue="steel" ink={false} />
      </Phone>
    </>
  ),
  breadboard: (
    <>
      <Shadow rx={21} y={49} />
      <Box at={[-13, -8.5, 0]} size={[26, 17, 3]} hue="white" />
      <Stroke d={line([-12, -7.3, 3], [12, -7.3, 3])} hue="red" w={0.9} />
      <Stroke d={line([-12, 7.3, 3], [12, 7.3, 3])} hue="blue" w={0.9} />
      <Stroke d={line([-12, 0, 3], [12, 0, 3])} hue="steel" w={1.2} />
      {[-5, -3, 3, 5].map((y) => <Stroke key={y} d={line([-11, y, 3], [11, y, 3])} hue="plastic" w={1.1} dash="0.1 2.5" />)}
    </>
  ),
  led: (
    <>
      <Shadow rx={9} y={42} />
      <G dy={4}>
        <Led />
      </G>
    </>
  ),
  button: (
    <>
      <Shadow rx={15} y={45} />
      <Box at={[-7, -7, 0]} size={[14, 14, 4.5]} hue="plastic" />
      <Flat at={[-5.8, -5.8, 4.5]} size={[11.6, 11.6]} hue="metal" />
      <Cyl at={[0, 0, 4.5]} r={4} h={3.2} hue="red" />
    </>
  ),
};

export const HOTSPOT_ART: Record<string, ReactNode> = {
  usb: (
    <>
      <Shadow y={48} />
      <PcbTile />
      <Box at={[2, -7.5, 1.5]} size={[7, 5, 1.6]} hue="plastic" />
      <Box at={[-6, -2, 1.5]} size={[11, 9, 4.2]} hue="metal" />
      <WallY at={[-4.4, 7, 2.5]} size={[7.8, 2.2]} hue="plastic" t="deep" />
    </>
  ),
  buttons: (
    <>
      <Shadow y={48} />
      <PcbTile />
      <Tact at={[-4, -3, 1.5]} />
      <Tact at={[5, 3, 1.5]} />
    </>
  ),
  leds: (
    <>
      <Shadow y={48} />
      <PcbTile />
      <Box at={[3, -6, 1.5]} size={[3.4, 2.6, 1.4]} hue="red" />
      <Glow at={[-2, 2, 3]} r={12} hue="blue" />
      <Box at={[-4.2, 0, 1.5]} size={[4.4, 3.4, 1.6]} hue="blue" top="sky" />
    </>
  ),
  module: (
    <>
      <Shadow y={48} />
      <PcbTile />
      <Box at={[-8, -7, 1.5]} size={[16, 14, 2.6]} hue="metal" />
      <Flat at={[-5.5, -4.5, 4.1]} size={[8, 1.3]} hue="steel" ink={false} />
      <Flat at={[-5.5, -2, 4.1]} size={[5, 1.3]} hue="steel" ink={false} />
    </>
  ),
  antenna: (
    <>
      <Shadow y={48} />
      <PcbTile />
      <Stroke
        d={line([-8, -6, 1.5], [-8, 6, 1.5], [-4, 6, 1.5], [-4, -6, 1.5], [0, -6, 1.5], [0, 6, 1.5], [4, 6, 1.5], [4, -6, 1.5], [8, -6, 1.5], [8, 6, 1.5])}
        hue="gold" w={1.7} t="lit"
      />
      <Waves at={[3, -8, 8]} hue="teal" radii={[5, 9]} a0={20} a1={80} />
    </>
  ),
  headers: (
    <>
      <Shadow rx={15} y={41} />
      {[-10, -6, -2, 2, 6, 10].map((x) => <Tube key={`d${x}`} d={line([x, 0, 4], [x, 0, -3])} hue="gold" w={1.1} t="mid" />)}
      <Box at={[-12.5, -2.2, 3]} size={[25, 4.4, 3.6]} hue="plastic" />
      {[-10, -6, -2, 2, 6, 10].map((x) => <Tube key={`u${x}`} d={line([x, 0, 6.6], [x, 0, 13])} hue="gold" w={1.1} t="mid" />)}
    </>
  ),
};

export const TRACK_ART: Record<string, ReactNode> = {
  intro: PART_ART.board,
  wifi: LESSON_ART.w1,
  radar: PART_ART.ld2450,
  bulb: LESSON_ART.l1,
  zones: (
    <>
      <Shadow rx={21} y={50} />
      <ZoneFloor />
    </>
  ),
};

const [lockX, lockY] = pt([0, 4, 5]);

export const FAMILY_ART: Record<string, ReactNode> = {
  system: (
    <>
      <Shadow y={46} />
      <Box at={[-8, -8, 0.6]} size={[16, 16, 3]} hue="plastic" />
      {[-6, -2.4, 1.2, 4.8].map((x) => <Box key={`y${x}`} at={[x, 8, 0]} size={[1.6, 2, 0.9]} hue="gold" />)}
      {[-6, -2.4, 1.2, 4.8].map((y) => <Box key={`x${y}`} at={[8, y, 0]} size={[2, 1.6, 0.9]} hue="gold" />)}
      <Flat at={[-4.5, -4.5, 3.6]} size={[9, 9]} hue="copper" t="lit" />
    </>
  ),
  memory: (
    <>
      <Shadow y={46} />
      {[0, 4, 8].map((z) => <Box key={z} at={[-9, -7, z]} size={[18, 14, 2.6]} hue="purple" />)}
    </>
  ),
  security: (
    <>
      <Shadow rx={14} y={44} />
      <Tube d="M27 27v-7a5 5 0 0 1 10 0v7" hue="steel" w={2.8} />
      <Box at={[-7.5, -4, 0]} size={[15, 8, 10.5]} hue="red" />
      <circle cx={lockX} cy={lockY - 0.6} r={1.7} style={{ fill: 'var(--model-ink)' }} />
      <path d={`M${lockX} ${lockY}v3.6`} className="iso-casing" style={{ strokeWidth: 1.6 }} />
    </>
  ),
  connectivity: (
    <>
      <Shadow y={46} />
      <Box at={[-13, -4, 0]} size={[8, 8, 6]} hue="link" />
      <Tube d={bez([-5, 0, 3], [-1, 0, 9], [1, 0, 9], [5, 0, 3])} hue="sky" w={2.6} />
      <Box at={[5, -4, 0]} size={[8, 8, 6]} hue="link" />
    </>
  ),
  timing: (
    <>
      <Shadow rx={15} y={44} />
      <Cyl at={[0, 0, 0]} r={10} h={3.4} hue="orange" />
      <Disc at={[0, 0, 3.4]} r={7.8} hue="white" />
      <Stroke d={line([0, 0, 3.4], [0, -5.5, 3.4])} hue="plastic" w={1.6} />
      <Stroke d={line([0, 0, 3.4], [3.8, 0, 3.4])} hue="plastic" w={1.6} />
    </>
  ),
  analog: (
    <>
      <Shadow />
      <Box at={[-11, -8, 0]} size={[22, 16, 3]} hue="teal" />
      <Flat at={[-9.5, -6.5, 3]} size={[19, 13]} hue="glass" />
      <Stroke d={line(...sine)} hue="screen" w={1.6} t="lit" />
    </>
  ),
  radio: (
    <>
      <Shadow rx={10} y={41} />
      <Cyl at={[0, 0, 0]} r={5.5} h={2} hue="steel" />
      <Tube d={line([0, 0, 2], [0, 0, 20])} hue="metal" w={1.8} />
      <Cyl at={[0, 0, 20]} r={1.5} h={1.8} hue="red" />
      <Waves at={[0, 0, 21]} hue="radio" radii={[6, 10.5]} a0={-30} a1={30} />
      <Waves at={[0, 0, 21]} hue="radio" radii={[6, 10.5]} a0={150} a1={210} />
    </>
  ),
};
