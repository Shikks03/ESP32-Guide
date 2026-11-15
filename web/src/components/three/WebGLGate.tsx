import { Component, type ReactNode } from 'react';
import './three.css';

let cached: boolean | undefined;

/** True when a WebGL context can be created (checked once). */
export function hasWebGL(): boolean {
  if (cached !== undefined) return cached;
  try {
    const c = document.createElement('canvas');
    cached = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    cached = false;
  }
  return cached;
}

function NoGL({ fallback }: { fallback: ReactNode }) {
  return (
    <div className="b3d-nogl">
      <p className="b3d-nogl-msg" role="note">The 3D view couldn't start in this browser (it needs WebGL).</p>
      {fallback}
    </div>
  );
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <NoGL fallback={this.props.fallback} /> : this.props.children;
  }
}

/** Renders children only if WebGL works; otherwise (or if the 3D scene throws) the message and the fallback. */
export function WebGLGate({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  if (!hasWebGL()) return <NoGL fallback={fallback} />;
  return <Boundary fallback={fallback}>{children}</Boundary>;
}

export default WebGLGate;
