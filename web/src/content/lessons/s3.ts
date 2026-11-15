import type { Lesson, Rich } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/s3-parse/platformio.ini?raw';
import main from '../../../../labs/s3-parse/src/main.cpp?raw';
import tsParser from '../../../../labs/s3-parse/ts/parseFrame.ts?raw';

const OFFICIAL = 'AA FF 03 00 0E 03 B1 86 10 00 40 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 CC';

const warnings: Rich[] = [
  '**Check every wire before you plug in USB.** The radar needs 5 V on its `5V` pin and nothing else. 5 V on a signal pin can kill the radar or the ESP32, whose pins are 3.3 V only. Unplug USB whenever you touch a wire.',
  '**Label the wires from the markings printed on the radar board, not from wire colours.** The docs name the pins `5V`, `GND`, `TX` and `RX`. Tape a flag on each wire and write its name on it.',
];

const FORMAT_TABLE = `offset  bytes  field
0       4      header           AA FF 03 00
4       8      target 1 block
12      8      target 2 block
20      8      target 3 block
28      2      tail             55 CC
        = 30 bytes per frame, 10 frames per second

each 8-byte target block (every number is little-endian, low byte first):
+0  2  x           signed 16-bit, mm
+2  2  y           signed 16-bit, mm
+4  2  speed       signed 16-bit, cm/s
+6  2  resolution  unsigned 16-bit, mm (size of one distance gate)

a block of eight 00 bytes = no target in that slot`;

const OFFICIAL_DECODED = `${OFFICIAL}

target 1 = 0E 03 B1 86 10 00 40 01
  x     = 0x0E + 0x03*256 = 782      bit 15 clear -> negative -> -782 mm
  y     = 0xB1 + 0x86*256 = 34481    bit 15 set   -> 34481 - 32768 = 1713 mm
  speed = 0x10 + 0x00*256 = 16       bit 15 clear -> negative -> -16 cm/s
  res   = 0x40 + 0x01*256 = 320 mm
targets 2 and 3 = eight 00 bytes each = no target`;

const SAMPLES = `# 1. Official example (protocol document, one target)
${OFFICIAL}
#    -> target 1: x -782 mm, y 1713 mm, speed -16 cm/s, resolution 320 mm

# 2. Nobody there (built from the document's rule, not printed in it)
AA FF 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 CC
#    -> no targets

# 3. Built by applying the rule (NOT from the document, check before trusting)
AA FF 03 00 2C 81 DC 85 14 80 68 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 CC
#    -> target 1: x +300 mm, y 1500 mm, speed +20 cm/s, resolution 360 mm`;

