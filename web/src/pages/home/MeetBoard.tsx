import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HOTSPOTS } from '../../content/bench';
import { LESSONS } from '../../content/lessons';
import type { Hotspot, HotspotId } from '../../content/types';
import { Chip } from '../../components/ui';
import { RichText } from '../../components/RichText';
import { BoardStage } from './BoardStage';

function HotCard({ h, on, onSelect }: { h: Hotspot; on: boolean; onSelect: (id: HotspotId) => void }) {
  const labs = LESSONS.filter((l) => l.hotspots.includes(h.id));
  const first = labs.slice(0, 4);
  const more = labs.length - first.length;
  return (
    <article className="home-hcard" data-on={on} data-hot={h.id} onClick={() => onSelect(h.id)}>
      <h3>
        <button
          type="button"
          className="home-hcard-btn"
          aria-pressed={on}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(h.id);
          }}
        >
          <span className="home-hcard-n">{h.n}</span>
          {h.name}
        </button>
      </h3>
      <p>
        <RichText text={h.text} />
      </p>
      {labs.length > 0 && (
        <p className="home-used">
          <span>Used in</span>
          {first.map((l) => (
            <Link key={l.id} to={`/lessons/${l.id}`} title={l.title} onClick={(e) => e.stopPropagation()}>
              <Chip>{l.code}</Chip>
            </Link>
          ))}
          {more > 0 && (
            <span className="home-used-more">
              +{more} {more === 1 ? 'lab' : 'labs'}
            </span>
          )}
        </p>
      )}
    </article>
  );
}

export function MeetBoard() {
  const [sel, setSel] = useState<HotspotId | null>(null);
  const left = HOTSPOTS.slice(0, 3);
  const right = HOTSPOTS.slice(3);
  return (
    <section className="home-sec home-board" aria-labelledby="home-board-h">
      <div className="home-sec-head">
        <h2 id="home-board-h" className="home-h2">Meet the board</h2>
        <p className="home-sec-intro">Six parts you will use lab after lab. Pick a part to light it up and see which labs use it.</p>
      </div>
      <div className="home-board-grid">
        <div className="home-hcol home-hcol-l">
          {left.map((h) => <HotCard key={h.id} h={h} on={sel === h.id} onSelect={setSel} />)}
        </div>
        <BoardStage selected={sel} onSelect={setSel} />
        <div className="home-hcol home-hcol-r">
          {right.map((h) => <HotCard key={h.id} h={h} on={sel === h.id} onSelect={setSel} />)}
        </div>
      </div>
      <p className="home-inside"><Link to="/datasheet">Go inside the chip</Link></p>
    </section>
  );
}
