import './PinChip.css';

export function PinChip({ k, v, signal = true }: { k: string; v: string; signal?: boolean }) {
  return (
    <span className="ui-pinchip" data-kind={signal ? 'signal' : 'power'}>
      <b>{k}</b>
      <span>{v}</span>
    </span>
  );
}
