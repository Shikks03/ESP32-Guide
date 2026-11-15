import type { Tour } from '../types';

/**
 * Guided tour of labs/01-hello (platformio.ini, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
const tour: Tour = {
  lessonId: '01',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 5],
      anchor: '[env:esp32dev]',
      title: 'The project settings',
      text: {
        beginner:
          "This small file tells PlatformIO what to build and how. It names the chip family, the board, and the toolkit (Arduino) your code will use. The last line sets the speed the serial monitor listens at.",
        explorer:
          "`[env:esp32dev]` starts an **environment**, a named build recipe (like one entry in `scripts` in a package.json). `platform` is the chip family, `board` picks the exact pin layout and flash size defaults, and `framework = arduino` means you write `setup()` and `loop()`. `monitor_speed` is the baud rate, how many bits per second the serial line carries. It has to match the number in `Serial.begin()`.",
        deep:
          "`espressif32` is the PlatformIO platform that bundles the compiler and the Arduino core. Platform v8.0.0 pins an Arduino-ESP32 core of 3.3.12, which is why the code in lesson 02 can use the 3.x LEDC calls. `esp32dev` is the generic ESP32 DevKit board definition, not a description of your exact board, which is fine because all the WROOM-32 DevKits share it. Baud is just the symbol rate. At 115200 and 8N1 (8 data bits, no parity, 1 stop bit, 10 bits on the wire per byte) you get roughly 11,500 bytes per second.",
      },
      guess: {
        question: 'There is no line saying which language or compiler to use. What do you think picks them?',
        answer:
          "Mostly `platform` and `framework`. Together they tell PlatformIO to download the ESP32 toolchain and the Arduino core, and the Arduino core means C++ with `setup()` and `loop()`.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [1, 6],
      anchor: '#include <Arduino.h>',
      title: 'Pull in Arduino, name the LED pin',
      text: {
        beginner:
          "The first line brings in the Arduino toolkit, so words like `Serial` and `digitalWrite` exist. The next few lines give the LED pin the name `PIN_LED` and set it to 2. The `#ifndef` check means \"only do this if nobody has already named it\".",
        explorer:
          "Lines starting with `#` run before the real compile, in a step called the **preprocessor**. `#include` pastes another file in, a bit like `import` but literally copy-paste. `#define PIN_LED 2` makes every `PIN_LED` in the file become `2` before the compiler sees it. Wrapping it in `#ifndef` ... `#endif` lets you override the pin from `platformio.ini` (with a `build_flags` line) without editing the code.",
        deep:
          "The preprocessor does plain text substitution, no types and no scope, so a `#define` constant has no type at all. That is why lesson 02 uses `const int` instead: you get type checking and a real name in error messages. The `#ifndef` guard is the usual way to give a default that a compiler flag like `-DPIN_LED=5` can win over. GPIO 2 is also a strapping pin (pulled down by default and sampled at boot), which is fine for an LED but a good reason not to hang something else heavy on it.",
      },
      guess: {
        question: 'Why wrap `#define PIN_LED 2` in an `#ifndef` ... `#endif` block?',
        options: [
          { text: 'It lets the pin be set from outside, and this line only fills in a default', right: true },
          {
            text: 'It makes the LED light up at boot',
            right: false,
            why: 'Nothing here touches the LED. These lines only create a name.',
          },
          {
            text: 'It tells the compiler to run the code faster',
            right: false,
            why: 'Preprocessor lines change the text of the program, not its speed.',
          },
        ],
        answer:
          "`#ifndef` means \"if not defined\". If the pin was already defined elsewhere, such as a build flag, this block is skipped and that value wins. Otherwise 2 is the default.",
      },
      words: ['include', 'ifndef-endif', 'define'],
    },
    {
      file: 'src/main.cpp',
      lines: [8, 11],
      anchor: 'void setup()',
      title: 'setup(): runs once at power-up',
      text: {
        beginner:
          "`setup()` runs one time when the board starts. Here it opens the serial line to your computer, turns the LED pin into an output, and waits half a second. That wait gives the monitor time to connect so you do not miss the first printed lines.",
        explorer:
          "`void` means the function returns nothing. `Serial.begin(115200)` starts the USB serial link at 115200 baud, matching `monitor_speed`. `pinMode(PIN_LED, OUTPUT)` says this pin will drive a voltage out instead of reading one. `delay(500)` freezes the whole program for 500 ms, which is fine here because nothing else is running yet.",
        deep:
          "On the ESP32 the Arduino core runs `setup()` once from a FreeRTOS task, then calls `loop()` over and over from the same task. `Serial` is UART0, wired through the board's USB-serial chip to your PC (pins GPIO 1 and 3). Before `Serial.begin`, the pin is just a floating input after reset, and `pinMode` is what flips it into a push-pull output so the GPIO can source or sink the LED current. `delay()` hands the CPU to other FreeRTOS tasks while it waits, so Wi-Fi and the system keep running, but your own code is stuck.",
      },
      guess: {
        question: 'What does `delay(500)` do in `setup()`?',
        options: [
          { text: 'Pauses the program for half a second so the monitor can connect', right: true },
          {
            text: 'Makes the LED blink every 500 ms',
            right: false,
            why: 'The blinking is done in `loop()`. `delay` here only waits once, before any output.',
          },
          {
            text: 'Sets the serial speed to 500',
            right: false,
            why: 'The speed is the number in `Serial.begin(115200)`.',
          },
        ],
        answer: "It pauses once, at boot. Without it the first lines can print before your monitor has attached and get lost.",
      },
      words: ['void', 'setup', 'serial', 'pin-mode', 'delay'],
    },
    {
      file: 'src/main.cpp',
      lines: [13, 17],
      anchor: 'Serial.println();',
      title: 'Printing the identity card',
      text: {
        beginner:
          "`Serial.println` sends a line of text to your computer. The empty one just prints a blank line. `Serial.printf` fills blanks in a message with real values, like the chip name and the number of cores. The board reads these facts about itself and tells you.",
        explorer:
          "In `printf`, `%s` is replaced by a string and `%d` by a whole number, in the order of the arguments after the quote. The `ESP.getChipModel()`-style calls are ready-made questions you can ask the chip: model name, silicon revision, core count, CPU speed in MHz. A line can span several lines of code, because C++ only ends a statement at the semicolon.",
        deep:
          "`%s` expects a `const char *`, and `getChipModel()` returns one, so it can print directly. `getChipRevision()` returns a number in MXX format on core 3.x, so a v3.1 chip reports `301`, not `3.1`. A v3.1 chip is what the datasheet says current ESP32-D0WD-V3 production parts are. If you see `%d` print garbage, the usual cause is a mismatch between the format code and the argument's type, because `printf` cannot check it for you.",
      },
      guess: {
        question: 'What will `%s` in `\"| chip  %s rev %d...\"` be replaced with?',
        options: [
          { text: 'The text returned by `ESP.getChipModel()`', right: true },
          {
            text: 'The letters \"%s\", printed as they are',
            right: false,
            why: 'Inside `printf`, a `%` followed by a letter is a placeholder, not text.',
          },
          {
            text: 'The number of cores',
            right: false,
            why: 'That is the third value and goes into the second `%d`. `%s` takes the first argument, the model name.',
          },
        ],
        answer: "`%s` takes the first extra argument, which is the chip model name as text. `%d` then takes the revision, and so on, in order.",
      },
      words: ['serial-printf', 'esp-info'],
    },
    {
      file: 'src/main.cpp',
      lines: [18, 21],
      anchor: 'Serial.printf("| flash',
      title: 'Flash, memory and MAC',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "More facts about the board: how much flash (program storage) it has, how much extra RAM, how much free memory is left, and its unique hardware ID called a MAC address.",
        explorer:
          "`ESP.getFlashChipSize()` returns bytes, so dividing by `1024 * 1024` gives megabytes. The `(unsigned)` in front is a **cast**: it converts the number to the type `%u` expects. A WROOM-32 module has 4 MB of flash. The PSRAM line prints 0 because a WROOM-32 has no extra RAM chip (the WROVER family does). The MAC is a 48-bit ID burned into the chip at the factory.",
        deep:
          "`getEfuseMac()` returns a `uint64_t`, which on this core is `unsigned long long`, so the cast is `(unsigned long long)` and the format needs `ll`. `%012llX` reads as: `X` uppercase hex, `12` wide, `0` pad with zeros, `ll` for a long long. A MAC is 6 bytes, which is 12 hex digits. The byte order printed can look reversed compared with the MAC your router shows, because the 64-bit value holds the first byte in its lowest bits. The MAC lives in eFuse, one-time-programmable bits inside the chip. The heap number is how much RAM the program has left to allocate, out of the chip's 520 KB of SRAM.",
      },
      guess: {
        question: 'Why is the flash size divided by `1024 * 1024`?',
        options: [
          { text: 'The function returns bytes, and this converts them to megabytes', right: true },
          {
            text: 'To make the number smaller so it prints faster',
            right: false,
            why: 'Printing speed has nothing to do with it. The goal is readable units.',
          },
          {
            text: 'Because the chip stores sizes in kilobytes already',
            right: false,
            why: 'It stores bytes. Dividing once by 1024 gives KB, twice gives MB.',
          },
        ],
        answer: "`getFlashChipSize()` is in bytes. 1024 bytes in a KB and 1024 KB in a MB, so you divide twice.",
      },
      words: ['cast'],
    },
    {
      file: 'src/main.cpp',
      lines: [22, 25],
      anchor: 'Serial.printf("| sdk',
      title: 'SDK version and the closing line',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "The last few prints show the version of the software underneath your code, close the card with a border, and remind you which pin the LED is on. Then `setup()` ends.",
        explorer:
          "`ESP.getSdkVersion()` is the version of ESP-IDF, the lower-level Espressif framework the Arduino core is built on. The last `printf` reuses `PIN_LED` so the message can never disagree with the real pin. The closing `}` on line 25 ends `setup()`.",
        deep:
          "Seeing the SDK version is handy when a tutorial works for someone else and not for you: Arduino-ESP32 2.x and 3.x ship different ESP-IDF versions and some APIs differ between them (lesson 02 hits this with LEDC). After `setup()` returns, the core's main loop task starts calling `loop()` forever.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [27, 31],
      anchor: 'void loop()',
      title: 'loop(): runs forever',
      text: {
        beginner:
          "After `setup()` finishes, `loop()` runs again and again, thousands of times a second. Instead of pausing, the code checks the clock on every pass. These two `static` variables remember when the LED last changed and whether it is on.",
        explorer:
          "`millis()` is the number of milliseconds since the board started. Using it to compare times instead of `delay()` means `loop()` is never stuck waiting, so later labs can read a wire or answer a command in the same loop. `static` makes a variable inside a function keep its value between calls, so these two are set once and then remembered. `uint32_t` is an unsigned 32-bit whole number and `bool` is true or false.",
        deep:
          "A plain local variable would reset to 0 on every pass; a `static` local is initialised once and lives for the whole program, like a module-level `let` that only this function can see. `millis()` returns a `uint32_t` that wraps from 4,294,967,295 back to 0 after about 49.7 days. The unsigned subtraction in the next stop is wraparound-safe, so the blink survives that rollover.",
      },
      guess: {
        question: 'What does `static` do to `lastToggle` and `ledOn`?',
        options: [
          { text: 'They keep their values between calls of `loop()`', right: true },
          {
            text: 'They can never change',
            right: false,
            why: 'That is `const`. A `static` variable can change, it just does not reset.',
          },
          {
            text: 'They become visible to every file in the project',
            right: false,
            why: 'The opposite: they are only visible inside this function. `static` only makes them last.',
          },
        ],
        answer: "Without `static`, both variables would restart at 0 and `false` on every pass. With it, they are set once and remember their last values.",
      },
      words: ['loop', 'static', 'uint32-t', 'bool', 'millis'],
    },
    {
      file: 'src/main.cpp',
      lines: [32, 37],
      anchor: 'if (millis() - lastToggle >= 500)',
      title: 'Blink without waiting',
      text: {
        beginner:
          "On each pass, the code asks: has half a second passed since the last change? If yes, it notes the time, flips `ledOn`, and sets the LED pin high or low to match. So the LED switches every 500 ms, which looks like two blinks a second.",
        explorer:
          "`millis() - lastToggle` is how long ago the last change was. When that reaches 500 ms, the block runs. `!ledOn` flips true and false. `ledOn ? HIGH : LOW` is a one-line if/else (the **ternary**): if `ledOn` is true use `HIGH` (3.3 V on the pin), else `LOW` (0 V). `digitalWrite` puts that level on the pin. One full blink (on then off) takes 1 s, so the LED blinks once per second, toggling twice.",
        deep:
          "Because both values are `uint32_t`, the subtraction wraps modulo 2^32, so `millis() - lastToggle >= 500` stays correct across the roll-over after about 49.7 days; a version written as `millis() >= lastToggle + 500` would break at that moment. Note that `lastToggle = millis()` reads the clock a second time, a few microseconds later, which makes the period drift by a tiny amount; storing `now` once, as lesson 02 does, avoids that. `HIGH` is just the number 1 and `LOW` is 0; the GPIO output drives about 3.3 V for `HIGH`.",
      },
      guess: {
        question: 'Why use `millis()` here instead of `delay(500)` inside `loop()`?',
        options: [
          { text: 'The loop stays free to do other work between toggles', right: true },
          {
            text: 'delay() cannot be used on an ESP32',
            right: false,
            why: 'It works fine, and `setup()` uses it. It just blocks everything else while waiting.',
          },
          {
            text: 'millis() makes the LED brighter',
            right: false,
            why: 'Brightness is not involved. This LED is only on or off.',
          },
        ],
        answer: "`delay` stops the program dead. Comparing `millis()` lets the loop keep spinning, so it could read a button or serial input in the gaps.",
      },
      words: ['if', 'logical-not', 'ternary', 'digital-write', 'high-low'],
    },
  ],
};

export default tour;
