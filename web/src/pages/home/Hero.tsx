import { Link } from 'react-router-dom';
import { TRACKS } from '../../content/tracks';
import { LESSONS, lessonById } from '../../content/lessons';
import type { LabStatus } from '../../content/types';
import { Button, StatusPill } from '../../components/ui';
import { LessonIcon } from '../../components/LessonIcon';
import { useLastLesson } from '../../state/progress';
import { TRACK_COLOR } from '../../content/trackColors';

function Traces() {
  return (
    <svg className="home-traces" viewBox="0 0 600 260" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 40h330l22-22h40" />
      <circle cx="396" cy="18" r="4" />
      <path d="M60 250v-20h220l24-24h120" />
      <circle cx="448" cy="206" r="4" />
    </svg>
  );
}

export function Hero({ statuses }: { statuses: Record<string, LabStatus> }) {
  const [last] = useLastLesson();
  const resumed = last ? lessonById(last) : undefined;
  const source = resumed ?? LESSONS.find((l) => statuses[l.id] !== 'done' && statuses[l.id] !== 'runs' && statuses[l.id] !== 'planned') ?? LESSONS[0];
  const track = TRACKS.find((t) => t.id === source.track);

  const order = TRACKS.map((t) => t.lessonIds.map((id) => statuses[id]).filter(Boolean));
  const flat = order.flat();
  const done = flat.filter((s) => s === 'done').length;
  const runs = flat.filter((s) => s === 'runs').length;
  const built = flat.filter((s) => s === 'built').length;
  const working = done + runs;

  return (
    <header className="home-hero">
      <div className="home-hero-main">
        <Traces />
        <p className="home-kicker">ESP32-WROOM-32 · 30-PIN · BENCH GUIDE</p>
        <h1 className="home-title">
          ESP32 <span>Labs</span>
        </h1>
        <p className="home-motto">
          <span>Wire</span> · <span>Flash</span> · <span>Watch</span> · <span>Read the code</span>
        </p>
      </div>

      <section className="home-hud" aria-labelledby="home-hud-h">
        <div className="home-hud-head">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></svg>
          <h2 id="home-hud-h">Labs working</h2>
          <p className="home-hud-count">
            {working}
            <small>/{LESSONS.length}</small>
          </p>
        </div>
        <div className="home-strip" role="group" aria-label="Every lab, by track">
          {order.map((list, gi) => (
            <ul key={TRACKS[gi].id} className="home-strip-group" aria-hidden="true" style={{ ['--track' as string]: TRACK_COLOR[TRACKS[gi].id] }}>
              {list.map((s, i) => (
                <li key={i} data-state={s} />
              ))}
            </ul>
          ))}
          <span className="visually-hidden">Every lab, by track</span>
        </div>
        <dl className="home-hud-stats">
          <div><dt className="visually-hidden">on the board</dt><dd><b>{runs}</b><span>on the board</span></dd></div>
          <div><dt className="visually-hidden">done by you</dt><dd><b>{done}</b><span>done by you</span></dd></div>
          <div><dt className="visually-hidden">ready to try</dt><dd><b>{built}</b><span>ready to try</span></dd></div>
        </dl>
      </section>

      <section className="home-start" aria-labelledby="home-start-h" style={{ ['--track' as string]: TRACK_COLOR[source.track] }}>
        <p className="home-start-kicker" id="home-start-h">{resumed ? 'Pick up where you left off' : 'Start here'}</p>
        <div className="home-start-body">
          <span className="home-start-badge">
            <LessonIcon id={source.id} size={66} />
            <b>{source.code}</b>
          </span>
          <div>
            <p className="home-start-track">{track?.title}</p>
            <p className="home-start-title">{source.title}</p>
          </div>
        </div>
        <StatusPill status={statuses[source.id]} />
        <div className="home-start-actions">
          <Button variant="primary" className="home-start-open" href={`#/lessons/${source.id}`}>Open the lab →</Button>
          {resumed && resumed.files.length > 0 && (
            <Link className="home-start-code" to={`/lessons/${source.id}/code`}>Read its code</Link>
          )}
        </div>
      </section>
    </header>
  );
}