const lesson: Lesson = {
  id: 's3',
  code: 'S3',
  track: 'radar',
  name: 'Parse targets',
  title: 'Parse targets',
  status: 'built',
  pitch: 'Turn each 30-byte frame into up to three targets with x, y, speed and resolution, and print them. Includes the exact sign rule from the radar document and a TypeScript version of the parser.',
  runsOn: 'board',
  labDir: 'labs/s3-parse',
  onBoard: [
    { k: 'GPIO 16', v: 'RX2 <- radar TX', signal: true },
    { k: 'GPIO 17', v: 'TX2 -> radar RX', signal: true },
    { k: 'VIN', v: '5 V to radar' },
    { k: 'GND', v: 'ground' },
  ],
  learn: ['little-endian numbers', 'sign-bit-high encoding', 'structs', 'a parser you can test'],
  command: 'pio run -d labs/s3-parse -t upload -t monitor',
  scaffold: buildScaffold('labs/s3-parse', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
  ]),
  wire: [
    { from: 'VIN', to: 'radar 5V', notes: 'Power. Same wiring as S2: nothing changes.' },
    { from: 'GND', to: 'radar GND', notes: 'Ground.' },
    { from: 'GPIO 16 (RX2)', to: 'radar TX', notes: 'Radar transmits, ESP32 receives.' },
    { from: 'GPIO 17 (TX2)', to: 'radar RX', notes: 'Other direction.' },
  ],
  steps: [
    'Make `labs/s3-parse` with the two files from the code tab, or run the PowerShell block from the repo root. Keep the wiring from S2, checked again with USB unplugged.',
    'Run the command. Before any radar data, the board parses the **official example frame** from the protocol document and prints whether the answer is right: `x=-782 y=1713 v=-16 res=320`. That proves the parser without the radar.',
    'Stand in front of the radar. Lines like `T1 x=... y=... v=...` appear about five times a second. Move left and right and watch x change sign. Walk away and watch y grow.',
    'Step in with a second person. T2 fills in. The most the radar reports is three targets.',
    'Type `every 1` to print every frame, `stats` for counts, and `test` to run the self-test again.',
    'Read the **frame format** and the **sign rule** below, then paste the TypeScript parser into a file and run it on the sample frames.',
  ],
  fallback: {
    title: 'No radar yet?',
    text: 'The self-test at boot still runs, and the TypeScript parser below works on the sample frames, so you can do the whole parsing half of this lab with no hardware.',
  },
  tips: [
    '**x and y are millimetres, speed is cm/s.** The document says cm/s even though some third-party notes say mm/s. Walking speed is a few tens of cm/s.',
    '**The sign rule is not two\'s complement.** In the document, the top bit set means positive and clear means negative, and the other 15 bits are the size. Two\'s complement would give wildly wrong numbers for negative values.',
    '**Which side is positive x?** The document gives the sign rule but this guide has not confirmed whether +x is your left or right from the radar. Walk to one side and look at the sign. You will use that in S4 and Zones.',
    '**A zero block means no target.** A real target at x = 0 is stored as 0x8000, not 0x0000, because positive zero has the top bit set.',
  ],
  warnings,
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Abridged. The self-test uses the official example frame from the protocol document. The T1 line is that same frame decoded. A real run prints a changing line about five times a second.',
    boot: [
      { t: '14:42:00.503', text: '[I] Radar on UART2: RX GPIO 16, TX GPIO 17, 256000 baud 8N1.' },
      { t: '14:42:00.504', text: '[I] self-test on the official example frame: x=-782 y=1713 v=-16 res=320, T2 none, T3 none' },
      { t: '14:42:00.505', text: '[I] parser OK (expected x=-782 y=1713 v=-16 res=320)', cls: 'hi' },
      { t: '14:42:00.505', text: 'Commands: every <n> | test | stats | help' },
      { t: '14:42:01.002', text: '[1002 ms] T1 x=-782 mm y=1713 mm v=-16 cm/s res=320 mm | T2 none | T3 none |', cls: 'hi' },
      { t: '14:42:03.502', text: '[3502 ms] T1 none | T2 none | T3 none |', cls: 'dim' },
    ],
    commands: [
      {
        cmd: 'test',
        reply: [
          { text: '[I] self-test on the official example frame: x=-782 y=1713 v=-16 res=320, T2 none, T3 none' },
          { text: '[I] parser OK (expected x=-782 y=1713 v=-16 res=320)', cls: 'hi' },
        ],
      },
      {
        cmd: 'stats',
        reply: [
          { text: '[I] frames 35, with a target 25, bad tails 0, most targets at once 1' },
          { text: '[I] printing every 2 frame(s)' },
        ],
      },
      { cmd: 'every 1', reply: [{ text: '[I] printing every 1 frame(s)' }] },
      { cmd: 'help', reply: [{ text: 'Commands: every <n> | test | stats | help' }] },
    ],
    sketch: [
      { from: 'VIN', to: 'radar 5V', color: 'power' },
      { from: 'GND', to: 'radar GND', color: 'ground' },
      { from: '16', to: 'radar TX', color: 'signal' },
      { from: '17', to: 'radar RX', color: 'signal' },
    ],
  },
  pins: [
    { pin: '16', tag: 'RX2 <- radar TX', signal: true },
    { pin: '17', tag: 'TX2 -> radar RX', signal: true },
    { pin: 'VIN', tag: '5V', signal: false },
    { pin: 'GND', tag: 'GND', signal: false },
  ],
  parts: ['board', 'ld2450'],
  optionalParts: ['jumpers'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
    { path: 'ts/parseFrame.ts', text: tsParser, lang: 'ts' },
  ],
  chipBlocks: ['uart', 'gpio', 'timers'],
  hotspots: ['headers', 'module'],
  extra: [
    {
      title: 'The frame, byte by byte',
      body: 'From the LD2450 serial protocol document (V1.03, section 2.3, tables 9 and 10): header `AA FF 03 00`, three 8-byte target blocks, tail `55 CC`, 30 bytes in all, sent 10 times a second. The radar uses the **little-endian** format, so the low byte of every number comes first.',
      code: { lang: 'text', text: FORMAT_TABLE },
    },
    {
      title: 'The sign rule',
      body: 'The document says, for x, y and speed: the highest bit 1 corresponds to a positive value, 0 corresponds to a negative value, and the other 15 bits are the size (mm for x and y, cm/s for speed). So `if (raw & 0x8000) value = raw & 0x7FFF; else value = -(raw & 0x7FFF)`. This is sign-and-magnitude, **not** two\'s complement, and the same rule applies to all three numbers. Resolution is a plain unsigned 16-bit number.',
    },
    {
      title: 'The official example, decoded',
      body: 'The document prints this frame and works through target 1 by hand. The firmware checks itself against these exact numbers at boot.',
      code: { lang: 'text', text: OFFICIAL_DECODED },
    },
    {
      title: 'Sample frames to try',
      body: 'Frame 1 is from the document. Frames 2 and 3 were built by applying the document\'s rule, so check them against your own decoding before you trust them.',
      code: { lang: 'text', text: SAMPLES },
    },
    {
      title: 'The same parser in TypeScript',
      body: 'Same rule as the C++ `decodeSigned`, but returning `null` for a bad frame or an empty slot. Save it as `parseFrame.ts` and run it with `npx tsx parseFrame.ts` (the first run downloads `tsx`), or paste it into the TypeScript playground. It prints the decoded official frame. Then feed it sample frames 2 and 3 as `Uint8Array`s.',
      code: { lang: 'ts', text: tsParser },
    },
  ],
  unverified: [
    'Whether positive x is to the left or right of the radar is not stated in the sign rule. Check it by walking.',
    'Sample frames 2 and 3 are constructed from the document\'s rule, not captured from a radar.',
    'The radar plug pitch is unconfirmed (1.25 mm in the brief, 2.0 mm in the manual drawing of the pin header). See S2.',
    'The counts in the stats example are illustrative.',
  ],
};

export default lesson;
