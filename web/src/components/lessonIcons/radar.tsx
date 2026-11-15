import type { ReactElement } from 'react';

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function icon(body: ReactElement): ReactElement {
  return (
    <svg viewBox="0 0 32 32" width={22} height={22} aria-hidden="true" focusable="false" {...STROKE}>
      {body}
    </svg>
  );
}

/** 32x32 line icons for the Serial & radar lessons, keyed by lesson id. Full <svg> elements. */
export const ICONS_RADAR: Record<string, ReactElement> = {
  // loop: a wire going out and coming back
  s1: icon(
    <>
      <path d="M6 10h14a6 6 0 0 1 0 12H12" />
      <path d="M15 18l-4 4 4 4" />
      <circle cx="6" cy="10" r="1.6" />
    </>,
  ),
  // raw bytes: stream of packets
  s2: icon(
    <>
      <rect x="3" y="12" width="6" height="8" rx="1.5" />
      <rect x="13" y="12" width="6" height="8" rx="1.5" />
      <rect x="23" y="12" width="6" height="8" rx="1.5" />
      <path d="M9 16h4M19 16h4" />
    </>,
  ),
  // parse: a frame split into fields
  s3: icon(
    <>
      <rect x="4" y="8" width="24" height="16" rx="2" />
      <path d="M11 8v16M19 8v16" />
      <path d="M7 14h1M14 14h2M22 14h3" />
    </>,
  ),
  // room view: top-down room, radar cone and a dot
  s4: icon(
    <>
      <rect x="4" y="4" width="24" height="24" rx="2" />
      <path d="M16 26L8 8M16 26l8-18" strokeDasharray="2 3" />
      <circle cx="16" cy="26" r="1.6" />
      <circle cx="18" cy="14" r="2.4" />
    </>,
  ),
};

export default ICONS_RADAR;
