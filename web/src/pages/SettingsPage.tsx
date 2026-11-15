import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Depth, LabFile, Settings } from '../content/types';
import { WORDS } from '../content/words';
import { LESSONS, lessonById } from '../content/lessons';
import { CodeView } from '../components/CodeView';
import { Segmented } from '../components/ui';
import { useSettings } from '../state/settings';
import { resetProgress, stopsRead, useWordsMet } from '../state/progress';
import { KEYS, useStored } from '../state/storage';
import { useTitle } from '../lib/useTitle';
import './SettingsPage.css';

/* ---------------------------------------------------------------- small controls */

interface Choice<T extends string> {
  value: T;
  label: string;
  blurb: string;
  art?: ReactNode;
}

/** Radio-style option cards: role="radiogroup", roving tabindex, arrow keys move and select. */
function OptionCards<T extends string>({
  label,
  value,
  choices,
  onChange,
  cols,
}: {
  label: string;
  value: T;
  choices: Choice<T>[];
  onChange: (v: T) => void;
  cols: 2 | 3;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const step = keys[e.key];
    if (!step) return;
    e.preventDefault();
    const cur = choices.findIndex((c) => c.value === value);
    const next = (cur + step + choices.length) % choices.length;
    onChange(choices[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className="set-cards" data-cols={cols} role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {choices.map((c, i) => (
        <button
          key={c.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={c.value === value}
          tabIndex={c.value === value ? 0 : -1}
          className="set-opt"
          onClick={() => onChange(c.value)}
        >
          {c.art}
          <b>{c.label}</b>
          <span>{c.blurb}</span>
        </button>
      ))}
    </div>
  );
}

type SwitchName = 'guessFirst' | 'lineNumbers' | 'wrap' | 'softenComments' | 'foldData';

function Switch({ id, label, hint, name }: { id: string; label: string; hint?: string; name: SwitchName }) {
  const [s, update] = useSettings();
  const on = s[name];
  return (
    <div className="set-row set-row-switch">
      <div className="set-row-text">
        <span id={`${id}-l`} className="set-label">{label}</span>
        {hint && <span id={`${id}-h`} className="set-hint">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={`${id}-l`}
        aria-describedby={hint ? `${id}-h` : undefined}
        className="set-switch"
        onClick={() => update({ [name]: !on } as Partial<Settings>)}
      />
    </div>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="set-row">
      <span className="set-label">{label}</span>
      {hint && <span className="set-hint">{hint}</span>}
      {children}
    </div>
  );
}

function LevelArt({ n }: { n: 1 | 2 | 3 }) {
  return (
    <span className="set-level" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <i key={i} data-on={i <= n ? 'true' : undefined} />
      ))}
    </span>
  );
}

function ViewArt({ kind }: { kind: 'simple' | 'full' }) {
  return (
    <span className="set-sketch" data-kind={kind} aria-hidden="true">
      <i className="set-sk-top" />
      <i className="set-sk-card" />
      {kind === 'simple' ? <i className="set-sk-side" /> : null}
      <i className="set-sk-foot" />
    </span>
  );
}

/* ---------------------------------------------------------------- preview snippet */

/** ~14 lines of lab 02's real main.cpp; the one-line SOS table is reflowed into rows so "Fold long data" has data to fold. */
function useSnippet(): LabFile {
  return useMemo(() => {
    const main = lessonById('02')?.files.find((f) => f.path === 'src/main.cpp');
    const L = (main?.text ?? '').split(/\r?\n/);
    const find = (re: RegExp) => Math.max(0, L.findIndex((l) => re.test(l)));
    const a = find(/^\/\/ PWM = /);
    const sosAt = find(/SOS_STEPS\[\] = \{/);
    const head = L.slice(a, a + 3);
    const m = /\{\s*([^}]*)\}/.exec(L[sosAt] ?? '');
    const nums = (m?.[1] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    const rows: string[] = [];
    for (let i = 0; i < nums.length; i += 3) rows.push(`  ${nums.slice(i, i + 3).join(',')},`);
    const out = [...head, '', L[sosAt - 1] ?? '', 'const uint16_t SOS_STEPS[] = {', ...rows, '};', L[sosAt + 1] ?? ''];
    return { path: 'src/main.cpp', lang: 'cpp', text: out.join('\n') };
  }, []);
}

/* ---------------------------------------------------------------- progress */

type ResetKey = 'code' | 'words' | 'ticks' | 'settings';

/** Two-step reset: the button turns into "Yes, ..." + "Keep it". Focus follows the choice. */
function ResetButton({
  id,
  label,
  confirmLabel,
  open,
  setOpen,
  onConfirm,
}: {
  id: ResetKey;
  label: string;
  confirmLabel: string;
  open: boolean;
  setOpen: (v: ResetKey | null) => void;
  onConfirm: () => void;
}) {
  const mainRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) yesRef.current?.focus();
    else if (wasOpen.current) mainRef.current?.focus();
    wasOpen.current = open;
  }, [open]);
  if (!open) {
    return (
      <button ref={mainRef} type="button" className="set-btn" onClick={() => setOpen(id)}>
        {label}
      </button>
    );
  }
  return (
    <span className="set-confirm" role="group" aria-label={label}>
      <button
        ref={yesRef}
        type="button"
        className="set-btn set-btn-danger"
        onClick={() => {
          onConfirm();
          setOpen(null);
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="set-btn" onClick={() => setOpen(null)}>
        Keep it
      </button>
    </span>
  );
}

/* ---------------------------------------------------------------- page */

export default function SettingsPage() {
  useTitle('Settings');
  const [s, update, resetSettings] = useSettings();
  const { met } = useWordsMet();
  const [codeRec] = useStored<Record<string, { stops: number[]; lines: Record<string, number[]> }>>(KEYS.codeProgress, {});
  const [ticksRec] = useStored<Record<string, boolean[]>>(KEYS.ticks, {});
  const [confirm, setConfirm] = useState<ResetKey | null>(null);
  const snippet = useSnippet();

  const labsRead = LESSONS.filter((l) => stopsRead(l.id, codeRec) > 0).length;
  const labsTicked = LESSONS.filter((l) => ticksRec[l.id]?.some(Boolean)).length;
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  return (
    <div className="set">
      <header className="set-head">
        <p className="set-eyebrow">Settings</p>
        <h1>Make the guide yours</h1>
        <p className="set-lead">Saved in this browser only. Every change applies at once.</p>
      </header>

      <section className="set-card" aria-labelledby="set-depth">
        <h2 id="set-depth" className="set-h2">How deep to go</h2>
        <OptionCards<Depth>
          label="How deep to go"
          cols={3}
          value={s.depth}
          onChange={(depth) => update({ depth })}
          choices={[
            { value: 'beginner', label: 'Beginner', art: <LevelArt n={1} />, blurb: "The short tour of the lab's own files, plain words, new C++ words introduced one at a time." },
            { value: 'explorer', label: 'Explorer', art: <LevelArt n={2} />, blurb: 'Every stop of every lab file, with the library code behind it a tap away.' },
            { value: 'deep', label: 'Deep dive', art: <LevelArt n={3} />, blurb: 'Everything, including the precise story behind each stop and word: types, timing, memory.' },
          ]}
        />
      </section>

      <section className="set-card" aria-labelledby="set-view">
        <h2 id="set-view" className="set-h2">How the code reader looks</h2>
        <OptionCards<Settings['readerView']>
          label="How the code reader looks"
          cols={2}
          value={s.readerView}
          onChange={(readerView) => update({ readerView })}
          choices={[
            { value: 'simple', label: 'Simple', art: <ViewArt kind="simple" />, blurb: 'One card, one button. The code, its explanation and Next: nothing else on screen.' },
            { value: 'full', label: 'Full', art: <ViewArt kind="full" />, blurb: 'Every tool at hand: files, map, phrasebook, progress ring, word cards, focus mode.' },
          ]}
        />
      </section>

      <div className="set-split">
        <div className="set-col">
          <section className="set-card" aria-labelledby="set-learn">
            <h2 id="set-learn" className="set-h2">Learning</h2>
            <Switch id="set-guess" name="guessFirst" label="Guess first" hint="Each tour stop asks what you think the code does before it tells you. Guessing makes it stick." />
            <Group label="C++ hints" hint="New words get a small card the first time you meet them; known words stay underlined.">
              <Segmented<Settings['cppHints']>
                ariaLabel="C++ hints"
                value={s.cppHints}
                onChange={(cppHints) => update({ cppHints })}
                options={[
                  { value: 'pop', label: 'Introduce each new word' },
                  { value: 'underline', label: 'Underline only' },
                  { value: 'off', label: 'Off' },
                ]}
              />
            </Group>
            <Group label="Line by line pace" hint={'How long "Play" stays on each line.'}>
              <Segmented<Settings['pace']>
                ariaLabel="Line by line pace"
                value={s.pace}
                onChange={(pace) => update({ pace })}
                options={[
                  { value: 'slow', label: 'Slow' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'fast', label: 'Fast' },
                ]}
              />
            </Group>
          </section>

          <section className="set-card" aria-labelledby="set-code">
            <h2 id="set-code" className="set-h2">Code display</h2>
            <Group label="Text size">
              <Segmented<Settings['codeSize']>
                ariaLabel="Code text size"
                value={s.codeSize}
                onChange={(codeSize) => update({ codeSize })}
                options={[
                  { value: 'sm', label: 'Small' },
                  { value: 'md', label: 'Medium' },
                  { value: 'lg', label: 'Large' },
                ]}
              />
            </Group>
            <Switch id="set-nums" name="lineNumbers" label="Line numbers" />
            <Switch id="set-wrap" name="wrap" label="Wrap long lines" hint="Handy on a phone: no sideways scrolling." />
            <Switch id="set-soft" name="softenComments" label="Soften comments" hint="Fades the programmer's notes so the code itself stands out." />
            <Switch id="set-fold" name="foldData" label="Fold long data" hint="Long tables and built-in web pages fold into one line until you open them." />
          </section>

          <section className="set-card" aria-labelledby="set-look">
            <h2 id="set-look" className="set-h2">Look and motion</h2>
            <Group label="Colour theme">
              <Segmented<Settings['theme']>
                ariaLabel="Colour theme"
                value={s.theme}
                onChange={(theme) => update({ theme })}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </Group>
            <Group label="Motion" hint="Calm turns sliding and pulsing down everywhere, simulators included.">
              <Segmented<Settings['motion']>
                ariaLabel="Motion"
                value={s.motion}
                onChange={(motion) => update({ motion })}
                options={[
                  { value: 'device', label: 'Follow my device' },
                  { value: 'calm', label: 'Calm' },
                ]}
              />
            </Group>
          </section>
        </div>

        <aside className="set-preview" aria-label="Preview of the code view">
          <h2 className="set-h2">Preview</h2>
          <CodeView file={snippet} className="set-preview-code" />
        </aside>
      </div>

      <section className="set-card" aria-labelledby="set-prog">
        <h2 id="set-prog" className="set-h2">Your progress</h2>
        <p className="set-stats">
          <span><b>{met.size}</b> of {WORDS.length} C++ {plural(met.size, 'word', 'words')} met</span>
          <span><b>{labsRead}</b> {plural(labsRead, 'lab', 'labs')} with code read</span>
          <span><b>{labsTicked}</b> {plural(labsTicked, 'lab', 'labs')} with steps ticked</span>
        </p>
        <div className="set-actions">
          <ResetButton id="code" label="Forget code I read" confirmLabel="Yes, forget code I read" open={confirm === 'code'} setOpen={setConfirm}
            onConfirm={() => { resetProgress('code'); resetProgress('tour'); }} />
          <ResetButton id="words" label="Forget words I met" confirmLabel="Yes, forget words I met" open={confirm === 'words'} setOpen={setConfirm}
            onConfirm={() => resetProgress('words')} />
          <ResetButton id="ticks" label="Untick every step" confirmLabel="Yes, untick every step" open={confirm === 'ticks'} setOpen={setConfirm}
            onConfirm={() => resetProgress('ticks')} />
          <ResetButton id="settings" label="Reset these settings" confirmLabel="Yes, reset these settings" open={confirm === 'settings'} setOpen={setConfirm}
            onConfirm={resetSettings} />
        </div>
      </section>
    </div>
  );
}
