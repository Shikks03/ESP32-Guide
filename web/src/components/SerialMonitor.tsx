import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Preview, TermClass } from '../content/types';
import { ledBootLines, initialLedState, runLedCommand, type LedState } from '../lib/ledSim';
import { useCalm } from '../state/settings';
import './SerialMonitor.css';

interface Line {
  id: number;
  t: string;
  text: string;
  cls?: TermClass;
}

const LED_COMMANDS = ['fade', 'blink 200', 'sos', 'level 30', 'on', 'off', 'help'];

function clock(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

export function SerialMonitor({ preview, onLed }: { preview: Preview; onLed?: (state: LedState) => void }) {
  const calm = useCalm();
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState('');
  const idRef = useRef(0);
  const ledRef = useRef<LedState>(initialLedState(preview.led));
  const logRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const onLedRef = useRef(onLed);
  onLedRef.current = onLed;
  const isLed = preview.engine === 'led-02';

  const append = useCallback((items: { t?: string; text: string; cls?: TermClass }[]) => {
    setLines((prev) => [
      ...prev,
      ...items.map((l) => ({ id: idRef.current++, t: l.t ?? clock(), text: l.text, cls: l.cls })),
    ]);
  }, []);

  // boot replay
  useEffect(() => {
    setLines([]);
    const timers: number[] = [];
    let boot: { t?: string; text: string; cls?: TermClass }[];
    if (isLed) {
      ledRef.current = initialLedState(preview.led);
      onLedRef.current?.(ledRef.current);
      boot = ledBootLines(ledRef.current);
    } else {
      boot = preview.boot;
    }
    const stamp = clock();
    const stamped = boot.map((l) => ({ ...l, t: l.t ?? stamp }));
    if (calm) {
      append(stamped);
    } else {
      stamped.forEach((l, i) => timers.push(window.setTimeout(() => append([l]), 120 * (i + 1))));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
    // preview identity changes only when the lesson changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, calm]);

  // auto-scroll
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const fromContent = (preview.commands ?? []).map((c) => c.cmd);
  const known = fromContent.length ? fromContent : isLed ? LED_COMMANDS : [];

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    if (isLed) {
      const out = runLedCommand(ledRef.current, cmd);
      ledRef.current = out.state;
      onLedRef.current?.(out.state);
      append(out.lines);
      return;
    }
    const hit = (preview.commands ?? []).find((c) => c.cmd.toLowerCase() === cmd.toLowerCase());
    if (hit) {
      append([{ text: '> ' + cmd, cls: 'in' }, ...hit.reply]);
    } else {
      append([
        { text: '> ' + cmd, cls: 'in' },
        { text: `(this simulation only knows: ${known.join(', ') || 'nothing yet'})`, cls: 'dim' },
      ]);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(value);
    setValue('');
  };

  return (
    <div className="ui-mon">
      <div className="ui-mon-term" role="group" aria-label="Simulated serial monitor">
        <div className="ui-mon-head">
          <span>$ {preview.title}</span>
          {preview.baud && <span>{preview.baud}</span>}
        </div>
        <div className="ui-mon-log" ref={logRef} aria-live="polite" role="log" tabIndex={0}>
          {lines.map((l) => (
            <div key={l.id} className="ui-mon-line" data-cls={l.cls ?? 'plain'}>
              <span className="ui-mon-t">{l.t} &gt;</span> <span className="ui-mon-x">{l.text}</span>
            </div>
          ))}
        </div>
        {/* Replay-only previews (e.g. `pio device list` on the laptop) have nothing to type into. */}
        {known.length > 0 && (
          <form className="ui-mon-prompt" onSubmit={submit}>
            <label htmlFor={inputId} className="visually-hidden">Command</label>
            <span aria-hidden="true">&gt;</span>
            <input
              id={inputId}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="type a command, press Enter"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
            />
          </form>
        )}
      </div>
      {known.length > 0 && (
        <div className="ui-mon-cmds">
          {known.map((c) => (
            <button key={c} type="button" onClick={() => run(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SerialMonitor;
