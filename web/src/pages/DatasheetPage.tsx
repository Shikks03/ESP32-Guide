import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTitle } from '../lib/useTitle';
import { useCalm } from '../state/settings';
import { useAllStatuses } from '../state/progress';
import { LESSONS } from '../content/lessons';
import { CHIP_BLOCKS, CLAIMS, FIVE_THINGS, STATS, type FiveThing } from '../content/chip';
import type { Citation, Stat } from '../content/types';
import { STATUS_LABEL } from '../content/types';
import { Button, Card, MicroLabel, SectionHeading } from '../components/ui';
import { BoardSvg } from '../components/BoardSvg';
import {
  STATE_LEGEND,
  STATE_ORDER,
  STATE_WORD,
  blockStates,
  countStates,
  nextToUnlock,
  usedCount,
  type BlockState,
} from '../lib/coverage';
import FloorPlan from './datasheet/FloorPlan';
import { WebGLGate } from '../components/three/WebGLGate';
import { useNear } from '../lib/useNear';
import { FAMILIES, familyFromKey, familyKey } from './datasheet/families';
import { FamilyIcon } from '../components/LessonIcon';
import './DatasheetPage.css';

const ChipLayers3D = lazy(() => import('../components/three/ChipLayers3D'));

const LAYERS = [
  {
    title: 'Board',
    text: 'The DevKit: a USB-C port with a CH340C USB-serial chip, EN and BOOT buttons, a blue LED on GPIO 2, and two rows of header pins around one module.',
  },
  {
    title: 'Module',
    text: 'The ESP32-WROOM-32 module, 18 × 25.5 mm: the ESP32 chip and a 4 MB SPI flash under one metal can, with a printed PCB antenna beside it.',
  },
  {
    title: 'Chip',
    text: `The silicon itself, drawn as ${CHIP_BLOCKS.length} blocks by family. The ones your labs have used stand taller.`,
  },
] as const;

/* ------------------------------------------------------------------ citation */

function CiteChip({ cite }: { cite: Citation }) {
  const label = `${cite.doc} ${cite.section}`;
  const inner = (
    <>
      <span>{label}</span>
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2.5H2.5v7h7V7M7 2h3v3M10 2L5.5 6.5" />
      </svg>
    </>
  );
  if (!cite.url) return <span className="ds-cite">{inner}</span>;
  return (
    <a className="ds-cite" href={cite.url} target="_blank" rel="noopener noreferrer" title={`Open ${label} in Espressif's documentation (new tab)`}>
      {inner}
    </a>
  );
}

/* ------------------------------------------------------------------ stats */

function useCountUp(target: number, run: boolean, instant: boolean): number {
  const [v, setV] = useState(instant ? target : 0);
  useEffect(() => {
    if (instant) {
      setV(target);
      return;
    }
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1000);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, instant]);
  return v;
}

function StatTile({ stat, run, instant }: { stat: Stat; run: boolean; instant: boolean }) {
  const v = useCountUp(stat.value, run, instant);
  const final = `${stat.prefix ?? ''}${stat.value}`;
  return (
    <li className="ds-stat">
      <div className="ds-stat-num">
        <span className="ds-stat-val" aria-hidden="true">{`${stat.prefix ?? ''}${v}`}</span>
        <span className="ds-sr">{final}</span>
        {stat.unit && <span className="ds-stat-unit"> {stat.unit}</span>}
      </div>
      <div className="ds-stat-label">{stat.label}</div>
      {stat.note && <div className="ds-stat-note">{stat.note}</div>}
    </li>
  );
}

