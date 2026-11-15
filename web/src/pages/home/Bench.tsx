import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PARTS } from '../../content/bench';
import { LESSONS } from '../../content/lessons';
import type { LabStatus, Lesson, PartId } from '../../content/types';
import { Button, StatusMark } from '../../components/ui';
import { LessonIcon } from '../../components/LessonIcon';
import { useBench } from '../../state/progress';
import { PartIcon } from './PartIcon';

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function Tile({ lesson, status, add }: { lesson: Lesson; status: LabStatus; add?: PartId }) {
  const part = add ? PARTS.find((p) => p.id === add) : undefined;
  return (
    <li>
      <Link className="home-rtile" data-near={add ? 'true' : undefined} to={`/lessons/${lesson.id}`}>
        <span className="home-rtile-ic">
          <LessonIcon id={lesson.id} size={40} />
          <span className="home-rtile-mark"><StatusMark status={status} size={11} /></span>
        </span>
        <span className="home-rtile-id">{lesson.code}</span>
        <span className="home-rtile-name">{lesson.name}</span>
        {part && (
          <span className="home-rtile-add">
            + <PartIcon id={part.id} size={24} />
            <span className="visually-hidden">add {part.name}</span>
          </span>
        )}
      </Link>
    </li>
  );
}

export function Bench({ statuses }: { statuses: Record<string, LabStatus> }) {
  const { have, toggle, setAll, clear } = useBench();
  const [query, setQuery] = useState('');

  const real = useMemo(() => LESSONS.filter((l) => statuses[l.id] !== 'planned'), [statuses]);
  const toggleable = PARTS.filter((p) => !p.always);
  const q = query.trim().toLowerCase();
  const shown = toggleable.filter((p) => !q || p.name.toLowerCase().includes(q) || p.id.includes(q));
  const ticked = toggleable.filter((p) => have.has(p.id)).length;

  const usage = (id: PartId) => {
    const req = real.filter((l) => l.parts.includes(id)).length;
    const opt = real.filter((l) => !l.parts.includes(id) && l.optionalParts?.includes(id)).length;
    return { req, opt };
  };

  const ready: Lesson[] = [];
  const near: { lesson: Lesson; add: PartId }[] = [];
  let far = 0;
  for (const l of real) {
    const missing = l.parts.filter((p) => p !== 'board' && !have.has(p));
    if (missing.length === 0) ready.push(l);
    else if (missing.length === 1) near.push({ lesson: l, add: missing[0] });
    else far += 1;
  }

  return (
    <section className="home-sec" aria-labelledby="home-bench-h">
      <div className="home-sec-head">
        <h2 id="home-bench-h" className="home-h2">What's on your bench?</h2>
        <p className="home-sec-intro">Tick the parts you have, or search for them: the labs you can build light up, and the ones a single part away show what to add.</p>
      </div>
      <div className="home-bench">
        <div className="home-card home-parts">
          <p className="home-basics">
            <PartIcon id="board" size={34} />
            Every lab: the board and a USB-C data cable
          </p>
          <div className="home-parts-tools">
            <label className="home-search">
              <span className="visually-hidden">Search the parts</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></svg>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a part: radar, bulb, wire…" />
            </label>
            <Button className="home-mini" onClick={setAll}>I have them all</Button>
            <Button className="home-mini" onClick={clear} disabled={ticked === 0}>Clear</Button>
          </div>
          {shown.length === 0 ? (
            <p className="home-none">No part matches “{query}”.</p>
          ) : (
            <ul className="home-partlist" aria-label="Parts you might have">
              {shown.map((p) => {
                const { req, opt } = usage(p.id);
                const on = have.has(p.id);
                const text = req > 0 ? `used in ${req} ${plural(req, 'lab', 'labs')}` : opt > 0 ? `optional in ${opt} ${plural(opt, 'lab', 'labs')}` : 'used in 0 labs';
                return (
                  <li key={p.id}>
                    <button type="button" className="home-part" aria-pressed={on} onClick={() => toggle(p.id)}>
                      <span className="home-part-ic">
                        <PartIcon id={p.id} size={38} />
                        <span className="home-part-tick" aria-hidden="true">
                          {on && <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2l2.2 2.2L9.5 3.8" /></svg>}
                        </span>
                      </span>
                      <span className="home-part-txt">
                        <span className="home-part-name">{p.name}</span>
                        {p.note && <span className="home-part-note">{p.note}</span>}
                        <span className="home-part-use">{text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="home-card home-readout" aria-live="polite">
          <p className="home-readout-big" data-testid="readout">
            <b>{ready.length}</b>
            <small>/{real.length}</small>
            <span>labs you can build now</span>
          </p>
          <h3 className="home-group">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>
            Ready to build: {ready.length} {plural(ready.length, 'lab', 'labs')}
          </h3>
          {ready.length > 0 && (
            <ul className="home-rtiles">
              {ready.map((l) => <Tile key={l.id} lesson={l} status={statuses[l.id]} />)}
            </ul>
          )}
          <h3 className="home-group">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
            One part away: {near.length} {plural(near.length, 'lab', 'labs')}
          </h3>
          {near.length > 0 && (
            <ul className="home-rtiles">
              {near.map((n) => <Tile key={n.lesson.id} lesson={n.lesson} status={statuses[n.lesson.id]} add={n.add} />)}
            </ul>
          )}
          <p className="home-foot">
            {far} more {plural(far, 'lab needs', 'labs need')} two parts or more.
          </p>
        </div>
      </div>
    </section>
  );
}
