import type { Rich } from './types';

/** Shown under every lesson's steps. Rendered by LessonPage, not repeated in lessons. */
export const BETWEEN_LESSONS: { items: Rich[]; warning: Rich } = {
  items: [
    'Press `Ctrl+C` in the terminal to close the serial monitor.',
    'Unplug the USB cable to stop the board. Rewire only while it is unplugged.',
    'Check the wiring against the Wire tab, especially **VIN**, **3V3** and **GND**, before you plug back in.',
    'Plug the USB cable in, then flash the next lab.',
  ],
  warning: 'Never unplug the board while the terminal shows `Writing at 0x…`. An interrupted flash can leave the board with broken firmware, and you would have to flash again.',
};

/** One line, shown with the command box. */
export const PATH_NOTE: Rich =
  '`pio` not found? Add `%USERPROFILE%\\.platformio\\penv\\Scripts` to your PATH, then open a fresh terminal.';

export const PIO_TERMINAL_NOTE: Rich =
  'Commands on this page are for VS Code\'s **PlatformIO Core CLI** terminal, where `pio` already works.';

export const OPEN_FOLDER_TIP: Rich =
  'Open the lab folder on its own in VS Code (File → Open Folder → `labs\\02-touch`, for example). If you open the parent folder, IntelliSense shows “Arduino.h not found”.';
