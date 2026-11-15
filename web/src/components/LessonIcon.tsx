import { cloneElement, isValidElement } from 'react';
import { ICONS_WIFI } from './lessonIcons/wifi';
import { ICONS_RADAR } from './lessonIcons/radar';
import { ICONS_BULB } from './lessonIcons/bulb';

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Line icons for the node rail and lesson tile. Track icons live in ./lessonIcons; unknown ids get the chip icon. */
export function LessonIcon({ id, size = 22 }: { id: string; size?: number }) {
  // Radar icons are full <svg> elements; resize them in place.
  const full = ICONS_RADAR[id];
  if (isValidElement(full)) return cloneElement(full as React.ReactElement<{ width?: number; height?: number }>, { width: size, height: size });
  let body;
  switch (id) {
    case '00':
      body = (
        <>
          <path d="M4 22c4 0 5-6 9-6h6" />
          <rect x="19" y="12" width="9" height="8" rx="2" />
          <path d="M22 12V9M25 12V9" />
        </>
      );
      break;
    case '01':
      body = (
        <>
          <rect x="8" y="8" width="16" height="16" rx="2" />
          <circle cx="16" cy="16" r="2.5" />
          <path d="M12 4v4M20 4v4M12 24v4M20 24v4M4 12h4M4 20h4M24 12h4M24 20h4" />
        </>
      );
      break;
    case '02':
      body = (
        <>
          <path d="M16 28V14" />
          <path d="M16 14c0-4 3-6 3-9" />
          <circle cx="19" cy="5" r="1.6" />
          <path d="M9 20c-2-2-2-6 0-8M23 20c2-2 2-6 0-8" />
        </>
      );
      break;
    default:
      if (ICONS_WIFI[id] || ICONS_BULB[id]) {
        body = ICONS_WIFI[id] ?? ICONS_BULB[id];
        break;
      }
      body = (
        <>
          <rect x="8" y="8" width="16" height="16" rx="3" />
          <path d="M12 4v4M20 4v4M12 24v4M20 24v4M4 12h4M4 20h4M24 12h4M24 20h4" />
        </>
      );
  }
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false" {...STROKE}>
      {body}
    </svg>
  );
}

export default LessonIcon;
