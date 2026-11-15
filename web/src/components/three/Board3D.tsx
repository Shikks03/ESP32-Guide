import { useCallback, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useCalm } from '../../state/settings';
import { HOTSPOTS } from '../../content/bench';
import type { HotspotId } from '../../content/types';
import { BoardModel, HOTSPOT_MM, mx, mz, U } from './BoardModel';
import { fitView, ViewRig, ViewToolbar, type ViewApi } from './ViewRig';
import { useTokenColors } from './useTokenColors';
import './three.css';

export const BOARD_LABEL =
  '3D model of your ESP32 DevKit: the WROOM-32 module with its antenna, a USB-C port, the CH340C USB-serial chip, EN and BOOT buttons, a red power LED, a blue LED on GPIO 2 and two rows of 15 header pins. Drag to turn it.';

interface Props {
  selected?: HotspotId | null;
  onSelect: (id: HotspotId) => void;
}

const home = (aspect: number) => fitView(aspect);

export default function Board3D({ selected, onSelect }: Props) {
  const calm = useCalm();
  const colors = useTokenColors();
  const api = useRef<ViewApi | null>(null);
  const [touched, setTouched] = useState(false);
  const sel = selected ?? undefined;
  const auto = !calm && !touched && !sel;
  const markTouched = useCallback(() => setTouched(true), []);

  return (
    <div className="b3d">
      <div className="b3d-view" role="region" aria-label={BOARD_LABEL}>
        <Canvas
          dpr={[1, 2]}
          frameloop={auto ? 'always' : 'demand'}
          camera={{ fov: 40, near: 0.1, far: 100, position: [0, 8, 10] }}
          flat
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[4, 9, 6]} intensity={2.4} />
          <directionalLight position={[-6, 4, -5]} intensity={0.8} />
          <directionalLight position={[2, -8, 3]} intensity={0.7} />
          <BoardModel c={colors} selected={sel} />
          {HOTSPOTS.map((h) => {
            const [x, z, hmm] = HOTSPOT_MM[h.id];
            return (
              <Html key={h.id} position={[mx(x), hmm * U, mz(z)]} center zIndexRange={[5, 0]}>
                <button
                  type="button"
                  className="b3d-hot"
                  data-on={sel === h.id}
                  aria-label={h.name}
                  aria-pressed={sel === h.id}
                  onClick={() => onSelect(h.id)}
                >
                  {h.n}
                </button>
              </Html>
            );
          })}
          {/* the board can be turned right over to see the header pins underneath */}
          <ViewRig apiRef={api} home={home} calm={calm} onStart={markTouched} polarMax={2.75} />
          <AutoSpin on={auto} />
        </Canvas>
        <p className="b3d-hint">drag to turn · pinch to zoom</p>
      </div>
      <ViewToolbar apiRef={api} />
    </div>
  );
}

/** Slow idle turn until the visitor touches the board (never under Calm: `on` is false then). */
function AutoSpin({ on }: { on: boolean }) {
  const camera = useThree((s) => s.camera);
  useFrame((_, dt) => {
    if (!on) return;
    const a = dt * 0.12;
    const { x, z } = camera.position;
    camera.position.x = x * Math.cos(a) + z * Math.sin(a);
    camera.position.z = -x * Math.sin(a) + z * Math.cos(a);
    camera.lookAt(0, 0, 0);
  });
  return null;
}
