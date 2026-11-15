import type { PartId } from '../../content/types';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Small line icon per bench part. */
export function PartIcon({ id, size = 22 }: { id: PartId; size?: number }) {
  let body;
  switch (id) {
    case 'board':
      body = (<><rect x="6" y="9" width="20" height="14" rx="2" /><path d="M2 16h4M10 9V6M14 9V6M18 9V6M22 9V6" /></>);
      break;
    case 'jumpers':
      body = (<><path d="M5 24c0-10 8-4 11-10s8-6 11-10" /><circle cx="5" cy="24" r="1.6" /><circle cx="27" cy="4" r="1.6" /></>);
      break;
    case 'wifi':
      body = (<><path d="M5 13c6-6 16-6 22 0M9 17.5c4-4 10-4 14 0M13 22c2-2 4-2 6 0" /><circle cx="16" cy="26" r="1" /></>);
      break;
    case 'ld2450':
      body = (<><rect x="5" y="9" width="22" height="14" rx="2" /><path d="M11 16a5 5 0 0 1 10 0M14 16a2 2 0 0 1 4 0" /></>);
      break;
    case 'shelly':
      body = (<><path d="M12 22v3h8v-3M11 22c-4-3-5-6-5-9a10 10 0 0 1 20 0c0 3-1 6-5 9z" /></>);
      break;
    case 'phone':
      body = (<><rect x="9" y="4" width="14" height="24" rx="3" /><path d="M14 24h4" /></>);
      break;
    case 'breadboard':
      body = (<><rect x="4" y="8" width="24" height="16" rx="2" /><path d="M8 13h16M8 19h16M16 8v16" /></>);
      break;
    case 'led':
      body = (<><path d="M11 18v-6a5 5 0 0 1 10 0v6z" /><path d="M9 18h14M13 18v8M19 18v8" /></>);
      break;
    case 'button':
      body = (<><rect x="6" y="14" width="20" height="10" rx="2" /><circle cx="16" cy="9" r="4" /></>);
      break;
    default:
      body = <rect x="8" y="8" width="16" height="16" rx="3" />;
  }
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false" {...S}>
      {body}
    </svg>
  );
}
