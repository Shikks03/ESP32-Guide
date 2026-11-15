/**
 * Typed content model for the ESP32 bench guide.
 * Every lesson, tour, part, chip block and log entry is plain data typed here.
 * Pages read these; they never hard-code lesson text.
 *
 * "Rich" strings support two inline marks only, rendered by <RichText>:
 *   `code`      -> <code>
 *   **bold**    -> <strong>
 * No HTML in content strings.
 */
export type Rich = string;

/* ------------------------------------------------------------------ status */

/** The four lab statuses. Labels live in STATUS_LABEL. */
export type LabStatus = 'done' | 'runs' | 'built' | 'planned';

export const STATUS_LABEL: Record<LabStatus, string> = {
  done: 'done by you',
  runs: 'runs on the board',
  built: 'built, not flashed',
  planned: 'planned',
};

/** Display order, most finished first (used by bars and counts). */
export const STATUS_ORDER: LabStatus[] = ['done', 'runs', 'built', 'planned'];

/* ------------------------------------------------------------------ tracks */

export type TrackId = 'intro' | 'wifi' | 'radar' | 'bulb' | 'zones';

export interface Track {
  id: TrackId;
  title: string;        // "Wi-Fi & web server"
  short: string;        // "Wi-Fi" (tab label on narrow screens)
  blurb: string;        // one line on what the track is for
  lessonIds: string[];  // in order
}

/* ------------------------------------------------------------------ parts */

export type PartId =
  | 'board'        // board + USB-C data cable (always required)
  | 'jumpers'      // jumper wires F-F
  | 'wifi'         // a 2.4 GHz Wi-Fi network
  | 'ld2450'       // HLK-LD2450 radar kit
  | 'shelly'       // Shelly Multicolor Bulb E27 Gen3
  | 'phone'        // phone or laptop on the same network
  | 'breadboard'
  | 'led'          // LED + 220-330 ohm resistor
  | 'button';

export interface Part {
  id: PartId;
  name: string;
  note?: string;          // "arriving ~Nov 18", "not picked yet"
  always?: boolean;       // board: always counted as owned, not toggleable
  defaultHave?: boolean;  // initial toggle state on first visit
  optional?: boolean;     // optional extras (not required by any core lab)
}

/* ------------------------------------------------------------------ board */

/**
 * Pin ids follow boardSVG() in the original guide:
 * GPIO numbers as strings ("2", "4", "16"), plus "EN", "GND", "VIN", "3V3".
 * "usb" highlights the USB-C port instead of a pin.
 */
export type PinId = string;

export interface PinUse {
  pin: PinId;
  tag: string;        // short label drawn under the pin: "LED", "touch wire", "RX2"
  signal?: boolean;   // true = signal pin (orange tag); false = power/ground (dark tag)
}

/** Board hotspots for "Meet the board" (numbered 1-6). */
export type HotspotId = 'usb' | 'buttons' | 'leds' | 'module' | 'antenna' | 'headers';

export interface Hotspot {
  id: HotspotId;
  n: number;          // 1..6
  name: string;
  text: Rich;
}

/* ------------------------------------------------------------------ chip blocks (datasheet) */

export type BlockFamily =
  | 'System' | 'Memory' | 'Security' | 'Connectivity' | 'Timing' | 'Analog' | 'Radio';

export interface Citation {
  doc: string;        // "ESP32 Series Datasheet v4.x"
  section: string;    // "§4.1.1 GPIO" (as printed in the doc)
  url?: string;
}

export interface ChipBlock {
  id: string;         // "uart", "wifi", "touch", ...
  name: string;       // "UART x3"
  family: BlockFamily;
  blurb: Rich;
  cite?: Citation;
}

export interface Claim {
  title: string;
  body: Rich;
  cite: Citation;
}

export interface Stat {
  value: number;
  unit?: string;      // "MHz", "KB", "µA"
  prefix?: string;    // "~"
  label: string;
  note?: string;      // "about 25 on this header"
}

/* ------------------------------------------------------------------ lessons */

export interface OnBoardChip {
  k: string;          // "GPIO 4"
  v: string;          // "touch wire"
  signal?: boolean;
}

export interface WireRow {
  from: string;
  to: string;
  notes: string;
  later?: boolean;    // greyed-out "when you have parts" row
}

export type TermClass = 'hi' | 'in' | 'dim' | 'err';

export interface TermLine {
  t?: string;         // timestamp shown dimmed, e.g. "14:02:00.145"
  text: string;
  cls?: TermClass;
}

export interface SerialCommand {
  cmd: string;            // what the chip button sends, e.g. "scan"
  reply: TermLine[];      // what the fake monitor prints back
}

/** Initial state for the LED simulation that drives the board drawing. */
export interface LedSim {
  mode: 'off' | 'on' | 'blink' | 'fade' | 'sos';
  blinkMs?: number;
  level?: number;         // 0-255
}

