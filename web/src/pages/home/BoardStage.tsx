import { lazy, Suspense, useRef, useState } from 'react';
import { useNear } from '../../lib/useNear';
import { BoardSvg } from '../../components/BoardSvg';
import type { HotspotId } from '../../content/types';
import { HOTSPOTS } from '../../content/bench';
import { WebGLGate, hasWebGL } from '../../components/three/WebGLGate';
import '../../components/three/three.css';

const Board3D = lazy(() => import('../../components/three/Board3D'));

/** Hotspot centres in BoardSvg viewBox coordinates (0 0 460 300). */
const POS: Record<HotspotId, [number, number]> = {
  usb: [48, 146],
  buttons: [71, 100],
  leds: [221, 162],
  module: [325, 157],
  antenna: [426, 174],
  headers: [273, 69],
};

interface Props {
  selected: HotspotId | null;
  onSelect: (id: HotspotId) => void;
}

/**
 * The centre of "Meet the board": a react-three-fiber board (lazy chunk) with the flat SVG drawing
 * as the fallback (no WebGL, still loading) and as a toggle that is always reachable.
 */
export function BoardStage(props: Props) {
  const [flat, setFlat] = useState(false);
  const canToggle = hasWebGL();
  const stageRef = useRef<HTMLDivElement>(null);
  const near = useNear(stageRef);
  return (
    <div className="home-stage" ref={stageRef}>
      {flat || !near ? (
        <BoardStageFallback {...props} bare />
      ) : (
        <WebGLGate fallback={<BoardStageFallback {...props} bare />}>
          <Suspense
            fallback={
              <>
                <BoardStageFallback {...props} bare />
                <p className="b3d-loading" role="status">Loading the 3D view…</p>
              </>
            }
          >
            <Board3D selected={props.selected ?? undefined} onSelect={props.onSelect} />
          </Suspense>
        </WebGLGate>
      )}
      {canToggle && (
        <div className="b3d-flat">
          <button type="button" aria-pressed={flat} onClick={() => setFlat((v) => !v)}>
            {flat ? 'Show the 3D view' : 'Show the flat drawing'}
          </button>
        </div>
      )}
    </div>
  );
}

export function BoardStageFallback({ selected, onSelect, bare }: Props & { bare?: boolean }) {
  const inner = (
    <>
      <BoardSvg pins={[]} legend="lesson" highlightHotspot={selected ?? undefined} title="ESP32 DevKit, top view" />
      <div className="home-stage-hot">
        {HOTSPOTS.map((h) => (
          <button
            key={h.id}
            type="button"
            className="home-hot"
            data-on={selected === h.id}
            aria-label={h.name}
            aria-pressed={selected === h.id}
            style={{ left: `${(POS[h.id][0] / 460) * 100}%`, top: `${(POS[h.id][1] / 300) * 100}%` }}
            onClick={() => onSelect(h.id)}
          >
            {h.n}
          </button>
        ))}
      </div>
    </>
  );
  return bare ? <div className="b3d-flatwrap">{inner}</div> : <div className="home-stage">{inner}</div>;
}
