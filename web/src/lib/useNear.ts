import { useEffect, useState, type RefObject } from 'react';

/**
 * True once the element has come within `margin` of the viewport (stays true).
 * Used to hold back the 3D chunk (three.js, ~240 kB gzipped) until its stage is about to be seen.
 */
export function useNear(ref: RefObject<Element>, margin = '150px'): boolean {
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (near || !ref.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near, ref, margin]);
  return near;
}