export interface Preview {
  title: string;          // "pio device monitor"
  baud: string;           // "115200 baud" or ""
  caption: string;
  /** Lines replayed when the preview opens. */
  boot: TermLine[];
  /** Clickable sample commands (generic replay). */
  commands?: SerialCommand[];
  /** Special engines. 'led-02' = lesson 02's LED state machine, ported from the original. */
  engine?: 'led-02';
  led?: LedSim;           // LED behaviour on the board drawing while previewing
  /** Optional wiring sketch: which pins connect to what, drawn by <WiringSketch>. */
  sketch?: { from: PinId; to: string; color?: 'signal' | 'power' | 'ground' }[];
}

export interface LabFile {
  path: string;           // "platformio.ini", "src/main.cpp", "include/secrets.example.h"
  text: string;           // loaded with Vite ?raw from labs/<dir>/...
  lang: 'ini' | 'cpp' | 'text' | 'powershell' | 'ts' | 'bash';
}

export interface Lesson {
  id: string;             // route id, lowercase: "00", "01", "02", "w1", "s3", "l2", "z1"
  code: string;           // display id: "00", "W1", "S3"
  track: TrackId;
  name: string;           // short name for the node rail: "Hello"
  title: string;          // "Meet the board"
  status: LabStatus;      // starting status
  pitch: string;          // one-line pitch under the title
  runsOn: 'laptop' | 'board';
  labDir?: string;        // "labs/02-touch"; undefined = no firmware
  onBoard: OnBoardChip[];
  learn: string[];
  /** Windows command for the PlatformIO Core CLI terminal, or null. */
  command: string | null;
  /** Optional PowerShell block that scaffolds the lab folder. */
  scaffold?: string;
  wire: WireRow[] | null;
  steps: Rich[];
  /** "No X yet?" fallback note. */
  fallback?: { title: string; text: Rich };
  tips: Rich[];
  /** Plain warnings that must stand out (e.g. 5 V on the wrong pin). */
  warnings?: Rich[];
  preview: Preview;
  pins: PinUse[];
  usb?: boolean;          // highlight the USB-C port on the pinout
  parts: PartId[];        // required parts (board is implied, include it anyway)
  optionalParts?: PartId[];
  files: LabFile[];
  chipBlocks: string[];   // ChipBlock ids this lab exercises (datasheet progress)
  hotspots: HotspotId[];  // board hotspots this lab uses (Meet the board)
  /** Extra free-form sections (e.g. S3's frame format + sample frames). */
  extra?: { title: string; body: Rich; code?: { lang: LabFile['lang']; text: string } }[];
  /** Facts that could not be confirmed against an official doc, shown as a note. */
  unverified?: Rich[];
}

/* ------------------------------------------------------------------ code reader */

export type Depth = 'beginner' | 'explorer' | 'deep';

export interface TourStop {
  file: string;               // LabFile.path
  lines: [number, number];    // 1-based inclusive range in that file
  /** Text that must appear on the first line of the range; checked at dev time to catch drift. */
  anchor: string;
  title: string;
  text: Record<Depth, Rich>;
  /**
   * Guess first. With `options`, it's the reference's 3-option quiz (exactly one `right`);
   * without, it's an open "Your turn → Show me" prompt. `answer` is shown after the reveal.
   */
  guess?: {
    question: string;
    options?: { text: string; right: boolean; why?: Rich }[];
    answer: Rich;
  };
  /** Depth levels where this stop appears (default: all). The reference shows fewer stops at Beginner. */
  levels?: Depth[];
  words?: string[];           // Word ids introduced at this stop
}

export interface Tour {
  lessonId: string;
  stops: TourStop[];
}

export interface Word {
  id: string;                 // "pinMode"
  term: string;               // shown on the card
  kind: 'keyword' | 'type' | 'function' | 'macro' | 'concept';
  short: Rich;                // one line
  long?: Rich;
  example?: string;
}

/* ------------------------------------------------------------------ bench log */

export type LogType = 'install' | 'build' | 'read' | 'reset' | 'flash' | 'failed';

export interface LogEntry {
  n: number;
  date: string;           // "2026-11-14"
  type: LogType;
  what: string;
  why: string;
  command?: string;
  result: string;
  lab?: string;           // lesson id
  by?: 'riku' | 'claude'; // who ran it
}

/* ------------------------------------------------------------------ settings */

export interface Settings {
  depth: Depth;
  readerView: 'simple' | 'full';
  guessFirst: boolean;
  /** C++ word cards: pop a card the first time (reference default), only underline, or off. */
  cppHints: 'pop' | 'underline' | 'off';
  /** Line-by-line player speed. */
  pace: 'slow' | 'normal' | 'fast';
  codeSize: 'sm' | 'md' | 'lg';
  lineNumbers: boolean;
  wrap: boolean;
  softenComments: boolean;
  foldData: boolean;
  theme: 'auto' | 'light' | 'dark';
  motion: 'device' | 'calm';
}
