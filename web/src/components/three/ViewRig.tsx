import { useEffect, useLayoutEffect, useRef, type ElementRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MathUtils, Spherical, Vector3 } from 'three';

export type Controls = ElementRef<typeof OrbitControls>;

export interface ViewSpec {
  target: [number, number, number];
  azimuth: number;
  polar: number;
  dist: number;
}

export interface ViewApi {
  turn(rad: number): void;
  zoom(factor: number): void;
  reset(): void;
}

export const POLAR_MIN = 0.12;
export const POLAR_MAX = 1.48;
const DUR = 0.4;

/** A 3/4 view whose distance fits a subject `width` units wide into the viewport. */
export function fitView(aspect: number, target: [number, number, number] = [0, 0, 0], width = 10.4, polar = 0.8, azimuth = -0.5): ViewSpec {
  const hfov = 2 * Math.atan(Math.tan(MathUtils.degToRad(40) / 2) * aspect);
  const dist = MathUtils.clamp(width / 2 / Math.tan(hfov / 2) + 1.0, 6, 20);
  return { target, azimuth, polar, dist };
}

interface Anim { from: ViewSpec; to: ViewSpec; t: number }

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

/**
 * Lives inside <Canvas>. Owns the OrbitControls and animated view changes (turn / zoom / reset / layer moves).
 * Under Calm everything jumps instantly and damping is off.
 */
export function ViewRig({
  apiRef,
  home,
  calm,
  onStart,
  maxZoomOut = 1.7,
  polarMax = POLAR_MAX,
}: {
  apiRef: MutableRefObject<ViewApi | null>;
  home: (aspect: number) => ViewSpec;
  calm: boolean;
  onStart?: () => void;
  maxZoomOut?: number;
  /** Lowest the camera may orbit (radians from straight down); above PI / 2 lets the visitor look underneath. */
  polarMax?: number;
}) {
  const controls = useRef<Controls>(null);
  const { camera, size, invalidate } = useThree();
  const anim = useRef<Anim | null>(null);
  const goal = useRef<ViewSpec | null>(null);
  const first = useRef(true);
  const sph = useRef(new Spherical());
  const tmp = useRef(new Vector3());

  const aspect = size.width / Math.max(1, size.height);
  const homeSpec = useRef(home);
  homeSpec.current = home;
  const aspectRef = useRef(aspect);
  aspectRef.current = aspect;

  const current = (): ViewSpec => {
    const t = controls.current?.target ?? new Vector3();
    tmp.current.copy(camera.position).sub(t);
    sph.current.setFromVector3(tmp.current);
    return { target: [t.x, t.y, t.z], azimuth: sph.current.theta, polar: sph.current.phi, dist: sph.current.radius };
  };

  const apply = (v: ViewSpec) => {
    const t = new Vector3(...v.target);
    sph.current.set(v.dist, v.polar, v.azimuth);
    camera.position.setFromSpherical(sph.current).add(t);
    controls.current?.target.copy(t);
    camera.lookAt(t);
    controls.current?.update();
    invalidate();
  };

  const clampView = (v: ViewSpec): ViewSpec => {
    const c = controls.current;
    return {
      ...v,
      polar: MathUtils.clamp(v.polar, POLAR_MIN, polarMax),
      dist: MathUtils.clamp(v.dist, c?.minDistance ?? 3, c?.maxDistance ?? 40),
    };
  };

  const go = (to: ViewSpec) => {
    const dest = clampView(to);
    goal.current = dest;
    if (calm) {
      anim.current = null;
      apply(dest);
      goal.current = null;
    } else {
      anim.current = { from: current(), to: dest, t: 0 };
      invalidate();
    }
  };

  useLayoutEffect(() => {
    const spec = homeSpec.current(aspectRef.current);
    if (first.current) {
      first.current = false;
      apply(clampView(spec));
      goal.current = null;
    } else {
      go(spec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home]);

  useEffect(() => {
    apiRef.current = {
      turn: (rad) => {
        const c = goal.current ?? current();
        go({ ...c, azimuth: c.azimuth + rad });
      },
      zoom: (f) => {
        const c = goal.current ?? current();
        go({ ...c, dist: c.dist * f });
      },
      reset: () => go(homeSpec.current(aspectRef.current)),
    };
    return () => {
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a) return;
    a.t += dt;
    const k = Math.min(1, a.t / DUR);
    const e = ease(k);
    let dAz = a.to.azimuth - a.from.azimuth;
    dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));
    apply({
      target: [0, 1, 2].map((i) => MathUtils.lerp(a.from.target[i], a.to.target[i], e)) as [number, number, number],
      azimuth: a.from.azimuth + dAz * e,
      polar: MathUtils.lerp(a.from.polar, a.to.polar, e),
      dist: MathUtils.lerp(a.from.dist, a.to.dist, e),
    });
    if (k >= 1) {
      anim.current = null;
      goal.current = null;
    }
  });

  const d0 = home(aspect).dist;
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping={!calm}
      dampingFactor={0.12}
      minPolarAngle={POLAR_MIN}
      maxPolarAngle={polarMax}
      minDistance={Math.max(3, d0 * 0.3)}
      maxDistance={d0 * maxZoomOut}
      rotateSpeed={0.8}
      onStart={() => {
        anim.current = null;
        goal.current = null;
        onStart?.();
      }}
    />
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** DOM toolbar under the canvas. */
export function ViewToolbar({ apiRef }: { apiRef: MutableRefObject<ViewApi | null> }) {
  const step = Math.PI / 6;
  return (
    <div className="b3d-bar" role="group" aria-label="Turn and zoom the 3D view">
      <button type="button" aria-label="Turn left" title="Turn left" onClick={() => apiRef.current?.turn(-step)}>
        <Icon d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
      </button>
      <button type="button" aria-label="Turn right" title="Turn right" onClick={() => apiRef.current?.turn(step)}>
        <Icon d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
      </button>
      <i aria-hidden="true" />
      <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => apiRef.current?.zoom(1.25)}>
        <Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8 11h6M21 21l-5-5" />
      </button>
      <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => apiRef.current?.zoom(0.8)}>
        <Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8 11h6M11 8v6M21 21l-5-5" />
      </button>
      <i aria-hidden="true" />
      <button type="button" aria-label="Back to the start view" title="Back to the start view" onClick={() => apiRef.current?.reset()}>
        <Icon d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v4M12 18v4M2 12h4M18 12h4" />
      </button>
    </div>
  );
}
