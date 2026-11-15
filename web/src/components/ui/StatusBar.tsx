import type { LabStatus } from '../../content/types';
import { STATUS_LABEL, STATUS_ORDER } from '../../content/types';
import './StatusBar.css';

type Props =
  | { counts: Record<LabStatus, number>; total: number; statuses?: never }
  | { statuses: LabStatus[]; counts?: never; total?: never };

export function StatusBar(props: Props) {
  const segs: LabStatus[] = props.statuses
    ? props.statuses
    : STATUS_ORDER.flatMap((s) => new Array<LabStatus>(props.counts[s] ?? 0).fill(s));
  const total = props.statuses ? props.statuses.length : props.total;
  const summary = STATUS_ORDER.map((s) => [s, segs.filter((x) => x === s).length] as const)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${n} ${STATUS_LABEL[s]}`)
    .join(', ');
  return (
    <div className="ui-bar">
      <ul className="ui-bar-strip" aria-hidden="true">
        {segs.map((s, i) => (
          <li key={i} data-state={s} />
        ))}
      </ul>
      <span className="visually-hidden">
        {total} labs: {summary || 'none yet'}
      </span>
    </div>
  );
}
