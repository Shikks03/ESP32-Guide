import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/02-touch/platformio.ini?raw';
import main from '../../../../labs/02-touch/src/main.cpp?raw';


const lesson: Lesson = {
  id: '02',
  code: '02',
  track: 'intro',
  name: 'First circuit',
  title: 'A wire that feels touch',
  status: 'built',
  pitch: 'Your first circuit is one jumper wire. The ESP32 can sense a finger on GPIO 4, and you steer the LED by typing commands while it keeps animating.',
  runsOn: 'board',
  labDir: 'labs/02-touch',
  onBoard: [
    { k: 'GPIO 4', v: 'touch wire', signal: true },
    { k: 'GPIO 2', v: 'LED', signal: true },
  ],
  learn: ['touch pins', 'PWM brightness', 'state machines', 'serial commands'],
  command: 'pio run -d labs/02-touch -t upload -t monitor',
  scaffold: buildScaffold('labs/02-touch', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
  ]),
  wire: [
    {
      from: 'GPIO 4',
      to: 'jumper wire',
      notes: 'Push one end on the pin and leave the other end loose. The wire is the sensor.',
    },
    {
      from: 'GPIO 23',
      to: '220–330 Ω resistor, then LED long leg',
      notes: 'Later, when you have parts, as an optional breadboard version (02b). LED short leg goes to GND.',
      later: true,
    },
  ],
  steps: [
    'Make `labs/02-touch` with the two files from the code tab, or run the PowerShell block from the repo root.',
    'Unplug USB. Push one end of a jumper wire onto the **GPIO 4** pin and leave the other end hanging in the air.',
    'Plug USB back in and run the command. The LED starts breathing.',
    'Type `touch` in the monitor. It prints the live reading (type it again to stop). Note the number untouched, then pinch the loose end of the wire and note it again. The reading goes **down** when a finger gets close.',
    'Edit `TOUCH_THRESHOLD` so it sits between your two numbers, then upload again. Touching the wire should now flash the LED at full brightness.',
    'Type `blink 200`, `sos`, `level 30`, `on`, `off`.',
  ],
  fallback: {
    title: 'No jumper wire yet?',
    text: 'Touch the GPIO 4 header pin itself with a fingertip. It works the same way; the wire just gives you something easier to grip.',
  },
  tips: [
    '**No resistor, LED or breadboard needed.** The LED is already on the board. **Numbers barely move?** Female jumper ends hide the metal, so grip the whole end firmly, or touch the GPIO 4 pin itself.',
  ],
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'This is a simulation of the commands above. Click one and watch the LED on the board drawing.',
    boot: [],
    // Sample-command chips from the original. With the led-02 engine the replies
    // come from runLedCommand(), so each reply list is empty here.
    commands: ['fade', 'blink 200', 'sos', 'level 30', 'on', 'off', 'touch', 'help'].map((cmd) => ({ cmd, reply: [] })),
    engine: 'led-02',
    led: { mode: 'fade', blinkMs: 500, level: 255 },
  },
  pins: [
    { pin: '4', tag: 'touch wire', signal: true },
    { pin: '2', tag: 'LED', signal: true },
  ],
  parts: ['board', 'jumpers'],
  optionalParts: ['breadboard', 'led'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
  ],
  chipBlocks: ['touch', 'ledc', 'gpio', 'uart', 'timers'],
  hotspots: ['headers', 'leds', 'module'],
};

export default lesson;
