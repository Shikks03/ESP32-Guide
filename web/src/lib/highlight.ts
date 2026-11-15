/**
 * Small hand-written tokenizer for the code reader (no syntax-highlighting library).
 * C++ / TS-ish files and INI files get colour classes; everything else is plain text.
 * The class names map to the --syn-* tokens in CodeView.css.
 */
import type { LabFile } from '../content/types';

export type TokCls = '' | 'kw' | 'type' | 'str' | 'num' | 'com' | 'fn' | 'const' | 'pre';
export interface Token {
  text: string;
  cls: TokCls;
}

const KEYWORDS = new Set(
  (
    'alignas alignof auto bool break case catch class const constexpr const_cast continue decltype default delete do ' +
    'else enum explicit extern for friend goto if inline namespace new noexcept operator override private protected ' +
    'public register reinterpret_cast return sizeof static static_assert static_cast struct switch template this ' +
    'throw try typedef typename union using virtual volatile while final export import from as let function ' +
    'interface type async await'
  ).split(' '),
);
const TYPES = new Set(
  (
    'void int long short char float double unsigned signed size_t ssize_t int8_t int16_t int32_t int64_t uint8_t ' +
    'uint16_t uint32_t uint64_t intptr_t uintptr_t ptrdiff_t byte word boolean String string number esp_err_t ' +
    'gpio_num_t TickType_t BaseType_t IPAddress'
  ).split(' '),
);
const CONSTS = new Set(
  'HIGH LOW INPUT OUTPUT INPUT_PULLUP INPUT_PULLDOWN LED_BUILTIN true false nullptr NULL null undefined'.split(' '),
);

const isWordCh = (c: string | undefined) => !!c && /[A-Za-z0-9_]/.test(c);

/** Split a file into lines (drops one trailing newline, handles CRLF). */
export function splitLines(text: string): string[] {
  const t = text.replace(/\r\n?/g, '\n').replace(/\n$/, '');
  return t === '' ? [] : t.split('\n');
}

function classify(word: string, rest: string, prev: string): TokCls {
  if (KEYWORDS.has(word)) return 'kw';
  if (TYPES.has(word)) return 'type';
  if (CONSTS.has(word)) return 'const';
  if (/^[A-Z][A-Z0-9_]+$/.test(word)) return 'const';
  if (/^k[A-Z][A-Za-z0-9_]*$/.test(word)) return 'const';
  if (/^\s*\(/.test(rest)) return 'fn';
  if (/^[A-Z][a-z][A-Za-z0-9_]*$/.test(word) && prev !== '.') return 'type';
  return '';
}

function pushTok(out: Token[], text: string, cls: TokCls) {
  if (!text) return;
  const last = out[out.length - 1];
  if (last && last.cls === cls) last.text += text;
  else out.push({ text, cls });
}

function cppLine(line: string, inBlock: boolean): { tokens: Token[]; inBlock: boolean } {
  const out: Token[] = [];
  let i = 0;
  const n = line.length;
  let sawFirst = false;
  while (i < n) {
    if (inBlock) {
      const end = line.indexOf('*/', i);
      if (end < 0) {
        pushTok(out, line.slice(i), 'com');
        i = n;
      } else {
        pushTok(out, line.slice(i, end + 2), 'com');
        i = end + 2;
        inBlock = false;
      }
      continue;
    }
    const c = line[i];
    const two = line.slice(i, i + 2);
    if (two === '//') {
      pushTok(out, line.slice(i), 'com');
      i = n;
      continue;
    }
    if (two === '/*') {
      inBlock = true;
      pushTok(out, '/*', 'com');
      i += 2;
      continue;
    }
    if (c === ' ' || c === '\t') {
      pushTok(out, c, '');
      i++;
      continue;
    }
    if (c === '#' && !sawFirst) {
      const m = /^#\s*\w+/.exec(line.slice(i));
      sawFirst = true;
      if (m) {
        pushTok(out, m[0], 'pre');
        i += m[0].length;
        const inc = /^(\s*)(<[^>\n]+>)/.exec(line.slice(i));
        if (inc && /include/.test(m[0])) {
          pushTok(out, inc[1], '');
          pushTok(out, inc[2], 'str');
          i += inc[0].length;
        }
        continue;
      }
    }
    sawFirst = true;
    if (c === '"') {
      let j = i + 1;
      while (j < n && line[j] !== '"') j += line[j] === '\\' ? 2 : 1;
      j = Math.min(j + 1, n);
      pushTok(out, line.slice(i, j), 'str');
      i = j;
      continue;
    }
    if (c === "'") {
      const m = /^'(\\.[^']*|[^'\\])'/.exec(line.slice(i));
      if (m) {
        pushTok(out, m[0], 'str');
        i += m[0].length;
        continue;
      }
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(line[i + 1] ?? '') && !isWordCh(line[i - 1]))) {
      if (!isWordCh(line[i - 1])) {
        const m = /^(0[xX][0-9a-fA-F']+|0[bB][01']+|(?:\d[\d']*\.?[\d']*|\.\d+)(?:[eE][+-]?\d+)?)[uUlLfF]*/.exec(line.slice(i));
        if (m) {
          pushTok(out, m[0], 'num');
          i += m[0].length;
          continue;
        }
      }
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_]\w*/.exec(line.slice(i))!;
      const prev = out.length ? out[out.length - 1].text.slice(-1) : '';
      pushTok(out, m[0], classify(m[0], line.slice(i + m[0].length), prev));
      i += m[0].length;
      continue;
    }
    pushTok(out, c, '');
    i++;
  }
  return { tokens: out, inBlock };
}

