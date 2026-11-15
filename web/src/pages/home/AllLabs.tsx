import { Link } from 'react-router-dom';
import { TRACKS } from '../../content/tracks';
import { lessonsInTrack } from '../../content/lessons';
import type { LabStatus } from '../../content/types';
import { STATUS_LABEL, STATUS_ORDER } from '../../content/types';
import { StatusMark } from '../../components/ui';
import { LessonIcon, TrackIcon } from '../../components/LessonIcon';
import { useCalm } from '../../state/settings';
import { TRACK_COLOR } from '../../content/trackColors';

export { TRACK_COLOR };

function Ring({ working, total, calm }: { working: number; total: number; calm: boolean }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const off = c * (1 - (total ? working / total : 0));
  return (
    <svg className="home-ring" viewBox="0 0 52 52" width="58" height="58" aria-hidden="true">
      <circle cx="26" cy="26" r={r} className="home-ring-bg" />
      <circle
        cx="26"
        cy="26"
        r={r}
        className={`home-ring-arc${calm ? '' : ' home-ring-anim'}`}
        strokeDasharray={c}
        style={{ ['--c' as string]: c, strokeDashoffset: off }}
        transform="rotate(-90 26 26)"
      />
    </svg>
  );
}

export function AllLabs({ statuses }: { statuses: Record<string, LabStatus> }) {
  const calm = useCalm();
  return (
    <section className="home-sec" aria-labelledby="home-all-h">
      <div className="home-sec-head home-sec-head-row">
        <h2 id="home-all-h" className="home-h2">All labs</h2>
        <ul className="home-legend" aria-label="Legend">
          {STATUS_ORDER.map((s) => (
            <li key={s}><StatusMark status={s} size={12} decorative />{STATUS_LABEL[s]}</li>
          ))}
        </ul>
      </div>
      <div className="home-tracks">
        {TRACKS.map((t) => {
          const lessons = lessonsInTrack(t.id);
          const working = lessons.filter((l) => statuses[l.id] === 'done' || statuses[l.id] === 'runs').length;
          return (
            <article key={t.id} className="home-track" style={{ ['--tc' as string]: TRACK_COLOR[t.id] }} data-planned={lessons.every((l) => statuses[l.id] === 'planned') ? '' : undefined}>
              <div className="home-track-info">
                <span className="home-badge">
                  <Ring working={working} total={lessons.length} calm={calm} />
                  <TrackIcon id={t.id} size={34} />
                </span>
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.blurb}</p>
                  <p className="home-track-count"><b>{working}</b>/{lessons.length}<span> working</span></p>
                </div>
              </div>
              <ul className="home-tiles">
                {lessons.map((l) => {
                  const s = statuses[l.id];
                  const inner = (
                    <>
                      <span className="home-tile-ic">
                        <LessonIcon id={l.id} size={52} />
                        <span className="home-tile-mark"><StatusMark status={s} size={12} /></span>
                      </span>
                      <span className="home-tile-id">{l.code}</span>
                      <span className="home-tile-name">{l.name}</span>
                    </>
                  );
                  return (
                    <li key={l.id}>
                      {s === 'planned' ? (
                        <span className="home-tile" data-state="planned">{inner}</span>
                      ) : (
                        <Link className="home-tile" data-state={s} to={`/lessons/${l.id}`}>{inner}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
