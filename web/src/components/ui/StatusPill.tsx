import type { LabStatus } from '../../content/types';
import { STATUS_LABEL } from '../../content/types';
import { StatusMark } from './StatusMark';
import './StatusPill.css';

export function StatusPill({ status }: { status: LabStatus }) {
  return (
    <span className="ui-pill" data-state={status}>
      <StatusMark status={status} decorative />
      {STATUS_LABEL[status]}
    </span>
  );
}
