import type { JSX } from 'react';

/**
 * Smart bulb track icons. Each value is the inner drawing for a 32x32 viewBox
 * (the same shape as the switch cases in LessonIcon.tsx); the wrapper svg supplies the stroke style.
 */
export const ICONS_BULB: Record<string, JSX.Element> = {
  // L1 Meet the bulb: a bulb
  l1: (
    <>
      <path d="M12 21c-2.5-1.8-4-4.2-4-7a8 8 0 0 1 16 0c0 2.8-1.5 5.2-4 7v2h-8z" />
      <path d="M12 27h8M14 30h4" />
    </>
  ),
  // L2 Switch it: a bulb with a toggle switch
  l2: (
    <>
      <path d="M12 14c-1.6-1.1-2.5-2.6-2.5-4.4a6.5 6.5 0 0 1 13 0c0 1.8-.9 3.3-2.5 4.4v1.6h-8z" />
      <rect x="6" y="21" width="20" height="8" rx="4" />
      <circle cx="21" cy="25" r="2.2" />
    </>
  ),
  // L3 Scenes: a bulb with warm-to-cool rays
  l3: (
    <>
      <path d="M12 21c-2.5-1.8-4-4.2-4-7a8 8 0 0 1 16 0c0 2.8-1.5 5.2-4 7v2h-8z" />
      <path d="M12 27h8" />
      <path d="M16 2v2M4.5 6.5 6 8M27.5 6.5 26 8M2 14h2M28 14h2" />
    </>
  ),
};
