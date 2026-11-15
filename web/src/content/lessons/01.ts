import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/01-hello/platformio.ini?raw';
import main from '../../../../labs/01-hello/src/main.cpp?raw';


const lesson: Lesson = {
  id: '01',
  code: '01',
  track: 'intro',
  name: 'Hello',
  title: 'Meet the board',
  status: 'runs',
  pitch: "Flash your first program. It prints the chip's identity card and blinks the on-board LED twice a second.",
  runsOn: 'board',
  labDir: 'labs/01-hello',
  onBoard: [{ k: 'GPIO 2', v: 'on-board LED', signal: true }],
  learn: ['setup() and loop()', 'Serial logging', 'millis()', 'flashing'],
  command: 'pio run -d labs/01-hello -t upload -t monitor',
  scaffold: buildScaffold('labs/01-hello', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
  ]),
  wire: null,
  steps: [
    'Make `labs/01-hello` with the two files from the code tab, or run the PowerShell block from the repo root. Nothing to wire, so keep the cable in the Type-C port.',
    'Run the command. **The first build downloads the whole ESP32 toolchain and takes several minutes** (yours took about 8, once only). Later builds are quick. Wait for `Hard resetting via RTS pin…`',
    'Read the identity card. A WROOM-32 normally shows 2 cores at 240 MHz, 4 MB flash and 0 KB PSRAM. The `rev` number looks odd on this core: `301` means silicon revision v3.1 (major × 100 + minor), not “revision 301”.',
    'Watch the blue on-board LED blink.',
    'Press `Ctrl+C` to leave the monitor.',
  ],
  warnings: [
    'The first build downloads the whole ESP32 toolchain and takes several minutes. Do not cancel it; it only happens once.',
  ],
  tips: [
    '**No blinking?** Some boards have no LED on GPIO 2. Change `PIN_LED` at the top of `main.cpp`, or rely on the serial output. **Garbled text?** `monitor_speed` must be 115200.',
    '**Which chip did you get?** The `chip` line names it. The WROOM-32 datasheet lists the ESP32-D0WDQ6, while the newer WROOM-32E uses the ESP32-D0WD-V3, so the line tells you which variant is on your board.',
  ],
  preview: {
    title: 'pio device monitor',
    baud: '115200 baud',
    caption: 'The LED on the board drawing blinks just like the real one. Example output, yours will differ, especially the chip, heap and mac lines.',
    boot: [
      { t: '14:02:00.021', text: '' },
      { t: '14:02:00.145', text: '+---------- ESP32 identity card ----------+' },
      { t: '14:02:00.213', text: '| chip  ESP32-D0WD-V3 rev 301, 2 cores @ 240 MHz' },
      { t: '14:02:00.322', text: '| flash 4 MB' },
      { t: '14:02:00.445', text: '| psram 0 KB (0 is normal on a WROOM-32)' },
      { t: '14:02:00.593', text: '| heap  289 KB free' },
      { t: '14:02:00.733', text: '| mac   A0B7653C91E4' },
      { t: '14:02:00.875', text: '| sdk   v5.5.5' },
      { t: '14:02:01.016', text: '+-----------------------------------------+' },
      { t: '14:02:01.142', text: 'LED on GPIO 2. It should blink twice a second.', cls: 'hi' },
    ],
    led: { mode: 'blink', blinkMs: 500, level: 255 },
  },
  pins: [{ pin: '2', tag: 'LED', signal: true }],
  parts: ['board'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
  ],
  chipBlocks: ['cpu', 'sram', 'flash', 'efuse', 'gpio', 'uart', 'timers'],
  hotspots: ['usb', 'leds', 'module'],
  unverified: [
    'The exact chip string and revision number in the example output are illustrative. They depend on the silicon your board carries; run the lab to see yours.',
  ],
};

export default lesson;
