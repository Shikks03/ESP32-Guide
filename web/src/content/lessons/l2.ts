import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/l2-switch/platformio.ini?raw';
import main from '../../../../labs/l2-switch/src/main.cpp?raw';
import secrets from '../../../../labs/l2-switch/include/secrets.example.h?raw';

const URL_ON = '[I] GET http://192.168.1.50/rpc/RGBCCT.Set?id=0&on=true';
const URL_OFF = '[I] GET http://192.168.1.50/rpc/RGBCCT.Set?id=0&on=false';

const lesson: Lesson = {
  id: 'l2',
  code: 'L2',
  track: 'bulb',
  name: 'Switch it from the ESP32',
  title: 'Switch it from the ESP32',
  status: 'built',
  pitch: 'Type `on`, `off` or `toggle` in the serial monitor and the ESP32 sends the HTTP request that switches the bulb. Wi-Fi plus `HTTPClient`, no cloud.',
  runsOn: 'board',
  labDir: 'labs/l2-switch',
  onBoard: [{ k: 'Wi-Fi', v: 'join + HTTP GET to the bulb', signal: true }],
  learn: ['HTTPClient GET', 'timeouts', 'HTTP status codes', 'secrets.h'],
  command: 'pio run -d labs/l2-switch -t upload -t monitor',
  scaffold: buildScaffold('labs/l2-switch', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
    { path: 'include/secrets.example.h', text: secrets },
  ]),
  wire: null,
  steps: [
    'Finish **L1** first: you need the bulb\'s IP address and a confirmed `RGBCCT.Set` that works from `curl.exe`.',
    'Make `labs/l2-switch` with the three files from the code tab, or run the PowerShell block from the repo root. Open that folder on its own in VS Code.',
    'Copy `include/secrets.example.h` to `include/secrets.h` (for example `Copy-Item labs\\l2-switch\\include\\secrets.example.h labs\\l2-switch\\include\\secrets.h`) and fill in your 2.4 GHz network name, its password and the bulb\'s IP. **Never commit `secrets.h`.**',
    'Run the command. The board joins Wi-Fi and prints its IP and signal strength. With the placeholders still in place it tells you to create `secrets.h` and does not try to connect.',
    'Type `on`, then `off`, then `toggle`. Each one prints the address it called, the HTTP status and the bulb\'s reply.',
    'Type `status`. Compare the reply with what the light is doing.',
    'Unplug the bulb (or change `BULB_IP` to a wrong address) and type `on`. You should get an error after a few seconds, not a freeze. That is what the timeouts are for.',
  ],
  tips: [
    '**No answer from the bulb?** The board and the bulb must be on the same network. Check `BULB_IP` against the address L1 worked with, and that the board printed `joined`.',
    '**`could not join Wi-Fi`?** Check the name and password, and that the network is 2.4 GHz. The ESP32 radio cannot see 5 GHz.',
    '**The monitor feels stuck for a moment?** A request waits up to a few seconds for the bulb, and nothing else runs meanwhile. What you type is queued and handled right after.',
    '**HTTP 401?** A password is set on the bulb (`auth_en` in L1). This lab does not do the digest handshake, so either turn it off on the bulb or add it yourself later.',
  ],
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Example output with made-up addresses. `status` is shortened: the real reply has more fields. Click a command to see what the board would print.',
    boot: [
      { t: '14:02:00.512', text: '[I] L2 switch. Bulb at 192.168.1.50.' },
      { t: '14:02:00.514', text: '[I] joining "HomeWiFi" ...' },
      { t: '14:02:03.870', text: '[I] joined, my IP 192.168.1.60, RSSI -58 dBm', cls: 'hi' },
      { t: '14:02:03.872', text: 'Commands: on | off | toggle | status | help' },
    ],
    commands: [
      { cmd: 'on', reply: [{ text: URL_ON }, { text: '[I] HTTP 200', cls: 'hi' }, { text: '[I] reply: null' }] },
      { cmd: 'off', reply: [{ text: URL_OFF }, { text: '[I] HTTP 200', cls: 'hi' }, { text: '[I] reply: null' }] },
      {
        cmd: 'toggle',
        reply: [
          { text: '[I] GET http://192.168.1.50/rpc/RGBCCT.Toggle?id=0' },
          { text: '[I] HTTP 200', cls: 'hi' },
          { text: '[I] reply: (JSON from the bulb)', cls: 'dim' },
        ],
      },
      {
        cmd: 'status',
        reply: [
          { text: '[I] GET http://192.168.1.50/rpc/RGBCCT.GetStatus?id=0' },
          { text: '[I] HTTP 200', cls: 'hi' },
          { text: '[I] reply: {"id":0,"output":true,"mode":"cct","brightness":40,"ct":3000, ...}' },
        ],
      },
      { cmd: 'help', reply: [{ text: 'Commands: on | off | toggle | status | help' }] },
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
    'The reply shapes shown for `status` are shortened and illustrative. Field names are the ones the docs list for `RGBCCT.GetStatus`; values are made up.',
    'Whether the bulb accepts plain HTTP without a password out of the box (`auth_en`). Check it in L1.',
  ],
};

export default lesson;
