import type { Lesson, Rich } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/s2-raw-bytes/platformio.ini?raw';
import main from '../../../../labs/s2-raw-bytes/src/main.cpp?raw';

const OFFICIAL = 'AA FF 03 00 0E 03 B1 86 10 00 40 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 CC';
const EMPTY = 'AA FF 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 CC';

const warnings: Rich[] = [
  '**Check every wire before you plug in USB.** The radar needs 5 V on its `5V` pin and nothing else. 5 V on a signal pin can kill the radar or the ESP32, whose pins are 3.3 V only. Unplug USB whenever you touch a wire.',
  '**Label the wires from the markings printed on the radar board, not from wire colours.** Colours differ between cables. The docs name the four pins `5V`, `GND`, `TX` and `RX`. Put a tape flag on each wire and write the name on it before you connect anything.',
];

const lesson: Lesson = {
  id: 's2',
  code: 'S2',
  track: 'radar',
  name: 'Raw radar bytes',
  title: 'Raw radar bytes',
  status: 'built',
  pitch: 'Wire up the LD2450 radar and watch its raw data arrive. The firmware finds each 30-byte frame by its header and tail and prints one hex line per frame.',
  runsOn: 'board',
  labDir: 'labs/s2-raw-bytes',
  onBoard: [
    { k: 'GPIO 16', v: 'RX2 <- radar TX', signal: true },
    { k: 'GPIO 17', v: 'TX2 -> radar RX', signal: true },
    { k: 'VIN', v: '5 V to radar' },
    { k: 'GND', v: 'ground' },
  ],
  learn: ['reading hex', 'frame header and tail', 'finding frames in a byte stream', 'frame rate'],
  command: 'pio run -d labs/s2-raw-bytes -t upload -t monitor',
  scaffold: buildScaffold('labs/s2-raw-bytes', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
  ]),
  wire: [
    { from: 'VIN', to: 'radar 5V', notes: 'Power. The protocol document asks for 5 V and more than 200 mA. VIN is the 5 V rail on this board.' },
    { from: 'GND', to: 'radar GND', notes: 'Ground. Shared by both boards, or the signals mean nothing.' },
    { from: 'GPIO 16 (RX2)', to: 'radar TX', notes: 'Crossed on purpose: the radar transmits, the ESP32 receives.' },
    { from: 'GPIO 17 (TX2)', to: 'radar RX', notes: 'And the other way round. This lab never sends anything to the radar, but wire it now so S3 and S4 need no changes.' },
  ],
  steps: [
    'Make `labs/s2-raw-bytes` with the two files from the code tab, or run the PowerShell block from the repo root.',
    '**Unplug USB.** Find the four markings on the radar board: `5V`, `GND`, `TX`, `RX`. Tape a flag on each wire and write its name on it.',
    'Connect the wires from the table, one at a time, ticking each off against the radar board markings. Then check the whole set a second time, and confirm that **only** the `5V` wire goes to VIN.',
    'Plug USB in, run the command, and watch the monitor.',
    'You should see a frame line about ten times a second, 30 bytes each, starting `AA FF 03 00` and ending `55 CC`. Every two seconds a rate line reports about 10.0 frames per second.',
    'Stand in front of the radar and move. The bytes between `00` and `55 CC` change. When nobody is in range they are all `00`.',
    'Type `raw` to see every byte as it arrives (type it again to stop), `frames` to hide or show the frame lines, and `stats` for totals.',
  ],
  fallback: {
    title: 'No radar yet?',
    text: 'The lab runs without it. It prints `No bytes from the radar` every two seconds with the wiring to check. To see real frame bytes in the meantime, read the example frame in the next lesson (S3).',
  },
  tips: [
    '**Silence?** Re-read the wiring message, then unplug USB and swap the TX and RX wires. The most common mistake is joining TX to TX.',
    '**Garbage or bad tails?** Both ends must run at 256000. `bad tails` should stay at 0 once the wires are good.',
    '**The kit cable.** The brief says 1.25 mm, but the manual drawing of the radar pin header shows 2.0 mm, so the plug pitch is **unconfirmed**. Measure the plug on your cable before you buy anything. If the far end already has ordinary Dupont sockets, push them straight onto the ESP32 pins. If it has bare wire or a different plug, cut a female-to-female jumper in half, twist or solder the wires on, cover the joint with heat-shrink and label it. Or buy a cable that matches the radar plug.',
    '**Metal near the radar.** Keep the board and wires off the radar face. Hold it steady so the targets are not just the wire moving.',
  ],
  warnings,
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Abridged: the real monitor prints ten frame lines a second. The first frame is the official example from the LD2450 protocol document, not a live capture. The empty frame follows the same layout with all target bytes zero.',
    boot: [
      { t: '14:31:10.502', text: '[I] Radar on UART2: RX GPIO 16, TX GPIO 17, 256000 baud 8N1.' },
      { t: '14:31:10.503', text: '[I] Looking for frames: header AA FF 03 00, 30 bytes, tail 55 CC.' },
      { t: '14:31:10.504', text: 'Commands: frames | raw | stats | reset | help' },
      { t: '14:31:10.598', text: `[598 ms] frame #1: ${OFFICIAL}`, cls: 'hi' },
      { t: '14:31:10.698', text: `[698 ms] frame #2: ${OFFICIAL}`, cls: 'hi' },
      { t: '14:31:10.798', text: `[798 ms] frame #3: ${EMPTY}`, cls: 'hi' },
      { t: '14:31:12.504', text: '[I] 20 frames in 2 s (10.0 per second), 0 bad tails, 600 bytes', cls: 'dim' },
    ],
    commands: [
      {
        cmd: 'stats',
        reply: [
          { text: '[I] bytes 600, frames 20, bad tails 0, last byte 31 ms ago' },
          { text: '[I] frame printing on, raw bytes off' },
        ],
      },
      { cmd: 'frames', reply: [{ text: '[I] frame printing off' }] },
      { cmd: 'raw', reply: [{ text: '' }, { text: '[I] raw bytes on' }, { text: 'AA FF 03 00 0E 03 B1 86 10 00 40 01 00 00 00 00' }] },
      { cmd: 'reset', reply: [{ text: '[I] counters cleared' }] },
      { cmd: 'help', reply: [{ text: 'Commands: frames | raw | stats | reset | help' }] },
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
  ],
  chipBlocks: ['uart', 'gpio', 'timers'],
  hotspots: ['headers', 'module'],
  unverified: [
    'The radar plug pitch is unconfirmed: retailers say 1.25 mm, the manual drawing of the pin header shows 2.0 mm. Measure yours.',
    'The LD2450 RX pin input tolerance is not stated in the documents. The ESP32 sends 3.3 V, which is the intended connection.',
    'The protocol document and manual used here are mirrors of the Hi-Link originals, not downloaded from hlktech.net.',
    'The rate line and byte counts in the example output are what the documented 10 frames per second would give, not a recording.',
  ],
};

export default lesson;
