import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Depth, LabFile, Lesson, Tour, TourStop, Word } from '../content/types';
import { lessonById } from '../content/lessons';
import { hasTour, loadTour } from '../content/tours';
import { WORDS, wordById } from '../content/words';
import { CodeView } from '../components/CodeView';
import { RichText } from '../components/RichText';
import { Button, MicroLabel, Segmented } from '../components/ui';
import { findFunctions, highlightLines, splitLines, termAlternatives, type FnDef, type Token } from '../lib/highlight';
import { useTitle } from '../lib/useTitle';
import { useCodeProgress, useWordsMet, useTourStop } from '../state/progress';
import { useCalm, useSettings } from '../state/settings';
import NotFoundPage from './NotFoundPage';
import './CodeReaderPage.css';

const DEPTH_LABEL: Record<Depth, string> = { beginner: 'Beginner', explorer: 'Explorer', deep: 'Deep dive' };
const PACE_MS = { slow: 2500, normal: 1500, fast: 800 } as const;
const KIND_LABEL: Record<Word['kind'], string> = {
  keyword: 'keyword',
  type: 'type',
  function: 'function',
  macro: 'macro',
  concept: 'idea',
};
const KIND_GROUP: { kind: Word['kind']; title: string }[] = [
  { kind: 'macro', title: 'Preprocessor' },
  { kind: 'keyword', title: 'Keywords' },
  { kind: 'type', title: 'Kinds of values' },
  { kind: 'function', title: 'Functions' },
  { kind: 'concept', title: 'Ideas' },
];

type Panel = 'guide' | 'map' | 'words';
interface VisibleStop {
  stop: TourStop;
  /** index in the lesson's full tour (stable across depth levels; what progress stores) */
  full: number;
}
interface GuessState {
  picked?: number;
  revealed?: boolean;
}

const lineRange = (a: number, b: number) => (a === b ? `line ${a}` : `lines ${a}–${b}`);
const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/* ------------------------------------------------------------------ small pieces */

function Ico({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <span className="reader-ring" role="progressbar" aria-label="This lab's code you have read" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} title={`${percent}% of this lab's code read`}>
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r={r} className="reader-ring-track" />
        <circle cx="16" cy="16" r={r} className="reader-ring-fill" strokeDasharray={`${(c * percent) / 100} ${c}`} transform="rotate(-90 16 16)" />
      </svg>
      <span>{percent}</span>
    </span>
  );
}

