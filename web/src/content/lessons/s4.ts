import type { Lesson, Rich } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/s4-room-view/platformio.ini?raw';
import main from '../../../../labs/s4-room-view/src/main.cpp?raw';
import secrets from '../../../../labs/s4-room-view/include/secrets.example.h?raw';

const warnings: Rich[] = [
  '**Check every wire before you plug in USB.** The radar needs 5 V on its `5V` pin and nothing else. 5 V on a signal pin can kill the radar or the ESP32, whose pins are 3.3 V only. Unplug USB whenever you touch a wire.',
  '**Label the wires from the markings printed on the radar board, not from wire colours.** The docs name the pins `5V`, `GND`, `TX` and `RX`. Tape a flag on each wire and write its name on it.',
];

const lesson: Lesson = {
  id: 's4',
  code: 'S4',
  track: 'radar',
  name: 'See yourself move',
  title: 'See yourself move',
  status: 'built',
  pitch: 'The ESP32 serves a web page that draws the room from above and moves a dot for every target, live. Open it on your phone and watch yourself walk around.',
  runsOn: 'board',
  labDir: 'labs/s4-room-view',
  onBoard: [
    { k: 'GPIO 16', v: 'RX2 <- radar TX', signal: true },
    { k: 'GPIO 17', v: 'TX2 -> radar RX', signal: true },
    { k: 'VIN', v: '5 V to radar' },
    { k: 'GND', v: 'ground' },
  ],
  learn: ['joining Wi-Fi from secrets.h', 'a web page inside firmware', 'Server-Sent Events', 'drawing mm on a canvas'],
  command: 'pio run -d labs/s4-room-view -t upload -t monitor',
  scaffold: buildScaffold('labs/s4-room-view', [
    { path: 'platformio.ini', text: ini },
    { path: 'include/secrets.example.h', text: secrets },
    { path: 'src/main.cpp', text: main },
  ]),
  wire: [
    { from: 'VIN', to: 'radar 5V', notes: 'Power. Same wiring as S2 and S3.' },
    { from: 'GND', to: 'radar GND', notes: 'Ground.' },
    { from: 'GPIO 16 (RX2)', to: 'radar TX', notes: 'Radar transmits, ESP32 receives.' },
    { from: 'GPIO 17 (TX2)', to: 'radar RX', notes: 'Other direction.' },
  ],
  steps: [
    'Make `labs/s4-room-view` with the three files from the code tab, or run the PowerShell block from the repo root.',
    'Copy `include/secrets.example.h` to `include/secrets.h` and put your own 2.4 GHz network name and password in it: `Copy-Item labs\\s4-room-view\\include\\secrets.example.h labs\\s4-room-view\\include\\secrets.h`. `secrets.h` is gitignored. Without it the lab still builds and tells you what is missing.',
    '**Unplug USB**, check the radar wiring against the S2 table (labels from the radar board, 5 V only on VIN), then plug in.',
    'Run the command. Wait for `Wi-Fi joined. IP ...` and the `Open http://...` line.',
    'Open that address on a phone or laptop on the **same Wi-Fi network**. The page says `live` once the stream connects.',
    'Stand in front of the radar. A numbered dot appears and follows you. Dots outside the room are drawn hollow at the edge.',
    'Walk to your left and see which way the dot goes. If left and right are swapped, set `FLIP_X` to `true` at the top of `main.cpp` and upload again.',
    'Open the page on a second device. The firmware serves up to three viewers at once. A fourth is turned away.',
  ],
  fallback: {
    title: 'No Wi-Fi details yet, or no radar?',
    text: 'Without `secrets.h` the board prints what to do and skips the web page, but the radar side keeps running (type `targets` to see parsed targets in the monitor). Without a radar the page loads and says `no targets`.',
  },
  tips: [
    '**The room.** The page draws a room of 2,220 by 2,160 mm with the radar at the bottom centre and y pointing straight out into the room. Change `ROOM_W_MM` and `ROOM_D_MM` at the top of `main.cpp` for a different space. The dashed lines show the radar\'s ±60° field of view.',
    '**Where the radar sits is decided later.** Mounting position and rotation are part of the Zones track. For now the radar is simply at the bottom centre of the picture.',
    '**Nothing leaves your network.** The page is inline in the firmware, with no CDN and no cloud. It has no password, so anyone on your Wi-Fi can open it.',
    '**Page loads but stays on `connecting`?** The stream is a second server on port 81. A guest network or a router setting that isolates devices from each other may block it.',
    '**Why not `bench.local`?** That comes from the Wi-Fi track (W3). Here you use the IP address printed at boot.',
  ],
  warnings,
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Example output. The network name and IP address are made up; yours are printed at boot. The `targets` sample uses the official example frame from the protocol document.',
    boot: [
      { t: '14:55:00.511', text: '[I] Radar on UART2: RX GPIO 16, TX GPIO 17, 256000 baud 8N1.' },
      { t: '14:55:00.512', text: '[I] Room 2220 x 2160 mm, radar at the bottom centre.' },
      { t: '14:55:00.514', text: '[I] Joining "MyNetwork-2G"...' },
      { t: '14:55:00.515', text: 'Commands: status | targets | help' },
      { t: '14:55:04.120', text: '[I] Wi-Fi joined. IP 192.168.1.42, signal -58 dBm', cls: 'hi' },
      { t: '14:55:04.121', text: '[I] Open http://192.168.1.42/ on a phone or laptop on the same network.', cls: 'hi' },
      { t: '14:55:19.760', text: '[I] viewer connected (1 of 3)' },
    ],
    commands: [
      {
        cmd: 'status',
        reply: [
          { text: '[I] Wi-Fi: "MyNetwork-2G", IP 192.168.1.42, signal -58 dBm' },
          { text: '[I] viewers 1 of 3, frames 412, bad tails 0, serial targets off' },
        ],
      },
      {
        cmd: 'targets',
        reply: [
          { text: '[I] serial targets on' },
          { text: '[24415 ms] T1 x=-782 y=1713 v=-16 |', cls: 'hi' },
        ],
      },
      { cmd: 'help', reply: [{ text: 'Commands: status | targets | help' }] },
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
  parts: ['board', 'ld2450', 'wifi', 'phone'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'include/secrets.example.h', text: secrets, lang: 'cpp' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
  ],
  chipBlocks: ['uart', 'wifi', 'gpio', 'timers'],
  hotspots: ['headers', 'module', 'antenna'],
  unverified: [
    'Which side of the radar is positive x is not confirmed. `FLIP_X` exists so you can fix it after one test walk.',
    'The radar field of view lines use the manual\'s ±60° azimuth. The pitch limit (±35°) does not show in a top-down view.',
    'Whether a stalled phone can briefly slow the loop is untested. Writes to each viewer are limited to 100 ms.',
    'The network name, IP address and signal strength in the example output are illustrative.',
  ],
};

export default lesson;
