import type { Lesson } from '../types';

const layout = `labs/
  00-setup/            no firmware, just commands (this lesson)
    README.md
  01-hello/            one PlatformIO project per lab folder
    platformio.ini
    src/main.cpp
  02-touch/
    platformio.ini
    src/main.cpp
  ...                  each later lab follows the same shape

# Nothing to flash in this lesson.
# Open one lab folder at a time in VS Code (File > Open Folder),
# otherwise IntelliSense shows "Arduino.h not found".
# 01 and 02 show a PowerShell block that creates their folders for you.`;

const lesson: Lesson = {
  id: '00',
  code: '00',
  track: 'intro',
  name: 'Setup',
  title: 'Plug in and find the board',
  status: 'runs',
  pitch: 'Get the toolchain talking to the chip: a data cable, the CH340 driver and a COM port name on your Windows laptop.',
  runsOn: 'laptop',
  labDir: undefined,
  onBoard: [
    { k: 'USB', v: 'Type-C port' },
    { k: 'CH340', v: 'USB-serial chip' },
  ],
  learn: ['USB-C data vs charge cable', 'COM ports', 'CH340 driver', 'boot mode'],
  command: 'pio device list',
  wire: null,
  steps: [
    'Plug a data USB-C cable into the board\'s Type-C port. A charge-only cable powers the board but never shows up as a COM port.',
    'Check that the red power LED comes on.',
    'In VS Code with the PlatformIO extension installed, open the **PlatformIO Core CLI** terminal and run the command above. Use that terminal, not a normal PowerShell or Command Prompt window: `pio` is not on PATH there. A new `COM` port with `CH340` in its description should appear.',
    'Write down the port name. Yours showed `COM5` (`USB-SERIAL CH340`). A COM port is the name Windows gives the serial connection to the board, and the number can change if you plug into a different USB port. No port? Install the CH340 driver (WCH CH341SER, from the official WCH site), replug the board and run the command again.',
  ],
  tips: [
    '**Flashing later says “Failed to connect”?** Hold BOOT, tap EN, release BOOT, then flash again. Try a different cable first, since charge-only cables cause most of these.',
    '**`pio` is not recognised?** You are in a normal terminal. Open VS Code\'s PlatformIO Core CLI terminal instead, or add `%USERPROFILE%\\.platformio\\penv\\Scripts` to PATH.',
  ],
  preview: {
    title: 'pio device list',
    baud: '',
    caption: 'Example output. COM5 and USB-SERIAL CH340 are what your board really showed; COM1 and the Hardware ID and LOCATION values are typical and will differ.',
    boot: [
      { t: '14:02:00.071', text: 'COM1' },
      { t: '14:02:00.338', text: '----' },
      { t: '14:02:00.601', text: 'Hardware ID: n/a' },
      { t: '14:02:00.863', text: 'Description: Communications Port (COM1)' },
      { t: '14:02:01.113', text: '' },
      { t: '14:02:01.378', text: 'COM5' },
      { t: '14:02:01.643', text: '----' },
      { t: '14:02:01.893', text: 'Hardware ID: USB VID:PID=1A86:7523 LOCATION=1-3' },
      { t: '14:02:02.100', text: 'Description: USB-SERIAL CH340 (COM5)  <- your board', cls: 'hi' },
    ],
  },
  pins: [],
  usb: true,
  parts: ['board'],
  files: [{ path: 'folder layout', text: layout, lang: 'text' }],
  chipBlocks: ['uart'],
  hotspots: ['usb'],
};

export default lesson;
