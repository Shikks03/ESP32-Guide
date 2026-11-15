import { useSearchParams } from 'react-router-dom';
import { LOG } from '../content/log';
import { LESSONS } from '../content/lessons';
import { BENCH_NOW, FLASH_LAYOUT, FLASH_LAYOUT_NOTE, INSTALLED_ON_LAPTOP, ON_THE_BOARD_NOW } from '../content/bench';
import type { LogEntry, LogType } from '../content/types';
import { RichText } from '../components/RichText';
import { CommandBox } from '../components/ui/CommandBox';
import { MicroLabel } from '../components/ui/MicroLabel';
import { useTitle } from '../lib/useTitle';
import './BenchPage.css';

const FILTERS: ('all' | LogType)[] = ['all', 'install', 'build', 'read', 'reset', 'flash', 'failed'];

function contextLabel(e: LogEntry): string {
  if (e.type === 'flash') return 'Board · writes flash';
  if (e.type === 'install' && e.by === 'riku') return 'you';
  return 'Laptop';
}

function plain(s: string) {
  return s.replace(/[`*]/g, '');
}

function Dot({ type }: { type: LogType }) {
  return <i className="bench-dot" data-type={type} aria-hidden="true" />;
}

export default function BenchPage() {
  useTitle('Bench log');
  const [params, setParams] = useSearchParams();
  const raw = params.get('type');
  const active: 'all' | LogType = FILTERS.includes(raw as LogType) && raw !== 'all' ? (raw as LogType) : 'all';

  const count = (f: 'all' | LogType) => (f === 'all' ? LOG.length : LOG.filter((e) => e.type === f).length);
  const shown = active === 'all' ? LOG : LOG.filter((e) => e.type === active);

  const pick = (f: 'all' | LogType) => {
    const next = new URLSearchParams(params);
    if (f === 'all') next.delete('type');
    else next.set('type', f);
    setParams(next, { replace: true });
  };

  const current = LESSONS.find((l) => l.id === ON_THE_BOARD_NOW);
  const built = LESSONS.filter((l) => l.status === 'built' && l.labDir).map((l) => l.labDir!.replace(/^labs\//, ''));
  const onBoardValue = current?.labDir ? current.labDir.replace(/^labs\//, '') : ON_THE_BOARD_NOW;

  const rows: { k: string; v: string; sub: string; hero?: boolean }[] = [
    {
      k: 'On the board now',
      v: onBoardValue,
      sub: `${BENCH_NOW.onBoardSub}${built.length ? ` · built, not flashed: ${built.join(', ')} and every new lab` : ''}`,
      hero: true,
    },
    ...BENCH_NOW.rows,
  ];

  return (
    <div className="bench">
      <section aria-labelledby="bench-now-h">
        <div className="bench-now-head">
          <h1 id="bench-now-h" className="bench-h1">On the bench now</h1>
          <p className="bench-specs" aria-label="Board specifications">
            {BENCH_NOW.specs.map((s, i) => (
              <span key={i}>
                {s.map((part, j) => (part.b ? <strong key={j}>{part.t}</strong> : <span key={j}>{part.t}</span>))}
              </span>
            ))}
          </p>
        </div>
        <div className="bench-now">
          {rows.map((r) => (
            <div key={r.k} className={`bench-row${r.hero ? ' bench-row-hero' : ''}`}>
              <MicroLabel>{r.k}</MicroLabel>
              <div className="bench-row-v">{r.v}</div>
              <div className="bench-row-sub">{r.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="bench-log-h" className="bench-sec">
        <h2 id="bench-log-h" className="bench-h2">Bench log</h2>
        <p className="bench-note">
          Every command that installed software, talked to the board or flashed it, with its response. Claude announces each command first.
          Anything that installs software or touches the board waits for your go.
        </p>

        <div className="bench-chips" role="group" aria-label="Filter by type">
          {FILTERS.map((f) => (
            <button key={f} type="button" className="bench-chip" aria-pressed={active === f} onClick={() => pick(f)}>
              {f} <span>{count(f)}</span>
            </button>
          ))}
        </div>

        <div className="bench-strip-card">
          <div className="bench-strip" aria-hidden="true">
            {LOG.map((e) => (
              <i key={e.n} className="bench-cell" data-type={e.type} data-dim={active !== 'all' && e.type !== active ? '' : undefined} />
            ))}
          </div>
          <ul className="bench-legend">
            <li><Dot type="flash" /> flash</li>
            <li><Dot type="failed" /> failed</li>
            <li><Dot type="build" /> install, build, read, reset</li>
          </ul>
        </div>

        {shown.length === 0 ? (
          <p className="bench-empty">Nothing logged as {active} yet.</p>
        ) : (
          <ol className="bench-timeline" aria-label="Log timeline">
            {shown.map((e) => (
              <li key={e.n} className="bench-entry" data-type={e.type} aria-label={`${e.n} · ${e.type} · ${plain(e.what)}`}>
                <span className="bench-node" aria-hidden="true" />
                <div className="bench-num">{String(e.n).padStart(2, '0')}</div>
                <div className="bench-body">
                  <div className="bench-title">
                    <span className="bench-tag" data-type={e.type}>{e.type}</span>
                    <strong><RichText text={e.what} /></strong>
                    <span className="bench-ctx">{contextLabel(e)}</span>
                  </div>
                  <p className="bench-why"><RichText text={e.why} /></p>
                  {e.command && <CommandBox command={e.command} />}
                  <p className="bench-result">
                    <strong>Result</strong> <RichText text={e.result} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="bench-flash-h" className="bench-sec">
        <h2 id="bench-flash-h" className="bench-h2">Flash layout written by 01-hello</h2>
        <div className="bench-table-wrap" tabIndex={0} role="region" aria-label="Flash layout table">
          <table className="bench-table">
            <thead>
              <tr><th>Address</th><th>File</th><th>Size</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              {FLASH_LAYOUT.map((r) => (
                <tr key={r.address}>
                  <td><code>{r.address}</code></td>
                  <td><code>{r.file}</code></td>
                  <td className="bench-num-cell">{r.size}</td>
                  <td>{r.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="bench-foot"><RichText text={FLASH_LAYOUT_NOTE} /></p>
      </section>

      <section aria-labelledby="bench-inst-h" className="bench-sec">
        <h2 id="bench-inst-h" className="bench-h2">Installed on the laptop</h2>
        <div className="bench-table-wrap" tabIndex={0} role="region" aria-label="Installed on the laptop table">
          <table className="bench-table">
            <thead>
              <tr><th>Where</th><th>What</th><th>Size</th></tr>
            </thead>
            <tbody>
              {INSTALLED_ON_LAPTOP.rows.map((r) => (
                <tr key={r.where}>
                  <td><code>{r.where}</code></td>
                  <td>{r.what}</td>
                  <td className="bench-num-cell">{r.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="bench-foot">{INSTALLED_ON_LAPTOP.note}</p>
      </section>
    </div>
  );
}
