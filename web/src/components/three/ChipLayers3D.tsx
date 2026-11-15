import { useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, Html } from '@react-three/drei';
import { Mesh } from 'three';
import { useCalm } from '../../state/settings';
import type { BlockFamily, LabStatus } from '../../content/types';
import { BoardModel, MODULE_CENTER, Mat, type Fade } from './BoardModel';
import { fitView, ViewRig, ViewToolbar, type ViewApi, type ViewSpec } from './ViewRig';
import { useTokenColors } from './useTokenColors';
import './three.css';

export interface LayerBlock {
  id: string;
  name: string;
  family: BlockFamily;
  state: LabStatus | 'none';
}

interface Props {
  /** 0 = board, 1 = module (can lifted), 2 = chip (die tiles) */
  layer: 0 | 1 | 2;
  blocks: LayerBlock[];
  selected?: string;
  onSelect?: (id: string) => void;
}

const LABELS = [
  '3D model of the ESP32 DevKit board. Drag to turn it.',
  '3D model of the WROOM-32 module with its metal can lifted off, showing the chip, the flash chip and the crystal. Drag to turn it.',
  '3D model of the ESP32 chip drawn as tiles, one per block, grouped by family. Drag to turn it.',
];

const FAMILIES: BlockFamily[] = ['System', 'Memory', 'Security', 'Connectivity', 'Timing', 'Analog', 'Radio'];
const MODULE_XZ: [number, number] = MODULE_CENTER;
const DIE_Y = 1.2;
const COLS = 8;
const PITCH = 0.64;
const TILE = 0.5;
const HEIGHT: Record<LabStatus | 'none', number> = { done: 0.5, runs: 0.5, built: 0.32, planned: 0.16, none: 0.04 };

/** Target animation state per layer. */
const TARGET: Fade[] = [
  { board: 1, can: 1, canLift: 0, module: 1, die: 0 },
  { board: 0.3, can: 0.4, canLift: 1.4, module: 1, die: 0 },
  { board: 0.12, can: 0, canLift: 2.4, module: 0.25, die: 1 },
];

function layerView(layer: 0 | 1 | 2, aspect: number): ViewSpec {
  if (layer === 0) return fitView(aspect, [0, -0.3, 0], 10.8); // the header pins hang below the board
  if (layer === 1) return fitView(aspect, [MODULE_XZ[0], 0.4, MODULE_XZ[1]], 9.2, 0.8, -0.45);
  return fitView(aspect, [MODULE_XZ[0], DIE_Y, MODULE_XZ[1]], 10.5, 1.0, -0.3);
}

