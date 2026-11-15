import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { LabStatus, Lesson } from '../content/types';
import { STATUS_LABEL } from '../content/types';
import { TRACKS } from '../content/tracks';
import { TRACK_COLOR } from '../content/trackColors';
import { LESSONS, lessonById, lessonsInTrack } from '../content/lessons';
import { BETWEEN_LESSONS, OPEN_FOLDER_TIP, PATH_NOTE, PIO_TERMINAL_NOTE } from '../content/common';
import { BoardSvg } from '../components/BoardSvg';
import { SerialMonitor } from '../components/SerialMonitor';
import { WiringSketch } from '../components/WiringSketch';
import { LessonIcon, TrackIcon } from '../components/LessonIcon';
import { RichText } from '../components/RichText';
import { Card, Chip, CommandBox, MicroLabel, PinChip, Segmented, SectionHeading, StatusBar, StatusMark, StatusPill } from '../components/ui';
import { initialLedState, ledLevel, type LedState } from '../lib/ledSim';
import { useTitle } from '../lib/useTitle';
import { useAllStatuses, useLabStatus, useLastLesson, useStopsRead, useTicks } from '../state/progress';
import { useCalm } from '../state/settings';
import './LessonPage.css';

type Tab = 'goal' | 'wire' | 'steps' | 'preview' | 'pinout';
const TAB_IDS: Tab[] = ['goal', 'wire', 'steps', 'preview', 'pinout'];
const SECTION_ID: Record<Tab, string> = {
  goal: 'lesson-goal',
  wire: 'lesson-wire',
  steps: 'lesson-steps',
  preview: 'lesson-preview',
  pinout: 'lesson-pinout',
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const isWorking = (s: LabStatus) => s === 'done' || s === 'runs';

/* ------------------------------------------------------------------ small icons */

function Ico({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
const IcoGoal = () => <Ico><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Ico>;
const IcoWire = () => <Ico><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8 17c6 0 2-10 8-10" /></Ico>;
const IcoSteps = () => <Ico><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></Ico>;
const IcoPreview = () => <Ico><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M6 15l4-4 3 3 5-6" /></Ico>;
const IcoCode = () => <Ico><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /></Ico>;
const IcoBoard = () => <Ico><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4" /></Ico>;
const IcoArrow = () => <Ico><path d="M5 12h14M13 6l6 6-6 6" /></Ico>;
const IcoCheck = () => <Ico><path d="M5 12.5l4.5 4.5L19 7" /></Ico>;

/* ------------------------------------------------------------------ live board (re-renders per frame on its own) */

const LivePinout = memo(function LivePinout({ lesson, led }: { lesson: Lesson; led: LedState | null }) {
  const calm = useCalm();
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!led) {
      setLevel(0);
      return;
    }
    if (calm) {
      setLevel(led.mode === 'off' ? 0 : 0.8);
      return;
    }
    let raf = 0;
    const frame = () => {
      setLevel(ledLevel(led, performance.now()));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [led, calm]);
  return <BoardSvg pins={lesson.pins} usb={lesson.usb} ledLevel={level} legend="pinout" title="ESP32 DevKit pinout" />;
});

/* ------------------------------------------------------------------ track tabs + node rail */

function TrackTabs({ trackId }: { trackId: string }) {
  const statuses = useAllStatuses();
  return (
    <nav className="lesson-tracks" aria-label="Tracks">
      <ul>
        {TRACKS.map((t) => {
          const ls = lessonsInTrack(t.id);
          const sts = ls.map((l) => statuses[l.id] ?? l.status);
          const working = sts.filter(isWorking).length;
          const planned = sts.length > 0 && sts.every((s) => s === 'planned');
          const first = t.lessonIds[0];
          const title = planned ? `${t.title}: ${t.blurb} (planned)` : `${t.title}: ${working} of ${sts.length} working`;
          return (
            <li key={t.id}>
              <Link
                to={`/lessons/${first}`}
                className="lesson-track"
                data-active={t.id === trackId ? 'true' : undefined}
                data-planned={planned ? 'true' : undefined}
                aria-current={t.id === trackId ? 'true' : undefined}
                title={title}
              >
                <span className="lesson-track-ico"><TrackIcon id={t.id} size={28} /></span>
                <span className="lesson-track-name">{t.title}</span>
                <StatusBar statuses={sts} />
                <span className="lesson-track-count">{working}/{sts.length}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NodeRail({ lesson }: { lesson: Lesson }) {
  const statuses = useAllStatuses();
  const track = TRACKS.find((t) => t.id === lesson.track);
  const ls = track ? lessonsInTrack(track.id) : [lesson];
  const curIdx = ls.findIndex((l) => l.id === lesson.id);
  return (
    <nav className="lesson-rail" aria-label="Lessons in this track">
      <ol>
        {ls.map((l, i) => {
          const st = statuses[l.id] ?? l.status;
          const current = l.id === lesson.id;
          const inner = (
            <>
              <span className="lesson-node">
                <LessonIcon id={l.id} size={current ? 46 : 38} />
                <span className="lesson-node-mark"><StatusMark status={st} size={14} decorative /></span>
              </span>
              <span className="lesson-node-id">{l.code}</span>
              <span className="lesson-node-name">{l.name}</span>
            </>
          );
          const name = `${l.code} ${l.name}, ${STATUS_LABEL[st]}`;
          return (
            <li key={l.id} data-current={current ? 'true' : undefined} data-before={i <= curIdx ? 'true' : undefined}>
              {st === 'planned' ? (
                <span className="lesson-node-link" aria-disabled="true" aria-label={name} role="link" title="Planned, not written yet">
                  {inner}
                </span>
              ) : (
                <Link to={`/lessons/${l.id}`} className="lesson-node-link" aria-label={name} aria-current={current ? 'page' : undefined}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ sections */

function Section({ id, tab, active, icon, children }: { id: string; tab: Tab; active: Tab; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="lesson-section" data-active={active === tab ? 'true' : undefined} aria-labelledby={`${id}-h`}>
      <span className="lesson-section-ico" aria-hidden="true">{icon}</span>
      {children}
    </section>
  );
}

function codeStats(lesson: Lesson): { files: number; lines: number } {
  return { files: lesson.files.length, lines: lesson.files.reduce((n, f) => n + f.text.replace(/\n$/, '').split('\n').length, 0) };
}

function isGnd(cell: string) {
  return cell.trim().toUpperCase() === 'GND';
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const calm = useCalm();
  const status = useLabStatus(lesson);
  const { ticks, toggle } = useTicks(lesson.id);
  const [, setLast] = useLastLesson();
  const track = TRACKS.find((t) => t.id === lesson.track)!;
  const trackLessons = lessonsInTrack(track.id);
  const planned = lesson.status === 'planned';

  useTitle(`${lesson.code} · ${lesson.name}`);
  useEffect(() => setLast(lesson.id), [lesson.id, setLast]);

  const hasWire = !!lesson.wire && lesson.wire.length > 0;
  const preview = lesson.preview;
  const hasPreview = !!(preview && (preview.boot.length || preview.engine || preview.commands?.length || preview.sketch?.length || preview.caption));
  const hasBoardPins = lesson.pins.length > 0 || !!lesson.usb;

  const tickedCount = ticks.filter(Boolean).length;
  const total = lesson.steps.length;
  const allTicked = total > 0 && tickedCount === total;

  /* LED state driving the board drawing */
  const [led, setLed] = useState<LedState | null>(() => (preview?.led ? initialLedState(preview.led) : null));
  const onLed = useCallback((s: LedState) => setLed(s), []);

  /* sub-tabs */
  const tabs = useMemo(() => {
    const t: { id: Tab; label: string; count?: string }[] = [{ id: 'goal', label: 'Goal' }];
    if (hasWire) t.push({ id: 'wire', label: 'Wire' });
    t.push({ id: 'steps', label: 'Steps', count: `${tickedCount}/${total}` });
    if (hasPreview) t.push({ id: 'preview', label: 'Preview' });
    t.push({ id: 'pinout', label: 'Pinout' });
    return t;
  }, [hasWire, hasPreview, tickedCount, total]);

  const urlTab = params.get('tab') as Tab | null;
  const [active, setActive] = useState<Tab>(urlTab && TAB_IDS.includes(urlTab) ? urlTab : 'goal');
  const subtabsRef = useRef<HTMLElement>(null);
  // Keep the active section chip visible when the chip row scrolls sideways (phones).
  useEffect(() => {
    const nav = subtabsRef.current;
    const chip = nav?.querySelector<HTMLElement>('[data-active="true"]');
    if (!nav || !chip || nav.scrollWidth <= nav.clientWidth) return;
    const left = chip.offsetLeft - nav.offsetLeft;
    if (left < nav.scrollLeft || left + chip.offsetWidth > nav.scrollLeft + nav.clientWidth - 24) nav.scrollLeft = Math.max(0, left - 16);
  }, [active]);
  const lockUntil = useRef(0);

  const scrollToTab = useCallback(
    (tab: Tab) => {
      const el = document.getElementById(SECTION_ID[tab]);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const sticky = tab === 'pinout' && window.innerWidth >= 1000 && r.top >= 0 && r.top < window.innerHeight * 0.6;
      if (sticky) return;
      el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    },
    [calm],
  );

  const pick = (tab: Tab) => {
    setActive(tab);
    lockUntil.current = performance.now() + 900;
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    setParams(next, { replace: true });
    scrollToTab(tab);
  };

  // open with ?tab=...: scroll there once layout has settled (Layout scrolls to top first)
  useEffect(() => {
    const t = params.get('tab') as Tab | null;
    if (!t || !TAB_IDS.includes(t) || t === 'goal') return;
    const timer = window.setTimeout(() => {
      lockUntil.current = performance.now() + 900;
      setActive(t);
      scrollToTab(t);
    }, 120);
    return () => window.clearTimeout(timer);
    // only on first mount for this lesson
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // scroll spy: the active tab is the last section whose top has passed the sticky bar
  useEffect(() => {
    if (planned) return;
    const order = tabs.filter((t) => t.id !== 'pinout').map((t) => t.id);
    let raf = 0;
    const compute = () => {
      raf = 0;
      if (performance.now() < lockUntil.current) return;
      let cur: Tab = order[0];
      for (const t of order) {
        const el = document.getElementById(SECTION_ID[t]);
        if (el && el.getBoundingClientRect().top <= 150) cur = t;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = order[order.length - 1];
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tabs, planned]);

  /* prev / next */
  const order = LESSONS.map((l) => l.id);
  const gi = order.indexOf(lesson.id);
  const prev = gi > 0 ? lessonById(order[gi - 1]) : undefined;
  const ti = TRACKS.findIndex((t) => t.id === track.id);
  const inTrack = trackLessons.findIndex((l) => l.id === lesson.id);
  const isTrackEnd = inTrack === trackLessons.length - 1;
  const nextTrack = isTrackEnd ? TRACKS[ti + 1] : undefined;
  const nextInTrack = !isTrackEnd ? trackLessons[inTrack + 1] : undefined;
  const nextTrackFirst = nextTrack ? lessonById(nextTrack.lessonIds[0]) : undefined;

  const { files, lines } = codeStats(lesson);
  const readStops = useStopsRead(lesson.id);
  const codeSub = files > 0 ? `${files} ${files === 1 ? 'file' : 'files'} · ${lines} lines · ${readStops > 0 ? `${readStops} ${readStops === 1 ? 'stop' : 'stops'} read` : 'guided tour'}` : 'guided tour · tap any line';

  /* section numbering */
  let n = 0;
  const num = () => pad2(++n);

  const goalBlock = (
    <header className="lesson-head">
      <div className="lesson-head-top">
        <div className="lesson-tile">
          <LessonIcon id={lesson.id} size={54} />
          <span className="lesson-tile-mark"><StatusMark status={status} size={18} /></span>
        </div>
        <div className="lesson-head-title">
          <p className="lesson-eyebrow">{track.title} · lesson {inTrack + 1} of {trackLessons.length}</p>
          <h1 id="lesson-goal-h">{lesson.title}</h1>
        </div>
        <div className="lesson-head-pill"><StatusPill status={status} /></div>
      </div>
      {lesson.pitch && <p className="lesson-pitch">{lesson.pitch}</p>}
    </header>
  );

  if (planned) {
    return (
      <div className="lesson" style={{ ['--track' as string]: TRACK_COLOR[track.id] }}>
        <TrackTabs trackId={track.id} />
        <NodeRail lesson={lesson} />
        <div className="lesson-main lesson-main-planned">
          {goalBlock}
          <p className="lesson-note lesson-note-muted">This lesson is planned, not written yet. The page will fill in when the lab exists.</p>
        </div>
        <div className="lesson-after">
          <Link className="ui-btn ui-btn-outline" to="/">Back to the labs map</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson" style={{ ['--track' as string]: TRACK_COLOR[track.id] }}>
      <TrackTabs trackId={track.id} />
      <NodeRail lesson={lesson} />

      <div className="lesson-viewbar">
        <Segmented
          ariaLabel="Lesson views"
          value="lab"
          options={[
            { value: 'lab', label: 'Do the lab', sub: 'wire · flash · check', icon: <IcoWire /> },
            { value: 'code', label: 'Read the code', sub: codeSub, icon: <IcoCode /> },
          ]}
          onChange={(v) => v === 'code' && navigate(`/lessons/${lesson.id}/code`)}
        />
        <nav ref={subtabsRef} className="lesson-subtabs" aria-label="On this page">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="lesson-subtab"
              data-active={active === t.id ? 'true' : undefined}
              aria-current={active === t.id ? 'true' : undefined}
              onClick={() => pick(t.id)}
            >
              {t.id === 'goal' && <IcoGoal />}
              {t.id === 'wire' && <IcoWire />}
              {t.id === 'steps' && <IcoSteps />}
              {t.id === 'preview' && <IcoPreview />}
              {t.id === 'pinout' && <IcoBoard />}
              <span>{t.label}</span>
              {t.count && <span className="lesson-subtab-count">{t.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="lesson-cols">
        <div className="lesson-main">
          <Section id="lesson-goal" tab="goal" active={active} icon={<IcoGoal />}>
            {goalBlock}

            {lesson.warnings && lesson.warnings.length > 0 && (
              <ul className="lesson-warnings" aria-label="Warnings">
                {lesson.warnings.map((w, i) => (
                  <li key={i}><RichText text={w} /></li>
                ))}
              </ul>
            )}

            {lesson.onBoard.length > 0 && (
              <div className="lesson-block">
                <MicroLabel as="p">On the board</MicroLabel>
                <div className="lesson-chips">
                  {lesson.onBoard.map((c) => (
                    <PinChip key={c.k + c.v} k={c.k} v={c.v} signal={c.signal !== false} />
                  ))}
                  {lesson.usb && <PinChip k="USB-C" v="COM port" signal={false} />}
                </div>
              </div>
            )}

            {lesson.learn.length > 0 && (
              <div className="lesson-block">
                <MicroLabel as="p">You will learn</MicroLabel>
                <div className="lesson-chips">
                  {lesson.learn.map((l) => (
                    <Chip key={l}>{l}</Chip>
                  ))}
                </div>
              </div>
            )}

            {lesson.command && (
              <div className="lesson-block">
                <CommandBox command={lesson.command} />
                <p className="lesson-small">
                  <RichText text={PIO_TERMINAL_NOTE} /> <RichText text={PATH_NOTE} />
                </p>
              </div>
            )}

            {lesson.labDir && (
              <p className="lesson-small lesson-tip-folder"><RichText text={OPEN_FOLDER_TIP} /></p>
            )}

            {lesson.scaffold && (
              <details className="lesson-scaffold">
                <summary>Create the files with PowerShell</summary>
                <CommandBox command={lesson.scaffold} />
              </details>
            )}

            {lesson.unverified && lesson.unverified.length > 0 && (
              <ul className="lesson-unverified" aria-label="Not confirmed yet">
                {lesson.unverified.map((u, i) => (
                  <li key={i}><RichText text={u} /></li>
                ))}
              </ul>
            )}

            <div className="lesson-progress">
              <div className="lesson-progress-bar" aria-hidden="true">
                <i style={{ width: total ? `${(tickedCount / total) * 100}%` : '0%' }} />
              </div>
              <span className="lesson-progress-text">
                {allTicked ? 'All steps ticked' : `${tickedCount} of ${total} ${total === 1 ? 'step' : 'steps'} ticked`}
              </span>
              <button type="button" className="lesson-progress-go" onClick={() => pick('steps')} aria-label="Jump to the steps">
                <IcoArrow />
              </button>
            </div>
          </Section>

          {hasWire && (
            <Section id="lesson-wire" tab="wire" active={active} icon={<IcoWire />}>
              <div id="lesson-wire-h"><SectionHeading n={num()} title="Wiring" /></div>
              <div className="lesson-tablewrap">
                <table className="lesson-table">
                  <thead>
                    <tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Notes</th></tr>
                  </thead>
                  <tbody>
                    {lesson.wire!.map((r, i) => (
                      <tr key={i} data-later={r.later ? 'true' : undefined}>
                        <td data-label="From">{isGnd(r.from) ? <span className="lesson-gnd">GND</span> : <RichText text={r.from} />}</td>
                        <td data-label="To">{isGnd(r.to) ? <span className="lesson-gnd">GND</span> : <RichText text={r.to} />}</td>
                        <td data-label="Notes"><RichText text={r.notes} />{r.later ? <em className="lesson-later"> (later)</em> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <Section id="lesson-steps" tab="steps" active={active} icon={<IcoSteps />}>
            <div id="lesson-steps-h"><SectionHeading n={num()} title="Steps" /></div>
            <ol className="lesson-steps">
              {lesson.steps.map((s, i) => (
                <li key={i} data-on={ticks[i] ? 'true' : undefined}>
                  <button
                    type="button"
                    className="lesson-tick"
                    aria-pressed={!!ticks[i]}
                    aria-describedby={`lesson-step-${i}`}
                    aria-label={`Step ${i + 1} of ${total}`}
                    onClick={() => toggle(i)}
                  >
                    {ticks[i] ? <IcoCheck /> : pad2(i + 1)}
                  </button>
                  <span id={`lesson-step-${i}`} className="lesson-step-text"><RichText text={s} /></span>
                </li>
              ))}
            </ol>
            <p className="lesson-status" aria-live="polite">
              {tickedCount} of {total} ticked. Ticks are saved in this browser.
            </p>
            {allTicked && <p className="lesson-complete" role="status">Every step ticked: this lesson is done. It now counts as done by you.</p>}
            {lesson.fallback && (
              <p className="lesson-note lesson-note-amber">
                <strong>{lesson.fallback.title}</strong> <RichText text={lesson.fallback.text} />
              </p>
            )}
            {lesson.tips.map((t, i) => (
              <p key={i} className="lesson-note"><RichText text={t} /></p>
            ))}
          </Section>

          {hasPreview && (
            <Section id="lesson-preview" tab="preview" active={active} icon={<IcoPreview />}>
              <div id="lesson-preview-h"><SectionHeading n={num()} title="Preview: what you should see" /></div>
              <div className="lesson-previewbox">
                <WiringSketch preview={preview} wire={lesson.wire} />
                <SerialMonitor preview={preview} onLed={onLed} />
                {preview.caption && <p className="lesson-caption">{preview.caption}</p>}
              </div>
            </Section>
          )}

          <div className="lesson-section lesson-extras">
            {lesson.extra?.map((x, i) => (
              <div key={i} className="lesson-extra">
                <h3>{x.title}</h3>
                <p><RichText text={x.body} /></p>
                {x.code && <CommandBox command={x.code.text} />}
              </div>
            ))}
          </div>
        </div>

        <aside className="lesson-aside" id="lesson-pinout" aria-label="Board pinout and between lessons">
          <Card title="Board pinout">
            {!hasBoardPins && <p className="lesson-small">This lesson uses no header pins.</p>}
            <LivePinout lesson={lesson} led={led} />
            <details className="lesson-between" open>
              <summary>Between lessons</summary>
              <ol>
                {BETWEEN_LESSONS.items.map((it, i) => (
                  <li key={i}><RichText text={it} /></li>
                ))}
              </ol>
              <p><RichText text={BETWEEN_LESSONS.warning} /></p>
            </details>
          </Card>
        </aside>
      </div>

      <div className="lesson-after">
        {isTrackEnd ? (
          nextTrack && nextTrackFirst ? (
            <Link className="lesson-banner" to={`/lessons/${nextTrackFirst.id}`} style={{ ['--track' as string]: TRACK_COLOR[nextTrack.id] }}>
              <span className="lesson-banner-ico"><TrackIcon id={nextTrack.id} size={46} /></span>
              <span className="lesson-banner-text">
                <span className="lesson-banner-eyebrow">End of this track · next track</span>
                <span className="lesson-banner-title">{nextTrack.title}</span>
              </span>
              <IcoArrow />
            </Link>
          ) : (
            <Link className="lesson-banner" to="/">
              <span className="lesson-banner-text">
                <span className="lesson-banner-eyebrow">That was the last lesson</span>
                <span className="lesson-banner-title">Back to the labs map</span>
              </span>
              <IcoArrow />
            </Link>
          )
        ) : (
          nextInTrack && (
            <Link className="lesson-banner" to={`/lessons/${nextInTrack.id}`} style={{ ['--track' as string]: TRACK_COLOR[nextInTrack.track] }}>
              <span className="lesson-banner-ico"><LessonIcon id={nextInTrack.id} size={46} /></span>
              <span className="lesson-banner-text">
                <span className="lesson-banner-eyebrow">Next lesson</span>
                <span className="lesson-banner-title"><b>{nextInTrack.code}</b>{nextInTrack.name}</span>
              </span>
              <IcoArrow />
            </Link>
          )
        )}
        <div className="lesson-after-row">
          {prev ? (
            <Link className="lesson-minor" to={`/lessons/${prev.id}`}>
              <span aria-hidden="true">←</span> {prev.code} {prev.name}
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="lesson-minor"
            onClick={() => window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' })}
          >
            <span aria-hidden="true">↑</span> Back to the top
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LessonPage() {
  const { id = '' } = useParams();
  const lesson = lessonById(id);
  useEffect(() => {
    if (!lesson) document.title = 'Lesson not found · ESP32 bench guide';
  }, [lesson]);
  if (!lesson) {
    return (
      <div className="lesson-missing">
        <MicroLabel as="p">Error</MicroLabel>
        <h1>Nothing on this pin.</h1>
        <p>No lesson called "{id}"</p>
        <p><Link to="/">Back to the labs</Link></p>
      </div>
    );
  }
  return <LessonView key={lesson.id} lesson={lesson} />;
}
