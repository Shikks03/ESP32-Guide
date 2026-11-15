import { Fragment, type ReactNode } from 'react';

function renderCode(text: string, keyBase: string): ReactNode[] {
  return text.split('`').map((part, i) =>
    i % 2 === 1 ? <code key={keyBase + i}>{part}</code> : <Fragment key={keyBase + i}>{part}</Fragment>,
  );
}

/** Renders `code` and **bold** (bold may contain code). Everything else is plain text; no HTML is injected. */
export function RichText({ text }: { text: string }) {
  const segments: { bold: boolean; text: string }[] = [];
  let buf = '';
  let bold = false;
  let inCode = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '`') inCode = !inCode;
    if (!inCode && ch === '*' && text[i + 1] === '*') {
      segments.push({ bold, text: buf });
      buf = '';
      bold = !bold;
      i++;
      continue;
    }
    buf += ch;
  }
  segments.push({ bold, text: buf });
  return (
    <>
      {segments.map((s, i) =>
        s.text === '' ? null : s.bold ? (
          <strong key={i}>{renderCode(s.text, `b${i}-`)}</strong>
        ) : (
          <Fragment key={i}>{renderCode(s.text, `t${i}-`)}</Fragment>
        ),
      )}
    </>
  );
}

export default RichText;