function Stats() {
  const calm = useCalm();
  const ref = useRef<HTMLUListElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setInView(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section aria-labelledby="ds-numbers">
      <h2 id="ds-numbers" className="ds-sr">The chip in numbers</h2>
      <ul className="ds-stats" ref={ref}>
        {STATS.map((s) => (
          <StatTile key={s.label} stat={s} run={inView} instant={calm} />
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ ring */

function Ring({ counts, total, used }: { counts: Record<BlockState, number>; total: number; used: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="ds-ring" aria-hidden="true">
      <svg viewBox="0 0 140 140" width="140" height="140">
        <circle cx="70" cy="70" r={R} className="ds-ring-track" />
        {STATE_ORDER.map((s) => {
          const len = (counts[s] / total) * C;
          if (!len) return null;
          const dash = Math.max(0, len - 1.5);
          const el = (
            <circle
              key={s}
              cx="70"
              cy="70"
              r={R}
              className="ds-ring-seg"
              data-state={s}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="ds-ring-center">{`${used}/${total}`}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ bite card */

function BiteCard({ item }: { item: FiveThing }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="ds-bite">
      <h3>{item.title}</h3>
      <p>{item.text}</p>
      <div className="ds-bite-foot">
        <CiteChip cite={item.cite} />
        {item.pins && (
          <button type="button" className="ds-seepins" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? 'Hide the pins' : `See GPIO ${item.pins.join(', ')}`}
          </button>
        )}
      </div>
      {item.pins && open && (
        <div className="ds-bite-board">
          <BoardSvg
            pins={item.pins.map((p) => ({ pin: p, tag: `GPIO ${p}`, signal: true }))}
            legend="lesson"
            title={`ESP32 DevKit with GPIO ${item.pins.join(', ')} marked`}
          />
          <p className="ds-bite-note">Pins not drawn on the header (for example GPIO 0, which only the BOOT button uses) have no marker.</p>
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ page */

type Layer = 0 | 1 | 2;

export default function DatasheetPage() {
  useTitle('Inside the ESP32 · Datasheet');
  const statuses = useAllStatuses();
  const [params, setParams] = useSearchParams();
  const family = familyFromKey(params.get('family'));
  const [layer, setLayer] = useState<Layer>(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageNear = useNear(stageRef);
  const [selected, setSelected] = useState<string | undefined>();
  const [table, setTable] = useState(false);

  const states = useMemo(() => blockStates(CHIP_BLOCKS, LESSONS, statuses), [statuses]);
  const counts = useMemo(() => countStates(states), [states]);
  const total = CHIP_BLOCKS.length;
  const used = usedCount(counts);
  const next = useMemo(() => nextToUnlock(CHIP_BLOCKS, LESSONS, statuses, states), [statuses, states]);
  const layerBlocks = useMemo(
    () => CHIP_BLOCKS.map((b) => ({ id: b.id, name: b.name, family: b.family, state: states[b.id] })),
    [states],
  );
  const shown = CHIP_BLOCKS.filter((b) => !family || b.family === family);
  const sel = CHIP_BLOCKS.find((b) => b.id === selected);

  const setFamily = (f: string | null) => {
    const p = new URLSearchParams(params);
    if (f) p.set('family', f);
    else p.delete('family');
    setParams(p, { replace: true });
  };

  const layerInfo = LAYERS[layer];

  return (
    <div className="ds">
      <header className="ds-hero">
        <MicroLabel>THE CHIP ON YOUR BOARD</MicroLabel>
        <h1>Inside the ESP32</h1>
        <p className="ds-lead">
          The ESP32-WROOM-32 packs a dual-core 240 MHz computer with 2.4 GHz Wi-Fi and Bluetooth 4.2 onto a module smaller than a postage stamp.
        </p>
      </header>

      <Stats />

      <section aria-label="What the datasheets say">
        <ul className="ds-claims">
          {CLAIMS.map((c) => (
            <li key={c.title} className="ds-claim" data-marker={c.marker}>
              <span className="ds-marker" aria-hidden="true">
                {c.marker === 'gotcha' ? (
                  <svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 1.5L15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M8 6v4M8 11.6v.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                ) : (
                  <svg viewBox="0 0 16 16" width="16" height="16"><rect x="4" y="4" width="8" height="8" fill="currentColor" /></svg>
                )}
              </span>
              <div>
                <p>
                  <span className="ds-sr">{c.marker === 'gotcha' ? 'Gotcha: ' : 'Key fact: '}</span>
                  <strong>{c.title}.</strong> {c.body}
                </p>
                <CiteChip cite={c.cite} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="ds-explorer" aria-labelledby="ds-layers">
        <h2 id="ds-layers" className="ds-sr">Layers: board, module, chip</h2>
        <div className="ds-stage" ref={stageRef}>
          {!stageNear ? <p className="ds-loading">Loading the 3D view…</p> : <WebGLGate fallback={<FloorPlan layer={layer} blocks={layerBlocks} selected={selected} onSelect={setSelected} />}>
            <Suspense fallback={<p className="ds-loading">Loading the 3D view…</p>}>
              <ChipLayers3D layer={layer} blocks={layerBlocks} selected={selected} onSelect={setSelected} />
            </Suspense>
          </WebGLGate>}
        </div>
        <div className="ds-caption">
          <MicroLabel>{`Layer ${layer + 1} of ${LAYERS.length}`}</MicroLabel>
          <h3>{layerInfo.title}</h3>
          <p>{layerInfo.text}</p>
          <div className="ds-stepper" role="group" aria-label="Layers">
            <Button disabled={layer === 0} onClick={() => setLayer((l) => Math.max(0, l - 1) as Layer)}>Previous layer</Button>
            <Button disabled={layer === LAYERS.length - 1} onClick={() => setLayer((l) => Math.min(LAYERS.length - 1, l + 1) as Layer)}>Next layer</Button>
          </div>
          <p className="ds-sr" aria-live="polite">{`Layer ${layer + 1} of ${LAYERS.length}: ${layerInfo.title}`}</p>
          {layer === 2 && (
            <ul className="ds-legend-fam" aria-label="Block families and their colours">
              {FAMILIES.map((f) => (
                <li key={f} data-fam={familyKey(f)}><i aria-hidden="true" />{f}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="ds-blocks">
        <h2 id="ds-blocks" className="ds-h2">Blocks on the die</h2>
        <p className="ds-sub" aria-live="polite">
          {family ? `${shown.length} of ${total} blocks, ${family} family.` : `All ${total} blocks.`} Pick one to read about it.
        </p>
        <ul className="ds-blocks" aria-label="Blocks on the die">
          {shown.map((b) => (
            <li key={b.id} data-fam={familyKey(b.family)}>
              <button type="button" className="ds-block" aria-pressed={selected === b.id} onClick={() => setSelected(selected === b.id ? undefined : b.id)} data-state={states[b.id]}>
                <span className="ds-block-name">{b.name}</span>
                <span className="ds-block-meta">{b.family} · {STATE_WORD[states[b.id]]}</span>
              </button>
            </li>
          ))}
        </ul>
        {sel && (
          <Card className="ds-detail" title={`${sel.name}, ${STATE_WORD[states[sel.id]]}`}>
            <p>{sel.blurb}</p>
            {sel.cite ? <CiteChip cite={sel.cite} /> : <p className="ds-sub">No datasheet section is cited for this block yet.</p>}
          </Card>
        )}
      </section>

      <section className="ds-progress-grid">
        <Card className="ds-progress" title="Your progress through the chip">
          <div className="ds-progress-head">
            <p className="ds-sub">Blocks of the chip by how far your labs have taken them</p>
            <button type="button" className="ds-link" aria-expanded={table} onClick={() => setTable((t) => !t)}>
              {table ? 'Hide table' : 'Show as table'}
            </button>
          </div>
          <div className="ds-progress-body">
            <Ring counts={counts} total={total} used={used} />
            <ul className="ds-legend">
              {STATE_ORDER.filter((s) => s === 'runs' || s === 'built' || s === 'none' || counts[s] > 0).map((s) => (
                <li key={s}>
                  <i className="ds-swatch" data-state={s} aria-hidden="true" />
                  <span>{STATE_LEGEND[s]}</span>
                  <b>{counts[s]}</b>
                </li>
              ))}
            </ul>
          </div>
          {table && (
            <table className="ds-table">
              <caption className="ds-sr">Blocks by state</caption>
              <thead><tr><th scope="col">State</th><th scope="col">Count</th></tr></thead>
              <tbody>
                {STATE_ORDER.map((s) => (
                  <tr key={s}><th scope="row">{STATE_LEGEND[s]}</th><td>{counts[s]}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="ds-sentence">{`Your labs have used ${used} of ${total} blocks.`}</p>
        </Card>

        <div className="ds-next">
          <MicroLabel as="h2">Next blocks to unlock</MicroLabel>
          {next.length === 0 ? (
            <p className="ds-sub">Every block the labs reach is done. The rest wait for new labs.</p>
          ) : (
            <ul className="ds-next-list">
              {next.map(({ block, lesson }) => (
                <li key={block.id}>
                  <a href={`#/lessons/${lesson.id}`} className="ds-next-card" data-fam={familyKey(block.family)}>
                    <b>{block.name}</b>
                    <span>{block.blurb}</span>
                    <small>{`${lesson.code} · ${lesson.name}`} <em>({STATUS_LABEL[statuses[lesson.id] ?? lesson.status]})</em></small>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="ds-fams">
        <h2 id="ds-fams" className="ds-h2">Families</h2>
        <ul className="ds-fams">
          <li>
            <button type="button" className="ds-fam" aria-pressed={!family} onClick={() => setFamily(null)}>
              All <small>{total} blocks</small>
            </button>
          </li>
          {FAMILIES.map((f) => {
            const n = CHIP_BLOCKS.filter((b) => b.family === f).length;
            return (
              <li key={f}>
                <button type="button" className="ds-fam" data-fam={familyKey(f)} aria-pressed={family === f} onClick={() => setFamily(familyKey(f))}>
                  <FamilyIcon fam={familyKey(f)} size={26} />
                  {f} <small>{n} {n === 1 ? 'block' : 'blocks'}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Five things that bite">
        <SectionHeading title="Five things that bite" />
        <div className="ds-bites">
          {FIVE_THINGS.map((t) => (
            <BiteCard key={t.title} item={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
