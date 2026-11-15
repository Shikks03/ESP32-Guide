import type { LabStatus } from '../../content/types';
import { STATUS_LABEL } from '../../content/types';
import './StatusMark.css';

export function StatusMark({ status, size = 12, decorative = false }: { status: LabStatus; size?: number; decorative?: boolean }) {
  return (
    <span
      className="ui-mark"
      data-state={status}
      style={{ ['--size' as string]: `${size}px` }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : STATUS_LABEL[status]}
      aria-hidden={decorative ? true : undefined}
    >
      {status === 'done' && (
        <svg viewBox="0 0 12 12" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6.2l2 2L9 4" />
        </svg>
      )}
    </span>
  );
}
