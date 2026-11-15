import { useRef, useState } from 'react';
import './CommandBox.css';

type State = 'idle' | 'copied' | 'selected';

export function CommandBox({ command }: { command: string }) {
  const [state, setState] = useState<State>('idle');
  const codeRef = useRef<HTMLElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setState('copied');
    } catch {
      const el = codeRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setState('selected');
    }
    window.setTimeout(() => setState('idle'), 1800);
  };

  return (
    <div className="ui-cmd">
      <code ref={codeRef} tabIndex={0}>
        {command}
      </code>
      <button type="button" onClick={copy} aria-label={`Copy command: ${command}`}>
        <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'selected' ? 'Selected' : 'Copy'}</span>
      </button>
    </div>
  );
}
