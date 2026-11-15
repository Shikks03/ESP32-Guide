import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/w1-scan/platformio.ini?raw';
import main from '../../../../labs/w1-scan/src/main.cpp?raw';
import secrets from '../../../../labs/w1-scan/include/secrets.example.h?raw';

const lesson: Lesson = {
  id: 'w1',
  code: 'W1',
  track: 'wifi',
  name: 'Scan & join',
  title: 'Scan & join',
  status: 'built',
  pitch: 'Ask the radio who is out there, then join your own 2.4 GHz network and read the address your router gives the board.',
  runsOn: 'board',
  labDir: 'labs/w1-scan',
  onBoard: [
    { k: 'Wi-Fi', v: '2.4 GHz radio in the module' },
    { k: 'PCB antenna', v: 'keep metal away' },
  ],
  learn: ['scanning networks', 'RSSI and channels', 'joining with secrets.h', 'why 5 GHz never shows'],
  command: 'pio run -d labs/w1-scan -t upload -t monitor',
  scaffold: buildScaffold('labs/w1-scan', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
    { path: 'include/secrets.example.h', text: secrets },
  ]),
  wire: null,
  steps: [
    'Make `labs/w1-scan` with the three files from the code tab, or run the PowerShell block from the repo root. Nothing to wire, so keep the cable in the Type-C port. Open the lab folder on its own in VS Code.',
    'Make your private settings file: `Copy-Item labs\\w1-scan\\include\\secrets.example.h labs\\w1-scan\\include\\secrets.h`. Open `secrets.h` and put in the name and password of your **2.4 GHz** network. This file is gitignored, so the password stays on your PC.',
    'Run the command. The first build with Wi-Fi code takes a little longer, later ones are quick. Wait for the line `Commands: scan | join | status | help`.',
    'Type `scan`. After 2 to 3 seconds you get a table. Find your network. Note its RSSI (closer to 0 is stronger) and its channel. Count the networks: your neighbours show up too.',
    'Look for your phone\'s or router\'s 5 GHz network in the table. It is not there, and it never will be. See "Why 5 GHz never shows up" below.',
    'Type `join`. Dots appear while it connects, then `Joined. IP 192.168.…`. Write that IP down, it is how a phone will find the board in the next lab.',
    'Type `status` to see the network, IP, gateway, signal and the board\'s MAC again. Press `Ctrl+C` to leave the monitor.',
  ],
  fallback: {
    title: 'No 2.4 GHz network to join yet?',
    text: '`scan` still works without `secrets.h`, because it only listens. For `join`, turn on the 2.4 GHz side of your router (many routers have it on by default), or use your phone\'s hotspot set to 2.4 GHz. Never put the board on a network you do not own.',
  },
  tips: [
    '**Joining times out?** Check the name and password in `secrets.h` (they are case sensitive) and that the name is the 2.4 GHz one. Some routers use one name for both bands and the board only ever sees the 2.4 GHz side; if that fails, look for a separate 2.4 GHz name in the router settings.',
    '**Resets or garbled output while joining?** Wi-Fi transmit bursts can reach about 240 mA, so use a supply and cable that can give at least 500 mA. A weak USB cable or an unpowered hub is the usual culprit.',
    '**Where is `secrets.h`?** It is only read when it exists. Without it, the build uses the placeholder file and the monitor tells you to create one.',
  ],
  warnings: [
    'Never paste `secrets.h` into a chat or a screenshot. It holds your Wi-Fi password.',
  ],
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Example networks and addresses, not yours. Your board lists the real networks around you. Click a command to see what it prints.',
    boot: [
      { t: '09:30:00.512', text: '[I] W1 scan and join. Radio is in station mode.' },
      { t: '09:30:00.514', text: '[I] Network from secrets.h: "BenchNet". Type join to connect.', cls: 'hi' },
      { t: '09:30:00.516', text: 'Commands: scan | join | status | help' },
    ],
    commands: [
      {
        cmd: 'scan',
        reply: [
          { text: '[I] Scanning... (2-3 seconds, the radio listens on each channel in turn)' },
          { text: '[I] Found 5 networks:' },
          { text: '  #  SSID                              RSSI  ch  band     security   signal' },
          { text: '  1  BenchNet                           -48   6  2.4 GHz  WPA2       strong', cls: 'hi' },
          { text: '  2  Neighbour-5E3A                     -71   1  2.4 GHz  WPA2       ok' },
          { text: '  3  TP-Link_9B21                       -66  11  2.4 GHz  WPA2/WPA3  ok' },
          { text: '  4  (hidden)                           -77  11  2.4 GHz  WPA2       weak' },
          { text: '  5  CafeGuest                          -83   6  2.4 GHz  open       weak' },
          { text: '[I] Only 2.4 GHz networks can show up: this chip has no 5 GHz radio.', cls: 'dim' },
        ],
      },
      {
        cmd: 'join',
        reply: [
          { text: '[I] Joining "BenchNet"...' },
          { text: '[I] Joined. IP 192.168.1.42, RSSI -48 dBm, channel 6', cls: 'hi' },
        ],
      },
      {
        cmd: 'status',
        reply: [
          { text: '[I] Wi-Fi: connected' },
          { text: '    network BenchNet, channel 6' },
          { text: '    IP 192.168.1.42, gateway 192.168.1.1' },
          { text: '    RSSI -48 dBm (strong)' },
          { text: '    board MAC A0:B7:65:3C:91:E4' },
        ],
      },
      { cmd: 'help', reply: [{ text: 'Commands: scan | join | status | help' }] },
    ],
  },
  pins: [],
  usb: true,
  parts: ['board', 'wifi'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
    { path: 'include/secrets.example.h', text: secrets, lang: 'cpp' },
  ],
  chipBlocks: ['wifi', 'cpu', 'sram', 'uart', 'timers'],
  hotspots: ['module', 'antenna', 'usb'],
  extra: [
    {
      title: 'Why 5 GHz never shows up',
      body: 'The ESP32 radio speaks 802.11 b/g/n on 2.4 GHz only (the module\'s operating channels sit around 2412 to 2484 MHz). It has no 5 GHz radio, so it cannot see 5 GHz networks, let alone join them. If your router broadcasts a separate 5 GHz name, it simply will not be in the scan. That is not a bug in the code: nothing you write can add a radio the chip does not have.',
    },
    {
      title: 'Reading the scan table',
      body: '**RSSI** is received signal strength in dBm. It is always negative and closer to 0 is stronger. The scale is logarithmic, so -60 is far stronger than -80. The labels `strong`, `ok` and `weak` are this lab\'s own rule of thumb (-60 and -75 are the cut-offs in the code), not a standard. **ch** is the channel, a slice of the 2.4 GHz band. Neighbouring channels overlap, and 1, 6 and 11 are the three that do not overlap each other. **security** says how the network is protected. `open` means no password.',
    },
  ],
  unverified: [
    'The networks, RSSI values, IP and MAC in the example output are made up to show the format. Run the lab to see yours.',
    'The signal labels and the 1/6/11 channel rule are rules of thumb, not figures from the datasheet.',
    'This lab has been built but not flashed yet, so the output has not been seen on the real board.',
  ],
};

export default lesson;
