import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/w3-find-by-name/platformio.ini?raw';
import main from '../../../../labs/w3-find-by-name/src/main.cpp?raw';
import secrets from '../../../../labs/w3-find-by-name/include/secrets.example.h?raw';

const lesson: Lesson = {
  id: 'w3',
  code: 'W3',
  track: 'wifi',
  name: 'Find it by name',
  title: 'Find it by name',
  status: 'built',
  pitch: 'Stop hunting for IP addresses. The board answers to bench.local, comes back by itself when the Wi-Fi drops, and reports its signal every 10 seconds.',
  runsOn: 'board',
  labDir: 'labs/w3-find-by-name',
  onBoard: [
    { k: 'GPIO 2', v: 'Wi-Fi state LED', signal: true },
    { k: 'bench.local', v: 'name on the network' },
  ],
  learn: ['mDNS names', 'Wi-Fi events', 'auto-reconnect', 'a fixed IP with DHCP reservation'],
  command: 'pio run -d labs/w3-find-by-name -t upload -t monitor',
  scaffold: buildScaffold('labs/w3-find-by-name', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
    { path: 'include/secrets.example.h', text: secrets },
  ]),
  wire: null,
  steps: [
    'Make `labs/w3-find-by-name` with the three files from the code tab, or run the PowerShell block. Nothing to wire. Open the lab folder on its own in VS Code.',
    'Copy the settings file: `Copy-Item labs\\w3-find-by-name\\include\\secrets.example.h labs\\w3-find-by-name\\include\\secrets.h`, then fill in your 2.4 GHz network.',
    'Run the command. The LED blinks fast while the board is offline and goes steady once it is on the network. Wait for `Online. http://bench.local`.',
    'On your laptop (same Wi-Fi) open `http://bench.local` in the browser. You should see a small page with the board\'s address, signal and uptime. Try `ping bench.local` in PowerShell too.',
    'Wait 10 seconds. The monitor prints a status line on its own: name, IP, RSSI, uptime and how many times it has reconnected. Type `status` to get it any time.',
    'Type `drop`. The board hangs up on purpose, the LED starts blinking, and after about 15 seconds the watchdog joins again. The `reconnects` counter goes up by one.',
    'Try the real thing: switch your router (or phone hotspot) off for half a minute and back on. The board should come back without you touching it.',
    'Optional: open your router\'s admin page, find the device called `bench` in the client list, and give it a **DHCP reservation** so it always gets the same IP.',
  ],
  fallback: {
    title: '`bench.local` does not open?',
    text: 'Use the IP instead. The monitor prints it on the `Online.` line and in every status line, so `http://192.168.…` always works. Names ending in `.local` rely on mDNS, which is not available on every network or setup.',
  },
  tips: [
    '**Windows and `.local`:** recent Windows 10 and 11 builds resolve `.local` names through mDNS. If `ping bench.local` says it could not find the host, do not fight it, use the IP.',
    '**A fixed IP without touching the code:** most routers can reserve an address for a device by its MAC. The router still hands it out over DHCP, but always the same one. That is better than hard-coding a static IP, which can clash with another device.',
    '**LED never goes steady?** The board is not getting an address. Check the name and password in `secrets.h`, and that the network is 2.4 GHz.',
  ],
  warnings: [
    'This page, like W2, has no password. Keep it on your home network and never forward a port from your router to it.',
  ],
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Example output with an example address. The status line prints every 10 seconds on its own. Try drop: it replays the whole recovery.',
    boot: [
      { t: '10:12:00.512', text: '[I] W3 find it by name. LED steady = online, fast blink = offline.' },
      { t: '10:12:00.514', text: 'Commands: status | drop | help' },
      { t: '10:12:00.516', text: '[I] Joining "BenchNet"...' },
      { t: '10:12:02.904', text: '[I] Online. http://bench.local  (or http://192.168.1.42)  RSSI -48 dBm', cls: 'hi' },
      { t: '10:12:10.000', text: '[I] bench.local  IP 192.168.1.42  RSSI -48 dBm  up 10 s  reconnects 0' },
    ],
    commands: [
      { cmd: 'status', reply: [{ text: '[I] bench.local  IP 192.168.1.42  RSSI -48 dBm  up 24 s  reconnects 0' }] },
      {
        cmd: 'drop',
        reply: [
          { text: '[I] Dropping the connection on purpose. Watch it come back.' },
          { text: '[W] Link lost (reason 8).', cls: 'err' },
          { text: '[W] Offline too long. Joining again from scratch.', cls: 'err' },
          { text: '[I] Online. http://bench.local  (or http://192.168.1.42)  RSSI -50 dBm', cls: 'hi' },
        ],
      },
      { cmd: 'help', reply: [{ text: 'Commands: status | drop | help' }] },
    ],
    led: { mode: 'on', level: 255 },
  },
  pins: [{ pin: '2', tag: 'Wi-Fi LED', signal: true }],
  parts: ['board', 'wifi', 'phone'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
    { path: 'include/secrets.example.h', text: secrets, lang: 'cpp' },
  ],
  chipBlocks: ['wifi', 'cpu', 'sram', 'gpio', 'uart', 'timers'],
  hotspots: ['leds', 'module', 'antenna'],
  extra: [
    {
      title: 'How a name like bench.local works',
      body: 'Normal names go through a DNS server on the internet. `.local` names do not: **mDNS** has the board announce itself to the local network, and your laptop asks the whole network "who is bench?" and the board answers. It needs no router setup and never leaves your network. The catch is that it only works if your computer and network both allow it, which is why the lab always prints the IP too.',
    },
    {
      title: 'Why a watchdog on top of auto-reconnect?',
      body: 'The Wi-Fi driver already retries by itself (`setAutoReconnect(true)`). The lab adds a second safety net: if the board stays offline for 15 seconds, it throws the attempt away and joins again from scratch. A hang-up you caused on purpose with `drop` is not retried by the driver, so this is also what brings it back.',
    },
  ],
  unverified: [
    'The disconnect reason number (8) in the example is what we expect after a deliberate disconnect, not something seen on this board yet.',
    'Whether your router lists the device as `bench` depends on the router, so check its client list. Same for how it words a DHCP reservation.',
    'Whether `bench.local` resolves on your Windows machine depends on the Windows build and the network; the IP always works.',
    'This lab has been built but not flashed yet.',
  ],
};

export default lesson;
