import type { Hotspot, Part } from './types';

export const PARTS: Part[] = [
  { id: 'board', name: 'ESP32 board + USB-C data cable', always: true },
  { id: 'jumpers', name: 'Jumper wires (F-F)', defaultHave: true },
  { id: 'wifi', name: '2.4 GHz Wi-Fi network', note: 'not picked yet' },
  { id: 'ld2450', name: 'HLK-LD2450 radar kit', note: 'arriving ~Nov 18' },
  { id: 'shelly', name: 'Shelly Multicolor Bulb E27 Gen3', note: 'arriving ~Nov 21–30' },
  { id: 'phone', name: 'Phone or laptop on the same network', defaultHave: true },
  { id: 'breadboard', name: 'Breadboard', optional: true },
  { id: 'led', name: 'LED + 220–330 Ω resistor', optional: true },
  { id: 'button', name: 'Push button', optional: true },
];

export const HOTSPOTS: Hotspot[] = [
  { id: 'usb', n: 1, name: 'USB-C + CH340C', text: 'The USB-C port carries power and serial. The CH340C chip turns USB into the serial line the board talks on.' },
  { id: 'buttons', n: 2, name: 'EN and BOOT buttons', text: 'EN resets the chip. BOOT is wired to GPIO 0; hold it while resetting to enter flash mode.' },
  { id: 'leds', n: 3, name: 'Blue LED + red power LED', text: 'The blue LED is on GPIO 2 and is yours to blink. The red LED just shows power.' },
  { id: 'module', n: 4, name: 'WROOM-32 module', text: 'The metal can holds the chip, flash memory and radio.' },
  { id: 'antenna', n: 5, name: 'PCB antenna', text: 'The zigzag trace is the Wi-Fi and Bluetooth antenna. Keep metal away from it, which matters for the wall mount.' },
  { id: 'headers', n: 6, name: 'Pin headers', text: 'The two rows of pins break out the chip’s GPIOs, power and ground.' },
];

/** Lesson id currently flashed on the board. */
export const ON_THE_BOARD_NOW = '01';

export const CONNECTION = 'COM5 · CH340';

/** Chip numbers are added later from verified facts. */
export const BOARD_FACTS: { k: string; v: string }[] = [
  { k: 'Board', v: '30-pin ESP32 DevKit clone' },
  { k: 'Module', v: 'ESP32-WROOM-32' },
  { k: 'USB chip', v: 'CH340C, USB-C' },
  { k: 'LEDs', v: 'Blue on GPIO 2, red power' },
];

/* ------------------------------------------------------------------ Bench page (#/log) */

export interface SpecPart { t: string; b?: boolean }

/** Data for the "On the bench now" panel. The "built, not flashed" list is derived from lessons on the page. */
export const BENCH_NOW: {
  specs: SpecPart[][];
  onBoardSub: string;
  rows: { k: string; v: string; sub: string }[];
} = {
  specs: [
    [{ t: 'ESP32-', }, { t: 'WROOM-32', b: true }],
    [{ t: '2×', b: true }, { t: ' Xtensa LX6 @ 240 MHz' }],
    [{ t: '4 MB', b: true }, { t: ' flash' }],
    [{ t: 'no', b: true }, { t: ' PSRAM' }],
    [{ t: 'Wi-Fi 4', b: true }, { t: ' (2.4 GHz) + Bluetooth 4.2' }],
    [{ t: '3.3 V', b: true }, { t: ' logic' }],
  ],
  onBoardSub: 'Blue LED on GPIO 2 blinks (seen working by you)',
  rows: [
    { k: 'Connection', v: 'COM5', sub: 'USB-SERIAL CH340 · CH340C on the board' },
    {
      k: 'Chip',
      v: 'ESP32 (D0WD family) on a WROOM-32 module',
      sub: '4 MB flash · no PSRAM · revision and MAC: run lab 01 to read yours',
    },
    {
      k: 'Verified',
      v: 'COM5 · 01-hello flashed',
      sub: 'COM5 seen as USB-SERIAL CH340 (log 03) · blue LED on GPIO 2 blinks after flashing 01-hello (log 06), seen working by you',
    },
    {
      k: 'Installed on the laptop',
      v: '5.5 GB',
      sub: '%USERPROFILE%\\.platformio (shared) + 24 MB of build output in each of lab 01 and lab 02',
    },
  ],
};

/** Offsets are what PlatformIO's Arduino build passes to the uploader for the classic ESP32. Sizes are the real files in labs/01-hello/.pio/build/esp32dev. */
export const FLASH_LAYOUT: { address: string; file: string; size: string; purpose: string }[] = [
  { address: '0x1000', file: 'bootloader.bin', size: '23,520 B', purpose: 'second-stage bootloader' },
  { address: '0x8000', file: 'partitions.bin', size: '3,072 B', purpose: 'partition table' },
  { address: '0xE000', file: 'boot_app0.bin', size: '8,192 B', purpose: 'which app slot to boot' },
  { address: '0x10000', file: 'firmware.bin', size: '299,120 B', purpose: 'our program' },
];

export const FLASH_LAYOUT_NOTE =
  'This is what `-t upload` writes for 01-hello on the classic ESP32. Nothing was flashed by Claude. Sizes are from the 01-hello build on this laptop; the rest of the 4 MB flash is untouched.';

/** Measured with `du -sh` (read-only) on 2026-11-14. */
export const INSTALLED_ON_LAPTOP: { rows: { where: string; what: string; size: string }[]; note: string } = {
  rows: [
    { where: '.platformio', what: 'everything PlatformIO keeps in your user folder', size: '5.5 GB' },
    { where: '.platformio\\packages', what: 'compilers, the Arduino framework, esptool, debuggers', size: '4.2 GB' },
    { where: '.platformio\\packages\\toolchain-riscv32-esp', what: 'RISC-V compiler (this Xtensa chip does not use it)', size: '2.4 GB' },
    { where: '.platformio\\packages\\toolchain-xtensa-esp-elf', what: 'the compiler for this ESP32', size: '1.4 GB' },
    { where: '.platformio\\.cache', what: 'download and build cache', size: '1.3 GB' },
    { where: '.platformio\\packages\\framework-arduinoespressif32-esp32-libs', what: 'prebuilt ESP32 libraries for the Arduino framework', size: '180 MB' },
    { where: '.platformio\\packages\\framework-arduinoespressif32', what: 'Arduino-ESP32 framework source', size: '79 MB' },
    { where: '.platformio\\packages\\tool-esptool', what: 'the flashing tool', size: '65 MB' },
    { where: '.platformio\\python3', what: 'Python PlatformIO runs on', size: '43 MB' },
    { where: '.platformio\\penv', what: 'PlatformIO Core (pio) virtual environment', size: '42 MB' },
    { where: '.platformio\\platforms', what: 'the espressif32 platform definition', size: '2.3 MB' },
    { where: 'labs\\01-hello\\.pio', what: 'build output for lab 01', size: '24 MB' },
    { where: 'labs\\02-touch\\.pio', what: 'build output for lab 02', size: '24 MB' },
  ],
  note: 'Measured with read-only `du -sh` commands on the laptop. Paths are under `%USERPROFILE%` except the lab folders. Sub-folders overlap their parents, so the rows do not add up.',
};
