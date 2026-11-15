import type { Lesson } from '../types';
import { buildScaffold } from './_scaffold';
import ini from '../../../../labs/w4-ota/platformio.ini?raw';
import main from '../../../../labs/w4-ota/src/main.cpp?raw';
import secrets from '../../../../labs/w4-ota/include/secrets.example.h?raw';

const lesson: Lesson = {
  id: 'w4',
  code: 'W4',
  track: 'wifi',
  name: 'Flash over Wi-Fi',
  title: 'Flash over Wi-Fi',
  status: 'built',
  pitch: 'Upload new firmware without a cable. Eventually the board sits in a wall mount, and OTA saves you climbing up to plug in USB every time you change a line.',
  runsOn: 'board',
  labDir: 'labs/w4-ota',
  onBoard: [
    { k: 'GPIO 2', v: 'LED', signal: true },
    { k: 'bench.local', v: 'OTA upload target' },
  ],
  learn: ['OTA updates', 'two PlatformIO environments', 'an upload password', 'keeping a way back in'],
  command: 'pio run -d labs/w4-ota -e esp32dev -t upload -t monitor',
  scaffold: buildScaffold('labs/w4-ota', [
    { path: 'platformio.ini', text: ini },
    { path: 'src/main.cpp', text: main },
    { path: 'include/secrets.example.h', text: secrets },
  ]),
  wire: null,
  steps: [
    'Make `labs/w4-ota` with the three files from the code tab, or run the PowerShell block. Nothing to wire. Open the lab folder on its own in VS Code.',
    'Copy the settings file: `Copy-Item labs\\w4-ota\\include\\secrets.example.h labs\\w4-ota\\include\\secrets.h`. Fill in the Wi-Fi name and password, and replace `change-me` with a password of your own for `OTA_PASSWORD`. While it is still `change-me`, the firmware refuses to start OTA.',
    '**First upload is still over USB**, because the board has nothing listening yet. Run the command (it uses the `esp32dev` environment). The LED blinks once a second. Wait for `OTA ready at bench.local`.',
    'In the same PowerShell terminal, set the upload password: `$env:OTA_PASSWORD = "<same as OTA_PASSWORD in secrets.h>"`. It lasts until you close that terminal. The `ota` environment reads it, so the password is never written in `platformio.ini`.',
    'In `main.cpp` change `BLINK_MS` from 1000 to 200 and `FW_VERSION` to `"v2"`. Save.',
    'Upload over Wi-Fi: `pio run -d labs/w4-ota -e ota -t upload`. Watch the progress, then the LED: it should now blink five times faster. The cable here only gives power.',
    'Open a monitor to see the board\'s side: `pio device monitor -d labs/w4-ota`. Type `status`; it should say `firmware v2, blink 200 ms`.',
    'Optional: set a wrong `OTA_PASSWORD` in the terminal and upload again. The upload fails and the board prints `OTA error: wrong password`.',
  ],
  fallback: {
    title: '`bench.local` fails in the upload?',
    text: 'Upload to the IP instead: add `--upload-port 192.168.1.42` (your board\'s IP, shown on the `Joined` line) to the command, or change `upload_port` in `platformio.ini`. The name needs mDNS, the IP does not.',
  },
  tips: [
    '**Which environment?** `esp32dev` uploads over USB. `ota` is the same firmware uploaded over Wi-Fi. `pio run -d labs/w4-ota` with no `-t upload` builds both.',
    '**Upload fails but the board is online?** Windows Firewall may be blocking the upload tool. Allow it when Windows asks, or try from a network you trust with the firewall prompt answered.',
    '**Keep the board powered the whole time** an upload runs. Never cut power while it says `OTA: …%`.',
  ],
  warnings: [
    '**Every firmware you upload must still contain the OTA code.** If a new version crashes before OTA starts, or you forget `ArduinoOTA.handle()`, the board can no longer be reached over Wi-Fi and you are back to USB. Keep this lab\'s OTA lines in anything you plan to mount on a wall.',
    'Anyone on your network who knows `OTA_PASSWORD` can replace the firmware. Choose a real password, keep it only in `secrets.h` and your terminal, and never forward a port to the board.',
  ],
  preview: {
    title: 'pio device monitor (try typing)',
    baud: '115200 baud',
    caption: 'Example output with an example address. The OTA lines below show what the board prints during an upload.',
    boot: [
      { t: '11:05:00.512', text: '[I] W4 flash over Wi-Fi. Firmware v1.' },
      { t: '11:05:00.514', text: 'Commands: blink | on | off | status | help' },
      { t: '11:05:00.516', text: '[I] Joining "BenchNet"...' },
      { t: '11:05:02.871', text: '[I] Joined "BenchNet", IP 192.168.1.42, RSSI -48 dBm' },
      { t: '11:05:02.903', text: '[I] OTA ready at bench.local. Upload with: pio run -d labs/w4-ota -e ota -t upload', cls: 'hi' },
    ],
    commands: [
      {
        cmd: 'status',
        reply: [
          { text: '[I] firmware v1, blink 1000 ms (blinking)' },
          { text: '    bench.local  IP 192.168.1.42  RSSI -48 dBm' },
        ],
      },
      { cmd: 'on', reply: [{ text: '[I] LED on' }] },
      { cmd: 'off', reply: [{ text: '[I] LED off' }] },
      { cmd: 'blink', reply: [{ text: '[I] LED blinking' }] },
      { cmd: 'help', reply: [{ text: 'Commands: blink | on | off | status | help' }] },
    ],
    led: { mode: 'blink', blinkMs: 1000, level: 255 },
  },
  pins: [{ pin: '2', tag: 'LED', signal: true }],
  parts: ['board', 'wifi'],
  files: [
    { path: 'platformio.ini', text: ini, lang: 'ini' },
    { path: 'src/main.cpp', text: main, lang: 'cpp' },
    { path: 'include/secrets.example.h', text: secrets, lang: 'cpp' },
  ],
  chipBlocks: ['wifi', 'cpu', 'sram', 'flash', 'gpio', 'uart', 'timers'],
  hotspots: ['leds', 'module', 'antenna'],
  extra: [
    {
      title: 'What the board prints during an OTA upload',
      body: 'If you have a monitor open while you upload, the callbacks in the firmware report each stage. The percentages step in tens.',
      code: {
        lang: 'text',
        text: '[I] OTA: new firmware incoming. Do not unplug.\n[I] OTA: 0%\n[I] OTA: 10%\n[I] OTA: 20%\n...\n[I] OTA: 100%\n[I] OTA: done. Restarting into the new firmware.',
      },
    },
    {
      title: 'The honest pitch',
      body: 'OTA does not replace USB. The first flash is USB, a bad firmware needs USB, and a board that is powered but in a wall mount only needs USB when something goes badly wrong. For everyday changes, an upload from your desk is faster than a ladder.',
    },
  ],
  unverified: [
    'OTA has not been run on the real board yet (built, not flashed). Whether the upload tool resolves `bench.local` on your Windows machine, and whether Windows Firewall asks about it, is untested.',
    'The OTA progress lines are what the firmware prints, but the upload tool\'s own output was not captured here.',
    'The addresses in the example output are made up.',
  ],
};

export default lesson;
