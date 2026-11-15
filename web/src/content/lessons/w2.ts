import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/w2-web-switch/platformio.ini?raw';
import main from '../../../../labs/w2-web-switch/src/main.cpp?raw';
import secrets from '../../../../labs/w2-web-switch/include/secrets.example.h?raw';

const lesson: Lesson = {
  id: 'w2',
  code: 'W2',
  track: 'wifi',
  name: 'Web switch',
  title: 'A switch on a web page',
  status: 'built',
  pitch: 'The board serves its own web page with one big button. Open it on your phone and the blue LED on GPIO 2 follows your thumb.',
  runsOn: 'board',
  labDir: 'labs/w2-web-switch',
  onBoard: [
    { k: 'GPIO 2', v: 'LED', signal: true },
    { k: 'Wi-Fi', v: 'web server on port 80' },
  ],
  learn: ['a web server on the chip', 'routes and handlers', 'JSON replies', 'a phone on the same network'],
  command: 'pio run -d labs/w2-web-switch -t upload -t monitor',
  scaffold: buildScaffold('labs/w2-web-switch', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
    { path: 'include/secrets.example.h', text: secrets },
  ]),
  wire: null,
  steps: [
    'Make `labs/w2-web-switch` with the three files from the code tab, or run the PowerShell block. Nothing to wire. Open the lab folder on its own in VS Code.',
    'Copy the settings file again for this lab: `Copy-Item labs\\w2-web-switch\\include\\secrets.example.h labs\\w2-web-switch\\include\\secrets.h`, then put in your 2.4 GHz network name and password. Each lab has its own `secrets.h`.',
    'Run the command and wait for `Open http://192.168.….` followed by an address. That is the board\'s IP on your network.',
    'Take your **phone**, make sure it is on the same Wi-Fi (not mobile data), and open that address in the browser. Type the `http://` part yourself.',
    'Tap the big button. The blue LED on the board switches, and the monitor prints `LED on` or `LED off`.',
    'Now type `on` and `off` in the monitor. Within about two seconds the phone page follows, because the page asks the board for its state every 2 seconds.',
    'Optional: from PowerShell run `curl.exe http://<your-board-ip>/state`, then `curl.exe "http://<your-board-ip>/led?on=1"`. That is all the phone page does.',
  ],
  fallback: {
    title: 'No phone handy?',
    text: 'Open the same address in the browser on your laptop. It must be on the same Wi-Fi as the board. The page is plain HTML, so any browser works.',
  },
  tips: [
    '**Page will not load on the phone?** Check the phone is on the same network, not mobile data. Guest networks often stop devices from talking to each other, so use your main one. If the browser added `https://`, change it to `http://`.',
    '**Browser says "not secure"?** That is normal here. The page is plain HTTP on your home network. It is why this lab never goes anywhere near the internet.',
    '**Nothing in the monitor but "Still trying to join"?** Same checks as W1: name, password, and that it is the 2.4 GHz network.',
  ],
  warnings: [
    'There is no password on this page. Anyone on your Wi-Fi who knows the address can press the button. Keep it on your home network and never forward a port on your router to it.',
  ],
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Example address, not yours. The commands below are what you type in the monitor; the phone page runs the same logic through your browser.',
    boot: [
      { t: '09:41:00.512', text: '[I] W2 web switch. LED on GPIO 2 is off.' },
      { t: '09:41:00.514', text: 'Commands: on | off | ip | help' },
      { t: '09:41:00.516', text: '[I] Joining "BenchNet"...' },
      { t: '09:41:02.830', text: '[I] Joined "BenchNet".' },
      { t: '09:41:02.832', text: '[I] Web server started on port 80.' },
      { t: '09:41:02.834', text: '[I] Open http://192.168.1.42/ on a phone on the same Wi-Fi. RSSI -48 dBm', cls: 'hi' },
    ],
    commands: [
      { cmd: 'on', reply: [{ text: '[I] LED on' }] },
      { cmd: 'off', reply: [{ text: '[I] LED off' }] },
      { cmd: 'ip', reply: [{ text: '[I] Open http://192.168.1.42/ on a phone on the same Wi-Fi. RSSI -48 dBm' }] },
      { cmd: 'help', reply: [{ text: 'Commands: on | off | ip | help' }] },
    ],
    led: { mode: 'off' },
  },
  pins: [{ pin: '2', tag: 'LED', signal: true }],
  parts: ['board', 'wifi', 'phone'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
    { path: 'include/secrets.example.h', text: secrets, lang: 'cpp' },
  ],
  chipBlocks: ['wifi', 'cpu', 'sram', 'gpio', 'uart'],
  hotspots: ['leds', 'module', 'antenna'],
  extra: [
    {
      title: 'What the phone and the board say to each other',
      body: 'Three addresses, all plain HTTP GET requests. `/` returns the page. `/state` returns the LED state as JSON. `/led?on=1` (or `on=0`) changes it and returns the new state. The page\'s script asks `/state` every 2 seconds, so it also notices changes made from the serial monitor. Polling is the simplest thing that works here. Streaming updates (Server-Sent Events) come later in the radar track. Changing something with a GET is a shortcut: fine on a private lab network, not how you would build a real API.',
      code: {
        lang: 'powershell',
        text: '# curl.exe, not curl: in Windows PowerShell 5.1, curl is an alias for something else.\ncurl.exe http://192.168.1.42/state\ncurl.exe "http://192.168.1.42/led?on=1"\ncurl.exe "http://192.168.1.42/led?on=0"',
      },
    },
  ],
  unverified: [
    'The IP address in the example output is made up. Yours comes from your router.',
    'This lab has been built but not flashed yet, so the page has not been tried on a real phone.',
  ],
};

export default lesson;
