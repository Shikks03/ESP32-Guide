import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/s1-loopback/platformio.ini?raw';
import main from '../../../../labs/s1-loopback/src/main.cpp?raw';

const lesson: Lesson = {
  id: 's1',
  code: 'S1',
  track: 'radar',
  name: 'UART loopback',
  title: 'UART loopback',
  status: 'built',
  pitch: 'Join GPIO 16 to GPIO 17 with one jumper and make the ESP32 talk to itself on UART2 at 256000 baud. It is a dress rehearsal for the radar wiring, with no radar to break.',
  runsOn: 'board',
  labDir: 'labs/s1-loopback',
  onBoard: [
    { k: 'GPIO 16', v: 'RX2 (listens)', signal: true },
    { k: 'GPIO 17', v: 'TX2 (talks)', signal: true },
  ],
  learn: ['UART and baud', 'Serial2 on your own pins', 'counting bytes', 'why it fails when unwired'],
  command: 'pio run -d labs/s1-loopback -t upload -t monitor',
  scaffold: buildScaffold('labs/s1-loopback', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
  ]),
  wire: [
    {
      from: 'GPIO 17 (TX2)',
      to: 'GPIO 16 (RX2)',
      notes: 'One jumper wire joins the pin that sends to the pin that listens. They sit next to each other in the right-hand header. Whatever the ESP32 sends comes straight back in.',
    },
  ],
  steps: [
    'Make `labs/s1-loopback` with the two files from the code tab, or run the PowerShell block from the repo root.',
    'Unplug USB. Push one jumper wire between **GPIO 17** (TX2) and **GPIO 16** (RX2). They are neighbours on the right-hand row, between D5 and D4.',
    'Plug USB back in and run the command. The board sends `ping` to itself at boot and reports whether it came back.',
    'Type `send hello`. You should see the same five bytes come back with `0 wrong`.',
    'Type `burst`. It sends 256 bytes, one of every value from 0x00 to 0xFF, and checks each one in order. Note the time. At 256000 baud one byte takes about 39 µs, so 256 bytes need about 10 ms on the wire.',
    'Type `stats` to see the running totals.',
    '**Now pull the jumper out** and type `send hello` again. Nothing comes back, and the monitor says so. That is exactly what a missing or crossed radar wire looks like, so remember it for S2.',
    'Put the jumper back and run `send hello` once more to confirm it recovers.',
  ],
  fallback: {
    title: 'No jumper wire yet?',
    text: 'You can still run the lab without one. Everything works except the happy path: `send hello` reports that nothing came back, which is the failure case from step 7. Add the wire later to see it succeed.',
  },
  tips: [
    '**Why 256000?** That is the speed the LD2450 radar talks at by default. If you change `RADAR_BAUD` here nothing breaks, because both ends of the wire are the same chip, but the real radar would stop making sense.',
    '**Why pass 16 and 17 explicitly?** In the current Arduino core 3.x the default pins of `Serial2` are 4 and 25, not 16 and 17 as in older guides. Giving the pins in `begin()` avoids that trap.',
    '**Two serial ports, two speeds.** The USB monitor uses UART0 (GPIO 1 and 3) at 115200. The loopback and, later, the radar use UART2 at 256000. They are separate wires and separate settings. Never connect anything to GPIO 1 or 3.',
    '**`stray` bytes in `stats`?** With the jumper out, GPIO 16 is not connected to anything and can pick up noise. The lab counts bytes that arrive when no test is waiting for them. A few stray bytes on a floating pin are not a fault.',
  ],
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Example output for a board with GPIO 16 joined to GPIO 17. The microsecond figures are illustrative, yours will differ a little. Counts in `stats` are from a fresh boot.',
    boot: [
      { t: '14:20:00.512', text: '[I] UART2 ready: 256000 baud, 8N1, RX GPIO 16, TX GPIO 17.' },
      { t: '14:20:00.514', text: '[I] Join GPIO 16 to GPIO 17 with one jumper wire, then type: send hello' },
      { t: '14:20:00.515', text: 'Commands: send <text> | burst | stats | help' },
      { t: '14:20:00.516', text: '[I] self-test: sending "ping"' },
      { t: '14:20:00.517', text: '[I] back: "ping"', cls: 'hi' },
      { t: '14:20:00.517', text: '[I] 4 of 4 bytes came back, 0 wrong, 214 us', cls: 'hi' },
    ],
    commands: [
      {
        cmd: 'send hello',
        reply: [
          { text: '[I] sent 5 bytes: "hello"' },
          { text: '[I] back: "hello"', cls: 'hi' },
          { text: '[I] 5 of 5 bytes came back, 0 wrong, 231 us', cls: 'hi' },
        ],
      },
      {
        cmd: 'send ping',
        reply: [
          { text: '[I] sent 4 bytes: "ping"' },
          { text: '[I] back: "ping"', cls: 'hi' },
          { text: '[I] 4 of 4 bytes came back, 0 wrong, 214 us', cls: 'hi' },
        ],
      },
      {
        cmd: 'burst',
        reply: [
          { text: '[I] sent 256 bytes (every value 0x00 to 0xFF)' },
          { text: '[I] 256 of 256 bytes came back, 0 wrong, 10208 us', cls: 'hi' },
        ],
      },
      {
        cmd: 'stats',
        reply: [
          { text: '[I] UART2 at 256000 baud 8N1, RX GPIO 16, TX GPIO 17' },
          { text: '[I] bytes sent 4, back 4, wrong 0, stray 0' },
          { text: '[I] tests ok 1, failed 0' },
          { text: '[I] one byte takes about 39 us on the wire' },
        ],
      },
      {
        cmd: 'help',
        reply: [{ text: 'Commands: send <text> | burst | stats | help' }],
      },
    ],
    sketch: [{ from: '17', to: 'GPIO 16 (RX2)', color: 'signal' }],
  },
  pins: [
    { pin: '16', tag: 'RX2', signal: true },
    { pin: '17', tag: 'TX2', signal: true },
  ],
  parts: ['board', 'jumpers'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
  ],
  chipBlocks: ['uart', 'gpio', 'timers'],
  hotspots: ['headers', 'module'],
  unverified: [
    'The microsecond figures in the example output are illustrative. They depend on how fast `loop()` spots the returning bytes. The 39 µs per byte is plain arithmetic (10 bits at 256000 baud).',
  ],
};

export default lesson;
