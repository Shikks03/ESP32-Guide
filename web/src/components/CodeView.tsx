import { Fragment, memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { LabFile, Word } from '../content/types';
import { findFoldRuns, highlightLines, splitLines, termAlternatives, type Token, type TokCls } from '../lib/highlight';
import { useCalm, useSettings } from '../state/settings';
import './CodeView.css';

export interface CodeViewProps {
  file: LabFile;
  /** Highlighted line range (tour stop), 1-based inclusive. Everything else is dimmed. */
  range?: [number, number] | null;
  /** One extra marked line (line-by-line player, map jumps). */
  current?: number | null;
  /** Words that become dotted-underline buttons. */
  words?: Word[];
  /** Word ids already met (new, unmet words carry a small dot). */
  metIds?: ReadonlySet<string>;
  onWord?: (word: Word) => void;
  /** Called with the 1-based line number when a line (or its gutter number) is clicked. */
  onLine?: (line: number) => void;
  className?: string;
}

const SIZE_PX = { sm: 12.5, md: 14, lg: 16 } as const;

interface Piece {
  text: string;
  cls: TokCls;
  m: number; // match index, -1 = none
}

function buildMatcher(words: Word[]) {
  const byTerm = new Map<string, Word>();
  for (const w of words) {
    for (const t of termAlternatives(w.term)) if (!byTerm.has(t)) byTerm.set(t, w);
  }
  if (byTerm.size === 0) return null;
  const terms = [...byTerm.keys()].sort((a, b) => b.length - a.length);
  const src = terms
    .map((t) => {
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return `${/^\w/.test(t) ? '(?<!\\w)' : ''}${esc}${/\w$/.test(t) ? '(?!\\w)' : ''}`;
    })
    .join('|');
  return { re: new RegExp(src, 'g'), byTerm };
}

/** Slice tokens into pieces and tag the ones that belong to a word match. */
function pieces(tokens: Token[], matcher: ReturnType<typeof buildMatcher>) {
  const line = tokens.map((t) => t.text).join('');
  const matches: { s: number; e: number; word: Word }[] = [];
  if (matcher && line) {
    // character offsets where a match may start: not inside comments or strings
    const blocked = new Array<boolean>(line.length).fill(false);
    let off = 0;
    for (const t of tokens) {
      if (t.cls === 'com' || t.cls === 'str') for (let k = 0; k < t.text.length; k++) blocked[off + k] = true;
      off += t.text.length;
    }
    matcher.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = matcher.re.exec(line))) {
      if (m[0] === '') {
        matcher.re.lastIndex++;
        continue;
      }
      if (blocked[m.index]) continue;
      const word = matcher.byTerm.get(m[0]);
      if (word) matches.push({ s: m.index, e: m.index + m[0].length, word });
    }
  }
  const out: Piece[] = [];
  let off = 0;
  for (const t of tokens) {
    let a = off;
    const end = off + t.text.length;
    while (a < end) {
      const hit = matches.findIndex((x) => x.s < end && x.e > a);
      if (hit < 0) {
        out.push({ text: line.slice(a, end), cls: t.cls, m: -1 });
        break;
      }
      const x = matches[hit];
      if (x.s > a) out.push({ text: line.slice(a, x.s), cls: t.cls, m: -1 });
      const b = Math.min(end, x.e);
      out.push({ text: line.slice(Math.max(a, x.s), b), cls: t.cls, m: hit });
      a = b;
    }
    off = end;
  }
  return { out, matches };
}