function iniLine(line: string): Token[] {
  const t = line.trim();
  if (t.startsWith(';') || t.startsWith('#')) return [{ text: line, cls: 'com' }];
  const sec = /^(\s*)(\[[^\]]*\])(.*)$/.exec(line);
  if (sec) {
    const out: Token[] = [];
    pushTok(out, sec[1], '');
    pushTok(out, sec[2], 'type');
    if (sec[3]) pushTok(out, sec[3], /^\s*[;#]/.test(sec[3]) ? 'com' : '');
    return out;
  }
  const kv = /^(\s*)([A-Za-z_][\w.\-]*)(\s*[=:]\s*)(.*)$/.exec(line);
  if (kv) {
    const out: Token[] = [];
    pushTok(out, kv[1], '');
    pushTok(out, kv[2], 'fn');
    pushTok(out, kv[3], '');
    // value: numbers, booleans, ${refs}, trailing comment
    const val = kv[4];
    const cm = /\s[;#].*$/.exec(val);
    const body = cm ? val.slice(0, cm.index) : val;
    for (const part of body.split(/(\s+|,)/)) {
      if (/^-?\d+(\.\d+)?$/.test(part)) pushTok(out, part, 'num');
      else if (/^(true|false|yes|no)$/i.test(part)) pushTok(out, part, 'const');
      else if (/^[$-]/.test(part) && /[{}$=]|^-[-DOI]/.test(part)) pushTok(out, part, 'pre');
      else pushTok(out, part, '');
    }
    if (cm) pushTok(out, val.slice(cm.index), 'com');
    return out;
  }
  return [{ text: line, cls: '' }];
}

function hashLine(line: string): Token[] {
  const m = /^(\s*)(#.*)$/.exec(line);
  if (m) return m[1] ? [{ text: m[1], cls: '' }, { text: m[2], cls: 'com' }] : [{ text: m[2], cls: 'com' }];
  return [{ text: line, cls: '' }];
}

/** Tokens for every line of the file. */
export function highlightLines(text: string, lang: LabFile['lang']): Token[][] {
  const lines = splitLines(text);
  if (lang === 'ini') return lines.map(iniLine);
  if (lang === 'cpp' || lang === 'ts') {
    let inBlock = false;
    return lines.map((l) => {
      const r = cppLine(l, inBlock);
      inBlock = r.inBlock;
      return r.tokens.length ? r.tokens : [{ text: '', cls: '' as TokCls }];
    });
  }
  if (lang === 'powershell' || lang === 'bash') return lines.map(hashLine);
  return lines.map((l) => [{ text: l, cls: '' as TokCls }]);
}

/* ------------------------------------------------------------------ data folding */

const NUM = String.raw`(?:0[xX][0-9a-fA-F]+|0[bB][01]+|-?\d+(?:\.\d+)?)[uUlLfF]*`;
const DATA_RE = new RegExp(String.raw`^\s*(?:${NUM}\s*,?\s*)+[};\])]*\s*,?\s*$`);

/** A line that is only numbers / commas (array data). */
export function isDataLine(line: string): boolean {
  return DATA_RE.test(line);
}

export interface FoldRun {
  start: number; // 1-based
  end: number; // inclusive
}

/** Runs of >= minLen consecutive data lines. */
export function findFoldRuns(lines: string[], minLen = 6): FoldRun[] {
  const runs: FoldRun[] = [];
  let s = -1;
  for (let i = 0; i <= lines.length; i++) {
    const data = i < lines.length && isDataLine(lines[i]);
    if (data && s < 0) s = i;
    if (!data && s >= 0) {
      if (i - s >= minLen) runs.push({ start: s + 1, end: i });
      s = -1;
    }
  }
  return runs;
}

/* ------------------------------------------------------------------ functions (for the Map tab) */

export interface FnDef {
  name: string;
  line: number; // 1-based
  length: number; // lines in the body
}

const FN_RE = /^\w[\w\s*&:<>]*\s\**&?(\w+)\s*\([^;]*\)\s*(?:const\s*)?(?:noexcept\s*)?\{/;
const NOT_FN = new Set(['if', 'for', 'while', 'switch', 'else', 'catch', 'return', 'sizeof', 'do']);

export function findFunctions(lines: string[], tokens: Token[][]): FnDef[] {
  const defs: FnDef[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = FN_RE.exec(lines[i]);
    if (!m || NOT_FN.has(m[1]) || /^\s*(else|return|case)\b/.test(lines[i])) continue;
    let depth = 0;
    let end = i;
    let started = false;
    for (let j = i; j < lines.length; j++) {
      for (const t of tokens[j] ?? []) {
        if (t.cls === 'com' || t.cls === 'str') continue;
        for (const ch of t.text) {
          if (ch === '{') {
            depth++;
            started = true;
          } else if (ch === '}') depth--;
        }
      }
      if (started && depth <= 0) {
        end = j;
        break;
      }
      end = j;
    }
    defs.push({ name: m[1], line: i + 1, length: end - i + 1 });
    i = end;
  }
  return defs;
}

/* ------------------------------------------------------------------ word terms */

/**
 * The source spellings a word card's `term` stands for.
 * "HIGH / LOW" -> HIGH, LOW; "Serial.available / read" -> Serial.available, Serial.read;
 * "#ifndef … #endif" -> #ifndef, #endif; "setup()" -> setup; "const char *" -> const char.
 * Pure punctuation terms ("%", "&&") give nothing: they are not underlined.
 */
export function termAlternatives(term: string): string[] {
  const parts = term
    .split(/\s+\/\s+|\s*…\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const dotted = parts[0]?.match(/^(\w+)\./);
  const out: string[] = [];
  parts.forEach((p, i) => {
    let t = p.replace(/\(\)$/, '').replace(/\s*\*+$/, '').trim();
    if (i > 0 && dotted && !t.includes('.') && /^\w+$/.test(t)) t = `${dotted[1]}.${t}`;
    if (/^[#\w][\w.# ]*$/.test(t) && /\w/.test(t)) out.push(t);
  });
  return out;
}
