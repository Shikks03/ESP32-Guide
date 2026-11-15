import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/l3-scenes/platformio.ini?raw';
import main from '../../../../labs/l3-scenes/src/main.cpp?raw';
import secrets from '../../../../labs/l3-scenes/include/secrets.example.h?raw';

const B = 'http://192.168.1.50/rpc/RGBCCT.Set?id=0&on=true';
const ok = [{ text: '[I] HTTP 200', cls: 'hi' as const }, { text: '[I] reply: null' }];

const lesson: Lesson = {
  id: 'l3',
  code: 'L3',
  track: 'bulb',
  name: 'Scenes',
  title: 'Scenes',
  status: 'built',
  pitch: 'Name your lighting: `desk` is bright and cool, `bed` is dim and warm, plus colours and dials for brightness and colour temperature, all with a smooth fade.',
  runsOn: 'board',
  labDir: 'labs/l3-scenes',
  onBoard: [{ k: 'Wi-Fi', v: 'RGBCCT.Set with mode, brightness, ct or rgb', signal: true }],
  learn: ['scenes as data', 'colour temperature', 'URL-encoding', 'transition_duration'],
  command: 'pio run -d labs/l3-scenes -t upload -t monitor',
  scaffold: buildScaffold('labs/l3-scenes', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
    { path: 'include/secrets.example.h', text: secrets },
  ]),
  wire: null,
  steps: [
    'Finish **L2** first. Make `labs/l3-scenes` with the three files from the code tab, or run the PowerShell block from the repo root, and open that folder on its own in VS Code.',
    'Copy your L2 `secrets.h` into `labs/l3-scenes/include/`, or copy `secrets.example.h` to `secrets.h` and fill it in again. **Never commit `secrets.h`.**',
    'Run the command and wait for `joined`.',
    'Type `desk`, then `bed`. Watch the bulb fade between a bright cool white and a dim warm white.',
    'Type `red`, `blue`, `purple`. Then `desk` again: the bulb goes back to white, because every scene sends its `mode`.',
    'Try the dials: `bright 30`, `ct 4000`, `ct 2700`. Then `fade 0` and `desk` to see an instant change, and `fade 5` for a slow one.',
    'Edit a row in `SCENES` (say, make `desk` 5000 K) and upload again. Add your own row, for example `reading`.',
  ],
  tips: [
    '**`desk` is 6000 K, not the maximum 6500.** That is a taste choice: cool and bright without being harsh. Change the number in the `SCENES` table.',
    '**`bed` still too bright at night?** Brightness is a percent and the eye is not linear, so 10 % can look brighter than it sounds. Try 3 to 5.',
    '**`bright` only changes brightness.** It leaves the current white or colour as it is. `ct` also switches to white mode, because a colour temperature only means something in white mode.',
    '**Colours look wrong or nothing happens?** Send `status` and read the `mode` in the reply. The `rgb` part is URL-encoded by the code (`%5B255%2C0%2C0%5D` for `[255,0,0]`), which you can see in the printed address.',
  ],
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Example output with made-up addresses. Click a command to see the address the board would call. The fade is 2 seconds until you change it.',
    boot: [
      { t: '14:02:00.512', text: '[I] L3 scenes. Bulb at 192.168.1.50.' },
      { t: '14:02:00.514', text: '[I] joining "HomeWiFi" ...' },
      { t: '14:02:03.870', text: '[I] joined, my IP 192.168.1.60, RSSI -58 dBm', cls: 'hi' },
      { t: '14:02:03.872', text: 'Scenes:   desk | bed | red | blue | purple' },
      { t: '14:02:03.873', text: 'Dials:    bright <0-100> | ct <2700-6500> | fade <seconds>' },
      { t: '14:02:03.874', text: 'Basics:   on | off | toggle | status | help' },
    ],
    commands: [
      { cmd: 'desk', reply: [{ text: '[I] scene desk' }, { text: `[I] GET ${B}&mode=cct&brightness=100&ct=6000&transition_duration=2` }, ...ok] },
      { cmd: 'bed', reply: [{ text: '[I] scene bed' }, { text: `[I] GET ${B}&mode=cct&brightness=10&ct=2700&transition_duration=2` }, ...ok] },
      { cmd: 'red', reply: [{ text: '[I] scene red' }, { text: `[I] GET ${B}&mode=rgb&brightness=60&rgb=%5B255%2C0%2C0%5D&transition_duration=2` }, ...ok] },
      { cmd: 'purple', reply: [{ text: '[I] scene purple' }, { text: `[I] GET ${B}&mode=rgb&brightness=60&rgb=%5B128%2C0%2C255%5D&transition_duration=2` }, ...ok] },
      { cmd: 'bright 30', reply: [{ text: `[I] GET ${B}&brightness=30&transition_duration=2` }, ...ok] },
      { cmd: 'ct 4000', reply: [{ text: `[I] GET ${B}&mode=cct&ct=4000&transition_duration=2` }, ...ok] },
      { cmd: 'fade 5', reply: [{ text: '[I] fade is now 5 s' }] },
      { cmd: 'off', reply: [{ text: '[I] GET http://192.168.1.50/rpc/RGBCCT.Set?id=0&on=false&transition_duration=2' }, ...ok] },
      { cmd: 'help', reply: [{ text: 'Scenes:   desk | bed | red | blue | purple' }, { text: 'Dials:    bright <0-100> | ct <2700-6500> | fade <seconds>' }, { text: 'Basics:   on | off | toggle | status | help' }] },
    ],
  },
  pins: [],
  usb: true,
  parts: ['board', 'wifi', 'shelly'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'include/secrets.example.h', text: secrets, lang: 'cpp' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
  ],
  chipBlocks: ['wifi', 'cpu', 'sram'],
  hotspots: ['antenna', 'module'],
  unverified: [
    'This firmware only builds so far; it has not been flashed or run against a real bulb. Previews are what it is written to print, not captured output.',
    'Whether sending only `rgb` or only `ct` switches the colour or white mode is not stated in the docs. Every scene and the `ct` command send `mode` explicitly. `bright` does not, so it keeps the current mode.',
    'The `rgb` array is sent percent-encoded (`%5B255%2C0%2C0%5D`). The docs show raw brackets in their example URL. The encoded form is standard URL practice but has not been tried on a real bulb.',
    'What a request without `transition_duration` does (the bulb has its own config value). With `fade 0` this lab sends none, so check the behaviour on your bulb.',
    'The `desk` colour temperature (6000 K), the `bed` brightness (10 %) and the colour brightness (60 %) are choices made here, not from the docs. The documented range is 2700 to 6500 K and 0 to 100 %.',
  ],
};

export default lesson;