/** Eases the shared fade state toward the current layer's target (~0.4 s; instant under Calm). */
function Fader({ layer, fade, calm }: { layer: 0 | 1 | 2; fade: MutableRefObject<Fade>; calm: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const mounted = useRef(false);
  const t = TARGET[layer];
  if (!mounted.current) {
    mounted.current = true;
    Object.assign(fade.current, t);
  }
  useFrame((_, dt) => {
    const f = fade.current;
    const k = calm ? 1 : 1 - Math.exp(-dt * 9);
    let moving = false;
    (Object.keys(t) as (keyof Fade)[]).forEach((key) => {
      const d = t[key] - f[key];
      if (Math.abs(d) < 0.003) f[key] = t[key];
      else {
        f[key] += d * k;
        moving = true;
      }
    });
    if (moving) invalidate();
  });
  // Kick a frame when the layer changes so a demand-driven canvas starts animating.
  useMemo(() => invalidate(), [layer, invalidate]);
  return null;
}

interface Placed extends LayerBlock {
  x: number;
  z: number;
}

function layout(blocks: LayerBlock[]) {
  const placed: Placed[] = [];
  const rows: { family: BlockFamily; z: number }[] = [];
  let row = 0;
  for (const fam of FAMILIES) {
    const list = blocks.filter((b) => b.family === fam);
    if (!list.length) continue;
    const lines = Math.ceil(list.length / COLS);
    rows.push({ family: fam, z: row * PITCH });
    list.forEach((b, i) => placed.push({ ...b, x: (i % COLS) * PITCH, z: (row + Math.floor(i / COLS)) * PITCH }));
    row += lines;
    // small gap between families
    row += 0.35;
  }
  const depth = Math.max(0, row - 0.35 - 1) * PITCH + TILE;
  const width = (COLS - 1) * PITCH + TILE;
  return { placed, rows, depth, width };
}

function DieTiles({ blocks, layer, selected, onSelect }: Pick<Props, 'blocks' | 'layer' | 'selected' | 'onSelect'>) {
  const c = useTokenColors();
  const { placed, rows, depth, width } = useMemo(() => layout(blocks), [blocks]);
  const live = layer === 2;
  const noRay = () => null;
  return (
    <group position={[MODULE_XZ[0], DIE_Y, MODULE_XZ[1]]}>
      {/* die plate */}
      <mesh position={[0, -0.05, 0]} raycast={noRay}>
        <boxGeometry args={[width + 0.7, 0.06, depth + 0.7]} />
        <Mat color={c.plastic} group="die" rough={0.5} />
      </mesh>
      <group position={[-width / 2 + TILE / 2, 0, -depth / 2 + TILE / 2]}>
        {placed.map((b) => {
          const h = HEIGHT[b.state];
          const on = selected === b.id;
          const none = b.state === 'none';
          return (
            <mesh
              key={b.id}
              position={[b.x, h / 2, b.z]}
              raycast={live ? Mesh.prototype.raycast : noRay}
              onClick={
                live
                  ? (e) => {
                      e.stopPropagation();
                      onSelect?.(b.id);
                    }
                  : undefined
              }
              onPointerOver={live ? () => (document.body.style.cursor = 'pointer') : undefined}
              onPointerOut={live ? () => (document.body.style.cursor = '') : undefined}
            >
              <boxGeometry args={[TILE, h, TILE]} />
              <Mat color={c[b.family]} group="die" op={none ? 0.45 : 1} emissive={c[b.family]} ei={on ? 0.6 : 0.12} rough={0.45} />
              {on && <Edges color={c.hotspot} threshold={20} />}
              {on && live && (
                <Html position={[0, h + 0.2, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
                  <span className="b3d-tag">{b.name}</span>
                </Html>
              )}
            </mesh>
          );
        })}
        {live &&
          rows.map((r) => (
            <Html key={r.family} position={[-0.55, 0.02, r.z]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
              <span className="b3d-fam">{r.family}</span>
            </Html>
          ))}
      </group>
    </group>
  );
}

export default function ChipLayers3D({ layer, blocks, selected, onSelect }: Props) {
  const calm = useCalm();
  const colors = useTokenColors();
  const api = useRef<ViewApi | null>(null);
  const fade = useRef<Fade>({ ...TARGET[layer] });
  const home = useCallback((aspect: number) => layerView(layer, aspect), [layer]);

  return (
    <div className="b3d">
      <div className="b3d-view b3d-view-tall" role="region" aria-label={LABELS[layer]}>
        <Canvas dpr={[1, 2]} frameloop="demand" camera={{ fov: 40, near: 0.1, far: 100, position: [0, 8, 10] }} flat>
          <ambientLight intensity={1.1} />
          <directionalLight position={[4, 9, 6]} intensity={2.4} />
          <directionalLight position={[-6, 4, -5]} intensity={0.8} />
          <BoardModel c={colors} fade={fade}>
            <DieTiles blocks={blocks} layer={layer} selected={selected} onSelect={onSelect} />
          </BoardModel>
          <Fader layer={layer} fade={fade} calm={calm} />
          <ViewRig apiRef={api} home={home} calm={calm} maxZoomOut={2} />
        </Canvas>
        <p className="b3d-hint">drag to turn · pinch to zoom</p>
      </div>
      <ViewToolbar apiRef={api} />
    </div>
  );
}