function WordCard({ word, floating, deep, onClose }: { word: Word; floating?: boolean; deep: boolean; onClose: () => void }) {
  return (
    <section className="reader-word" data-floating={floating ? 'true' : undefined} aria-label={`Word: ${word.term}`}>
      <header>
        <code className="reader-word-term">{word.term}</code>
        <span className="reader-word-kind">{KIND_LABEL[word.kind]}</span>
        <button type="button" className="reader-x" aria-label="Close word" title="Close word" onClick={onClose}>
          <Ico d="M6 6l12 12M18 6L6 18" />
        </button>
      </header>
      <p className="reader-word-short"><RichText text={word.short} /></p>
      {word.long && <p className="reader-word-long"><RichText text={word.long} /></p>}
      {word.example && (
        <details open={deep}>
          <summary>The precise story</summary>
          <pre>{word.example}</pre>
        </details>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ analysis of a lab's files */

interface FileInfo {
  file: LabFile;
  lines: string[];
  tokens: Token[][];
  fns: FnDef[];
  /** non-empty line count */
  code: number;
}

function analyse(file: LabFile): FileInfo {
  const lines = splitLines(file.text);
  const tokens = highlightLines(file.text, file.lang);
  return { file, lines, tokens, fns: file.lang === 'cpp' ? findFunctions(lines, tokens) : [], code: lines.filter((l) => l.trim() !== '').length };
}

function wordsInFile(info: FileInfo, words: Word[]): Set<string> {
  const code = info.tokens.map((row) => row.filter((t) => t.cls !== 'com').map((t) => t.text).join('')).join('\n');
  const found = new Set<string>();
  for (const w of words) {
    for (const t of termAlternatives(w.term)) {
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`${/^\w/.test(t) ? '(?<!\\w)' : ''}${esc}${/\w$/.test(t) ? '(?!\\w)' : ''}`);
      if (re.test(code)) {
        found.add(w.id);
        break;
      }
    }
  }
  return found;
}

function wordsOnLine(text: string, words: Word[]): Word[] {
  return words.filter((w) =>
    termAlternatives(w.term).some((t) => {
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`${/^\w/.test(t) ? '(?<!\\w)' : ''}${esc}${/\w$/.test(t) ? '(?!\\w)' : ''}`).test(text.replace(/\/\/.*$/, ''));
    }),
  );
}

/* ------------------------------------------------------------------ page */

export default function CodeReaderPage() {
  const { id = '' } = useParams();
  const lesson = lessonById(id);
  useTitle(lesson ? `${lesson.code} code · ${lesson.name}` : 'Lesson not found');
  if (!lesson) return <NotFoundPage />;
  if (!lesson.files.some((f) => f.lang === 'cpp' || f.lang === 'ini' || f.lang === 'ts')) return <NoProgram lesson={lesson} />;
  return <TourGate key={lesson.id} lesson={lesson} />;
}

/** Loads this lesson's tour chunk, then shows the reader (no tour = reader without stops). */
function TourGate({ lesson }: { lesson: Lesson }) {
  const [state, setState] = useState<{ ready: boolean; tour?: Tour }>(() => ({ ready: !hasTour(lesson.id) }));
  useEffect(() => {
    if (!hasTour(lesson.id)) return;
    let live = true;
    loadTour(lesson.id).then(
      (tour) => live && setState({ ready: true, tour }),
      () => live && setState({ ready: true }),
    );
    return () => {
      live = false;
    };
  }, [lesson.id]);
  if (!state.ready) return <p className="reader-loading" role="status">Loading</p>;
  return <Reader lesson={lesson} tour={state.tour} />;
}

function NoProgram({ lesson }: { lesson: Lesson }) {
  return (
    <div className="reader">
      <h1 className="reader-title"><span>{lesson.code}</span> {lesson.title}</h1>
      <div className="reader-empty">
        <p>This lesson sets up your tools: there is no program for the board yet. The first code to read is in lesson 01.</p>
        <p className="reader-empty-actions">
          <Link className="ui-btn ui-btn-primary" to="/lessons/01/code">Read the code in lesson 01</Link>
          <Link className="ui-btn ui-btn-outline" to={`/lessons/${lesson.id}`}>Back to the lab</Link>
        </p>
      </div>
    </div>
  );
}

function Reader({ lesson, tour }: { lesson: Lesson; tour: Tour | undefined }) {
  const navigate = useNavigate();
  const [settings, update] = useSettings();
  const calm = useCalm();
  const { met, meet } = useWordsMet();
  const { progress, markStop } = useCodeProgress(lesson.id);
  const [storedStop, setStoredStop] = useTourStop(lesson.id);
  const files = lesson.files;
  const infos = useMemo(() => files.map(analyse), [files]);
  const simple = settings.readerView === 'simple';
  const deep = settings.depth === 'deep';

  /* tour stops for the current depth */
  const visible = useMemo<VisibleStop[]>(
    () =>
      (tour?.stops ?? [])
        .map((stop, full) => ({ stop, full }))
        .filter((v) => !v.stop.levels || v.stop.levels.includes(settings.depth)),
    [tour, settings.depth],
  );
  const hasTour = visible.length > 0;
  const idx = hasTour ? Math.max(0, Math.min(visible.length - 1, storedStop)) : 0;
  const cur = hasTour ? visible[idx] : undefined;
  const stop = cur?.stop;

  /* view state */
  const [finished, setFinished] = useState(false);
  const [viewFile, setViewFile] = useState<string | null>(null);
  const [jump, setJump] = useState<{ file: string; line: number } | null>(null);
  const [panel, setPanel] = useState<Panel>('guide');
  const [pinned, setPinned] = useState<string | null>(null);
  const [guess, setGuess] = useState<Record<number, GuessState>>({});
  const [focus, setFocus] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lbl, setLbl] = useState<{ open: boolean; playing: boolean; idx: number }>({ open: false, playing: false, idx: 0 });
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'file' | 'all'>('file');
  const sideRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  // As on the reference site: arriving at the top of the page brings the reader itself into view.
  useEffect(() => {
    if (window.scrollY < 8 && !window.location.hash.includes('#line')) appRef.current?.scrollIntoView({ block: 'start' });
  }, []);
  const pickerRef = useRef<HTMLDivElement>(null);

  const activePath = viewFile ?? stop?.file ?? (files.find((f) => f.path === 'src/main.cpp') ?? files[0]).path;
  const info = infos.find((i) => i.file.path === activePath) ?? infos[0];
  const file = info.file;
  const range: [number, number] | null = stop && !finished && stop.file === file.path ? stop.lines : null;

  const stopLines = useMemo(() => {
    if (!stop) return [] as number[];
    const inf = infos.find((i) => i.file.path === stop.file);
    const out: number[] = [];
    for (let n = stop.lines[0]; n <= stop.lines[1]; n++) if ((inf?.lines[n - 1] ?? '').trim() !== '') out.push(n);
    return out;
  }, [stop, infos]);
  const lblLine = lbl.open && !finished ? stopLines[Math.min(lbl.idx, stopLines.length - 1)] : undefined;
  const current = lblLine ?? (jump && jump.file === file.path ? jump.line : null);

  /* words */
  const wordsMetCount = useMemo(() => WORDS.filter((w) => met.has(w.id)).length, [met]);
  const fileWords = useMemo(() => wordsInFile(info, WORDS), [info]);
  const tourWordIds = useMemo(() => new Set(visible.filter((v) => v.stop.file === file.path).flatMap((v) => v.stop.words ?? [])), [visible, file.path]);
  const stopWords = useMemo(() => (stop?.words ?? []).map((w) => wordById(w)).filter((w): w is Word => !!w), [stop]);
  const pinnedWord = pinned ? wordById(pinned) : undefined;
  const pending = settings.cppHints === 'pop' && !finished ? stopWords.filter((w) => !met.has(w.id)) : [];
  const toast = pending[0];

  /* navigation */
  const go = useCallback(
    (i: number) => {
      setStoredStop(i);
      setFinished(false);
      setViewFile(null);
      setJump(null);
      setLbl({ open: false, playing: false, idx: 0 });
    },
    [setStoredStop],
  );

  const openWord = useCallback(
    (w: Word) => {
      meet(w.id);
      setPinned(w.id);
      if (!simple) setPanel('words');
      if (window.innerWidth < 900) window.setTimeout(() => sideRef.current?.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' }), 30);
    },
    [meet, simple, calm],
  );

  const jumpTo = useCallback((path: string, line: number) => {
    setViewFile(path);
    setJump({ file: path, line });
    setLbl((l) => ({ ...l, open: false, playing: false }));
  }, []);

  /* a visited stop counts as read */
  useEffect(() => {
    if (cur && !finished) markStop(cur.full, cur.stop.file, cur.stop.lines[0], cur.stop.lines[1]);
  }, [cur?.full, finished]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    sideRef.current?.scrollTo({ top: 0 });
  }, [cur?.full, finished]);

  /* dev-time anchor drift check */
  useEffect(() => {
    if (!import.meta.env.DEV || !tour) return;
    tour.stops.forEach((s, i) => {
      const inf = infos.find((x) => x.file.path === s.file);
      const first = inf?.lines[s.lines[0] - 1];
      if (first === undefined || !first.includes(s.anchor)) {
        console.warn(`[code reader] tour ${lesson.id} stop ${i + 1} "${s.title}": anchor ${JSON.stringify(s.anchor)} not found on ${s.file}:${s.lines[0]} (found ${JSON.stringify(first)}). The code has drifted from the tour.`);
      }
    });
  }, [tour, infos, lesson.id]);

  /* line-by-line autoplay (never under Calm) */
  useEffect(() => {
    if (!lbl.playing || calm) return;
    const t = window.setInterval(() => {
      setLbl((p) => (p.idx >= stopLines.length - 1 ? { ...p, playing: false } : { ...p, idx: p.idx + 1 }));
    }, PACE_MS[settings.pace]);
    return () => window.clearInterval(t);
  }, [lbl.playing, calm, settings.pace, stopLines.length]);

  /* focus mode: Esc leaves, page behind does not scroll */
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pickerOpen) setFocus(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [focus, pickerOpen]);

  /* file picker: outside click / Esc closes */
  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen]);

  /* progress ring */
  const totalCode = infos.reduce((n, i) => n + i.code, 0);
  const readCode = infos.reduce((n, i) => {
    const read = new Set(progress.lines[i.file.path] ?? []);
    let c = 0;
    read.forEach((ln) => {
      if ((i.lines[ln - 1] ?? '').trim() !== '') c++;
    });
    return n + c;
  }, 0);
  const percent = totalCode ? pct((readCode / totalCode) * 100) : 0;

  /* per-file stop counts */
  const stopsIn = (path: string) => visible.filter((v) => v.stop.file === path);

  /* end of the current file's stops */
  const nextInFile = cur && visible[idx + 1] && visible[idx + 1].stop.file === cur.stop.file;
  const lastInFile = !!cur && !nextInFile;
  const fileOrder = files.map((f) => f.path);
  const nextFilePath = stop ? fileOrder.slice(fileOrder.indexOf(stop.file) + 1).find((p) => stopsIn(p).length > 0) : undefined;
  const firstStopOf = (path: string) => visible.findIndex((v) => v.stop.file === path);

  const pickFile = (path: string) => {
    setPickerOpen(false);
    const first = firstStopOf(path);
    if (first >= 0) go(first);
    else {
      setViewFile(path);
      setJump(null);
      setFinished(false);
    }
  };

  const onLine = (n: number) => {
    const hit = visible.findIndex((v) => v.stop.file === file.path && n >= v.stop.lines[0] && n <= v.stop.lines[1]);
    if (hit >= 0 && hit !== idx) go(hit);
    else setJump((j) => (j && j.file === file.path && j.line === n ? null : { file: file.path, line: n }));
  };

  const onNext = () => {
    if (finished) {
      if (nextFilePath) go(firstStopOf(nextFilePath));
    } else if (lastInFile) setFinished(true);
    else go(idx + 1);
  };
  const onBack = () => {
    if (finished) setFinished(false);
    else if (idx > 0) go(idx - 1);
  };

  /* guess first */
  const gState = cur ? guess[cur.full] ?? {} : {};
  const setG = (patch: GuessState) => cur && setGuess((g) => ({ ...g, [cur.full]: { ...g[cur.full], ...patch } }));
  const guessActive = !!(settings.guessFirst && stop?.guess && !gState.revealed);

  /* ---------------------------------------------------------------- guide card */
  const guideBody = (() => {
    if (!hasTour || !stop) {
      return (
        <p className="reader-note">No guided tour for this lab yet. The code is here with line numbers, a map and word cards; click a line or an underlined word.</p>
      );
    }
    if (finished) {
      return (
        <div className="reader-end">
          <MicroLabel as="p">Tour done</MicroLabel>
          <h2 className="reader-stop-title">You read {stop.file}</h2>
          <p className="reader-text">You have walked through {readCode} of the {totalCode} lines of this lab&rsquo;s own code.</p>
          <div className="reader-end-actions">
            {nextFilePath && (
              <Button variant="primary" onClick={() => go(firstStopOf(nextFilePath))}>Next file: {nextFilePath} →</Button>
            )}
            <Link className="ui-btn ui-btn-outline" to={`/lessons/${lesson.id}`}>Back to the lab</Link>
          </div>
        </div>
      );
    }
    const g = stop.guess;
    const picked = g?.options && gState.picked !== undefined ? g.options[gState.picked] : undefined;
    return (
      <>
        <MicroLabel as="p">
          Stop {idx + 1} of {visible.length} · {lineRange(stop.lines[0], stop.lines[1])}
        </MicroLabel>
        <h2 className="reader-stop-title">{stop.title}</h2>

        {guessActive && g && (
          <div className="reader-guess" data-result={picked ? (picked.right ? 'right' : 'wrong') : undefined}>
            <p className="reader-guess-q">
              <span className="reader-tag">{g.options ? 'Guess first' : 'Your turn'}</span> {g.options ? <RichText text={g.question} /> : <>Read the lit lines first. <RichText text={g.question} /></>}
            </p>
            {g.options ? (
              <>
                <div className="reader-options">
                  {g.options.map((o, i) => (
                    <button
                      key={i}
                      type="button"
                      className="reader-option"
                      data-state={picked ? (i === gState.picked ? (o.right ? 'right' : 'wrong') : o.right ? 'right' : undefined) : undefined}
                      disabled={!!picked}
                      onClick={() => setG({ picked: i })}
                    >
                      <RichText text={o.text} />
                    </button>
                  ))}
                </div>
                {picked ? (
                  <div className="reader-verdict">
                    <p><strong>{picked.right ? 'Yes, well spotted.' : 'Not quite.'}</strong></p>
                    {(picked.why ?? (picked.right ? undefined : undefined)) && <p><RichText text={picked.why!} /></p>}
                    <Button variant="primary" onClick={() => setG({ revealed: true })}>Read the explanation</Button>
                  </div>
                ) : (
                  <button type="button" className="reader-skip" onClick={() => setG({ revealed: true })}>Skip the guess</button>
                )}
              </>
            ) : (
              <Button variant="primary" onClick={() => setG({ revealed: true })}>Show me</Button>
            )}
          </div>
        )}

        {!guessActive && (
          <div className="reader-text-block">
            {g && settings.guessFirst && gState.revealed && (
              <p className="reader-answer"><MicroLabel>The answer</MicroLabel> <RichText text={g.answer} /></p>
            )}
            {deep && <MicroLabel as="p">The precise story</MicroLabel>}
            <p className="reader-text"><RichText text={stop.text[settings.depth]} /></p>
          </div>
        )}

        {!simple && stopWords.length > 0 && (
          <div className="reader-words-here">
            <MicroLabel as="p">New words here</MicroLabel>
            <div className="reader-chips">
              {stopWords.map((w) => (
                <button key={w.id} type="button" className="reader-chip" onClick={() => openWord(w)}>{w.term}</button>
              ))}
            </div>
          </div>
        )}

        {!simple && stopLines.length > 0 && (
          <div className="reader-lbl">
            {!lbl.open ? (
              <button type="button" className="reader-lbl-open" onClick={() => setLbl({ open: true, playing: !calm, idx: 0 })}>
                <span aria-hidden="true">▶</span> Line by line ({stopLines.length})
              </button>
            ) : (
              <>
                <div className="reader-lbl-bar">
                  <button type="button" className="reader-iconbtn" aria-label="Previous line" title="Previous line" disabled={lbl.idx <= 0} onClick={() => setLbl((l) => ({ ...l, playing: false, idx: Math.max(0, l.idx - 1) }))}>
                    <Ico d="M12 19V5M6 11l6-6 6 6" />
                  </button>
                  {!calm && (
                    <button type="button" className="reader-iconbtn reader-play" onClick={() => setLbl((l) => ({ ...l, playing: !l.playing, idx: !l.playing && l.idx >= stopLines.length - 1 ? 0 : l.idx }))}>
                      {lbl.playing ? <><span aria-hidden="true">❚❚</span> Pause</> : <><span aria-hidden="true">▶</span> Play</>}
                    </button>
                  )}
                  <button type="button" className="reader-iconbtn" aria-label="Next line" title="Next line" disabled={lbl.idx >= stopLines.length - 1} onClick={() => setLbl((l) => ({ ...l, playing: false, idx: Math.min(stopLines.length - 1, l.idx + 1) }))}>
                    <Ico d="M12 5v14M6 13l6 6 6-6" />
                  </button>
                  <span className="reader-lbl-n">line {lblLine}</span>
                  <button type="button" className="reader-lbl-close" onClick={() => setLbl({ open: false, playing: false, idx: 0 })}>Hide</button>
                </div>
                {lblLine !== undefined && (
                  <div className="reader-lens" aria-live="polite">
                    <code>{(infos.find((i) => i.file.path === stop.file)?.lines[lblLine - 1] ?? '').trim()}</code>
                    <div className="reader-chips">
                      {wordsOnLine(infos.find((i) => i.file.path === stop.file)?.lines[lblLine - 1] ?? '', WORDS).slice(0, 4).map((w) => (
                        <button key={w.id} type="button" className="reader-chip" onClick={() => openWord(w)}>{w.term}</button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </>
    );
  })();

  /* ---------------------------------------------------------------- map tab */
  const allFns = infos.flatMap((i) => i.fns.map((f) => ({ ...f, path: i.file.path })));
  const setupFn = allFns.find((f) => f.name === 'setup');
  const loopFn = allFns.find((f) => f.name === 'loop');
  const calls = (fn?: (typeof allFns)[number]) => {
    if (!fn) return [] as typeof allFns;
    const inf = infos.find((i) => i.file.path === fn.path)!;
    const body = inf.lines.slice(fn.line, fn.line + fn.length - 1).join('\n');
    return allFns.filter((f) => f.name !== fn.name && f.name !== 'setup' && f.name !== 'loop' && new RegExp(`\\b${f.name}\\s*\\(`).test(body));
  };
  const mapPanel = (
    <div className="reader-map">
      {setupFn && loopFn && (
        <>
          <MicroLabel as="p">How it runs</MicroLabel>
          <div className="reader-run">
            <button type="button" className="reader-run-head" onClick={() => jumpTo(setupFn.path, setupFn.line)}>
              <strong>setup()</strong> <span>once, at power-up</span>
            </button>
            <div className="reader-chips">
              {calls(setupFn).map((f) => (
                <button key={f.name} type="button" className="reader-chip" onClick={() => jumpTo(f.path, f.line)}>{f.name}()</button>
              ))}
            </div>
          </div>
          <span className="reader-run-arrow" aria-hidden="true">↓</span>
          <div className="reader-run" data-loop="true">
            <button type="button" className="reader-run-head" onClick={() => jumpTo(loopFn.path, loopFn.line)}>
              <strong>loop()</strong> <span><span aria-hidden="true">↻</span> forever, thousands of times a second</span>
            </button>
            <div className="reader-chips">
              {calls(loopFn).map((f) => (
                <button key={f.name} type="button" className="reader-chip" onClick={() => jumpTo(f.path, f.line)}>{f.name}()</button>
              ))}
            </div>
          </div>
        </>
      )}
      <MicroLabel as="p">In {file.path}</MicroLabel>
      {info.fns.length === 0 ? (
        <p className="reader-note">No functions here: just settings and includes.</p>
      ) : (
        <ul className="reader-fnlist">
          {info.fns.map((f) => (
            <li key={f.name + f.line}>
              <button type="button" onClick={() => jumpTo(file.path, f.line)}>
                <span className="reader-kindtag">function</span>
                <span className="reader-fn-name">{f.name}()</span>
                <span className="reader-fn-meta">line {f.line} · {f.length} {f.length === 1 ? 'line' : 'lines'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- words tab */
  const q = query.trim().toLowerCase();
  const listed = WORDS.filter((w) => {
    if (scope === 'file' && !fileWords.has(w.id) && !tourWordIds.has(w.id)) return false;
    return !q || w.term.toLowerCase().includes(q) || w.id.toLowerCase().includes(q) || w.short.toLowerCase().includes(q);
  });
  const wordsPanel = (
    <div className="reader-wordspane">
      <p className="reader-count">
        <strong>{wordsMetCount}</strong> of {WORDS.length} words met
        <span className="reader-bar" aria-hidden="true"><span style={{ width: `${WORDS.length ? (wordsMetCount / WORDS.length) * 100 : 0}%` }} /></span>
      </p>
      {pinnedWord && <WordCard word={pinnedWord} deep={deep} onClose={() => setPinned(null)} />}
      <div className="reader-find">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a word" aria-label="Find a word" />
        <div className="reader-scope" role="group" aria-label="Which words">
          <button type="button" aria-pressed={scope === 'file'} onClick={() => setScope('file')}>In this file</button>
          <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>All</button>
        </div>
      </div>
      {listed.length === 0 ? (
        <p className="reader-note">No words match.</p>
      ) : (
        KIND_GROUP.map((g) => {
          const items = listed.filter((w) => w.kind === g.kind);
          if (items.length === 0) return null;
          return (
            <div key={g.kind} className="reader-group">
              <h3>{g.title}</h3>
              <div className="reader-chips">
                {items.map((w) => (
                  <button key={w.id} type="button" className="reader-chip" data-met={met.has(w.id) ? 'true' : undefined} aria-pressed={pinned === w.id} onClick={() => openWord(w)}>
                    {w.term}
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  /* ---------------------------------------------------------------- bottom bar */
  const nextLabel = finished ? (nextFilePath ? 'Next file →' : 'All done') : lastInFile ? 'Finish' : 'Next →';
  const bar = hasTour && stop && (
    <div className="reader-bar-bottom">
      <Button variant="outline" className="reader-nav" disabled={!finished && idx === 0} onClick={onBack}>← Back</Button>
      {simple ? (
        <span className="reader-stopno">Stop {idx + 1} of {visible.length}</span>
      ) : (
        <ol className="reader-dots" aria-label="Stops">
          {visible.map((v, i) => (
            <li key={v.full}>
              <button
                type="button"
                className="reader-dot"
                data-current={i === idx && !finished ? 'true' : undefined}
                data-read={progress.stops.includes(v.full) ? 'true' : undefined}
                aria-label={`Stop ${i + 1}: ${v.stop.title}`}
                aria-current={i === idx && !finished ? 'step' : undefined}
                title={`Stop ${i + 1}: ${v.stop.title}`}
                onClick={() => go(i)}
              />
            </li>
          ))}
        </ol>
      )}
      <Button variant="primary" className="reader-nav" disabled={finished && !nextFilePath} onClick={onNext}>{nextLabel}</Button>
    </div>
  );

  const sub = progress.stops.length > 0 ? `${progress.stops.length} ${progress.stops.length === 1 ? 'stop' : 'stops'} read` : 'guided tour';

  return (
    <div className="reader">
      <h1 className="reader-title"><span>{lesson.code}</span> {lesson.title}</h1>
      <div className="reader-viewbar">
        <Segmented
          ariaLabel="Lesson views"
          value="code"
          options={[
            { value: 'lab', label: 'Do the lab', sub: 'wire · flash · check', icon: <Ico d="M8 17c6 0 2-10 8-10M6 18m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M18 6m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0" size={16} /> },
            { value: 'code', label: 'Read the code', sub, icon: <Ico d="M8 7l-5 5 5 5M16 7l5 5-5 5" size={16} /> },
          ]}
          onChange={(v) => v === 'lab' && navigate(`/lessons/${lesson.id}`)}
        />
      </div>

      <div ref={appRef} className="reader-app" data-focus={focus ? 'true' : undefined} data-view={simple ? 'simple' : 'full'}>
        {/* toolbar */}
        <div className="reader-toolbar">
          <Link className="reader-tb reader-back" to={`/lessons/${lesson.id}`} aria-label="Back to the lab">
            <span aria-hidden="true">←</span> <span className="reader-back-long">Back to the </span>lab
          </Link>

          {simple && <span className="reader-file-plain">{file.path}</span>}
          {!simple && (
            <div className="reader-picker" ref={pickerRef}>
              <button type="button" className="reader-tb reader-file" aria-haspopup="listbox" aria-expanded={pickerOpen} aria-label={`Files: ${file.path}, ${files.indexOf(file) + 1} of ${files.length}`} onClick={() => setPickerOpen((o) => !o)}>
                <span aria-hidden="true" className="reader-file-ico">▤</span>
                <b>{file.path}</b>
                <span className="reader-file-pos">{files.indexOf(file) + 1}/{files.length}</span>
                <span aria-hidden="true">{pickerOpen ? '▴' : '▾'}</span>
              </button>
              {pickerOpen && (
                <div className="reader-pop" role="listbox" aria-label="Files">
                  <MicroLabel as="p">This lab</MicroLabel>
                  {infos.map((i) => {
                    const st = stopsIn(i.file.path);
                    const done = st.filter((v) => progress.stops.includes(v.full)).length;
                    return (
                      <button key={i.file.path} type="button" role="option" aria-selected={i.file.path === file.path} className="reader-pop-item" onClick={() => pickFile(i.file.path)}>
                        <span className="reader-pop-name">{i.file.path}</span>
                        <span className="reader-pop-meta">
                          {i.lines.length} lines{st.length > 0 ? ` · ${done}/${st.length} stops` : ''}
                        </span>
                        {st.length > 0 && <span className="reader-bar" aria-hidden="true"><span style={{ width: `${(done / st.length) * 100}%` }} /></span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="reader-mode" role="group" aria-label="Reader mode">
            <button type="button" aria-pressed="true" title="File by file, a few lines at a time">Tour</button>
          </div>

          <div className="reader-tools">
            {!simple && <Ring percent={percent} />}
            {!simple && (
              <Link className="reader-tb reader-level" to="/settings" title="Change the level in Settings">
                {DEPTH_LABEL[settings.depth]}
              </Link>
            )}
            <button type="button" className="reader-tb" title={simple ? 'Show every tool: files, map, words, progress' : 'Fewer controls: one card, one button'} onClick={() => update({ readerView: simple ? 'full' : 'simple' })}>
              {simple ? 'More tools' : 'Simple view'}
            </button>
            <button type="button" className="reader-tb" title="Focus: the code fills the screen (Esc to leave)" onClick={() => setFocus((f) => !f)}>
              <Ico d={focus ? 'M6 6l12 12M18 6L6 18' : 'M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7'} size={13} /> {focus ? 'Exit focus' : 'Focus'}
            </button>
          </div>
        </div>

        {/* code + explanation */}
        <div className="reader-body">
          <div className="reader-codewrap">
            <CodeView
              file={file}
              range={range}
              current={current}
              words={WORDS}
              metIds={met}
              onWord={openWord}
              onLine={onLine}
              className="reader-code"
            />
            {simple && pinnedWord ? (
              <div className="reader-float"><WordCard word={pinnedWord} floating deep={deep} onClose={() => setPinned(null)} /></div>
            ) : (
              toast && (
                <aside className="reader-float reader-toast" role="status" aria-label="New word">
                  <p><span className="reader-tag">New word</span> <code>{toast.term}</code></p>
                  <p className="reader-toast-short"><RichText text={toast.short} /></p>
                  <div className="reader-toast-actions">
                    <button type="button" className="ui-btn ui-btn-primary reader-sm" onClick={() => meet(toast.id)}>Got it</button>
                    <button type="button" className="ui-btn ui-btn-outline reader-sm" onClick={() => openWord(toast)}>Tell me more</button>
                  </div>
                </aside>
              )
            )}
          </div>

          <aside className="reader-side" aria-label="Explanation" ref={sideRef}>
            {simple ? (
              <div className="reader-card">
                <MicroLabel as="p">Explanation</MicroLabel>
                <div className="reader-guide">{guideBody}</div>
              </div>
            ) : (
              <>
                <div className="reader-tabs" role="tablist" aria-label="Explanation">
                  {(['guide', 'map', 'words'] as Panel[]).map((p) => (
                    <button key={p} type="button" role="tab" id={`reader-tab-${p}`} aria-selected={panel === p} aria-controls="reader-panel" onClick={() => setPanel(p)}>
                      {p === 'guide' ? 'Guide' : p === 'map' ? 'Map' : 'Words'}
                    </button>
                  ))}
                </div>
                <div className="reader-panel" id="reader-panel" role="tabpanel" aria-labelledby={`reader-tab-${panel}`}>
                  {panel === 'guide' && <div className="reader-guide">{guideBody}</div>}
                  {panel === 'map' && mapPanel}
                  {panel === 'words' && wordsPanel}
                </div>
              </>
            )}
          </aside>
        </div>

        {bar}
      </div>
    </div>
  );
}