function Line({
  n,
  tokens,
  matcher,
  spot,
  dim,
  current,
  showNum,
  metIds,
  onWord,
  onLine,
  setRef,
}: {
  n: number;
  tokens: Token[];
  matcher: ReturnType<typeof buildMatcher>;
  spot: boolean;
  dim: boolean;
  current: boolean;
  showNum: boolean;
  metIds?: ReadonlySet<string>;
  onWord?: (w: Word) => void;
  onLine?: (n: number) => void;
  setRef: (n: number, el: HTMLDivElement | null) => void;
}) {
  const { out, matches } = useMemo(() => pieces(tokens, matcher), [tokens, matcher]);
  const nodes: JSX.Element[] = [];
  for (let i = 0; i < out.length; i++) {
    const p = out[i];
    if (p.m < 0) {
      nodes.push(p.cls ? <span key={i} className={`ui-syn-${p.cls}`}>{p.text}</span> : <Fragment key={i}>{p.text}</Fragment>);
      continue;
    }
    let j = i;
    const inner: JSX.Element[] = [];
    while (j < out.length && out[j].m === p.m) {
      const q = out[j];
      inner.push(q.cls ? <span key={j} className={`ui-syn-${q.cls}`}>{q.text}</span> : <Fragment key={j}>{q.text}</Fragment>);
      j++;
    }
    const w = matches[p.m].word;
    nodes.push(
      <button
        key={i}
        type="button"
        className="ui-code-word"
        data-new={metIds && !metIds.has(w.id) ? 'true' : undefined}
        title={`${w.term}: ${w.short.replace(/[`*]/g, '')}`}
        onClick={(e) => {
          e.stopPropagation();
          onWord?.(w);
        }}
      >
        {inner}
      </button>,
    );
    i = j - 1;
  }
  return (
    <div
      ref={(el) => setRef(n, el)}
      className="ui-code-line"
      data-spot={spot ? 'true' : undefined}
      data-dim={dim ? 'true' : undefined}
      data-current={current ? 'true' : undefined}
      onClick={onLine ? () => onLine(n) : undefined}
    >
      {showNum && (
        <button
          type="button"
          className="ui-code-num"
          aria-label={`Line ${n}`}
          tabIndex={onLine ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation();
            onLine?.(n);
          }}
        >
          {n}
        </button>
      )}
      <span className="ui-code-text">{nodes.length ? nodes : '​'}</span>
    </div>
  );
}

const LineMemo = memo(Line);

export function CodeView({ file, range, current, words, metIds, onWord, onLine, className }: CodeViewProps) {
  const [s] = useSettings();
  const calm = useCalm();
  const paneRef = useRef<HTMLDivElement>(null);
  const lineEls = useRef<Record<number, HTMLDivElement | null>>({});
  const setRef = useRef((n: number, el: HTMLDivElement | null) => {
    lineEls.current[n] = el;
  }).current;

  const lines = useMemo(() => splitLines(file.text), [file.text]);
  const tokens = useMemo(() => highlightLines(file.text, file.lang), [file.text, file.lang]);
  const showWords = s.cppHints !== 'off' && !!words && words.length > 0;
  const matcher = useMemo(() => (showWords ? buildMatcher(words!) : null), [showWords, words]);
  const runs = useMemo(() => (s.foldData ? findFoldRuns(lines) : []), [s.foldData, lines]);
  const [open, setOpen] = useState<{ path: string; starts: number[] }>({ path: file.path, starts: [] });
  const opened = open.path === file.path ? open.starts : [];

  const [ra, rb] = range ?? [0, 0];

  // scroll the highlighted range (or the current line) into view; instant under Calm
  const first = useRef(true);
  useLayoutEffect(() => {
    const pane = paneRef.current;
    const target = lineEls.current[ra || current || 0];
    if (!pane || !target) return;
    const pr = pane.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const behavior = calm || first.current ? 'auto' : 'smooth';
    first.current = false;
    const rel = tr.top - pr.top;
    if (range) {
      // bring the start of the range to about a fifth of the way down
      pane.scrollTo({ top: Math.max(0, pane.scrollTop + rel - pane.clientHeight * 0.2), left: 0, behavior });
    } else if (rel < 24 || rel > pane.clientHeight - 60) {
      pane.scrollTo({ top: Math.max(0, pane.scrollTop + rel - pane.clientHeight * 0.4), left: 0, behavior });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.path, ra, rb, current, calm]);

  const rows: JSX.Element[] = [];
  let n = 1;
  while (n <= lines.length) {
    const run = runs.find((r) => r.start === n);
    const keepOpen =
      run && (opened.includes(run.start) || (ra && ra <= run.end && rb >= run.start) || (current && current >= run.start && current <= run.end));
    if (run && !keepOpen) {
      const count = run.end - run.start + 1;
      rows.push(
        <div key={`f${run.start}`} className="ui-code-fold">
          {s.lineNumbers && <span className="ui-code-num" aria-hidden="true">⋯</span>}
          <span className="ui-code-text">
            ⋯ {count} lines of data folded away.{' '}
            <button type="button" onClick={() => setOpen({ path: file.path, starts: [...opened, run.start] })}>
              Show them
            </button>
          </span>
        </div>,
      );
      n = run.end + 1;
      continue;
    }
    rows.push(
      <LineMemo
        key={n}
        n={n}
        tokens={tokens[n - 1]}
        matcher={matcher}
        spot={!!ra && n >= ra && n <= rb}
        dim={!!ra && (n < ra || n > rb)}
        current={current === n}
        showNum={s.lineNumbers}
        metIds={s.cppHints === 'pop' ? metIds : undefined}
        onWord={onWord}
        onLine={onLine}
        setRef={setRef}
      />,
    );
    n++;
  }

  const digits = String(Math.max(lines.length, 1)).length;
  return (
    <div
      ref={paneRef}
      className={`ui-code${className ? ` ${className}` : ''}`}
      role="region"
      aria-label={`${file.path}, ${lines.length} lines`}
      tabIndex={0}
      data-wrap={s.wrap ? 'true' : undefined}
      data-nonum={s.lineNumbers ? undefined : 'true'}
      data-soften={s.softenComments ? 'true' : undefined}
      data-hints={s.cppHints}
      style={{ ['--ui-code-size' as string]: `${SIZE_PX[s.codeSize]}px`, ['--ui-code-digits' as string]: digits }}
    >
      <div className="ui-code-inner">{rows}</div>
    </div>
  );
}

export default CodeView;
