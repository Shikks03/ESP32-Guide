import type { Tour } from '../types';

/**
 * Guided tour of labs/02-touch (platformio.ini, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
const tour: Tour = {
  lessonId: '02',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'Same settings, one extra line',
      text: {
        beginner:
          "This is the same project file as lab 01, plus one new line: `monitor_echo = yes`. This lab lets you type commands, and that line makes the monitor show your own typing as you go.",
        explorer:
          "Without `monitor_echo`, the serial monitor sends your keystrokes to the board but does not draw them, so typing looks like nothing happens until the reply arrives. With it on, the monitor prints each character locally. The board never sees the echo, it is only for your eyes. The first five lines are unchanged: ESP32 platform, generic DevKit board, Arduino framework, 115200 baud.",
        deep:
          "The echo is done by the PlatformIO monitor on your PC, not by the firmware. A terminal on a real serial port normally relies on the far end to echo (which is what a Linux TTY does), and our firmware does not echo, so the monitor fills the gap. If your own typing shows up twice, something else is echoing and you can turn this option off.",
      },
      guess: {
        question: 'Only one line differs from lab 01. Why does this lab need `monitor_echo = yes`?',
        answer:
          "Because you now type commands into the monitor. The firmware does not send your characters back, so the monitor draws them itself and you can see what you are typing.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [1, 5],
      anchor: '#include <Arduino.h>',
      title: 'Settings as named constants',
      text: {
        beginner:
          "Three named numbers sit at the top: which pin the LED is on, which pin feels touch, and how low the touch reading must drop to count as a touch. Naming them means you change a number in one place and the whole program follows.",
        explorer:
          "`const int` is a whole number that can never change after this line. That is safer than a bare `2` or `40` scattered through the code. GPIO 4 is touch pad T0 on the ESP32. `TOUCH_THRESHOLD = 40` is a starting guess: the reading **drops** when a finger gets close, so below 40 means touched. Your own readings will differ, which is why the lesson has you measure and edit this number.",
        deep:
          "Using `const int` instead of `#define` (as lab 01 did for `PIN_LED`) gives these names a type and a scope, and the compiler can catch misuse. For a global like this it also compiles to the same thing: the constants are folded into the machine code. On the original ESP32, the touch peripheral counts how many cycles a charge takes to move through the pad, and a finger adds capacitance, which lowers the count. That is why \"touched\" means a smaller number here. ESP32 touch pads are T0 to T9; T0 is GPIO 4, and some others (GPIO 0, 2, 12, 15) are also strapping pins, so T0 is a safe pick.",
      },
      guess: {
        question: 'What does `const` in front of `int` do?',
        answer:
          "It locks the value: after this line nothing in the program can assign a new number to `PIN_LED`, `PIN_TOUCH` or `TOUCH_THRESHOLD`. To change one, you edit this line and upload again.",
      },
      words: ['include', 'const', 'int'],
    },
    {
      file: 'src/main.cpp',
      lines: [7, 9],
      anchor: '// PWM = switching',
      title: 'PWM settings',
      text: {
        beginner:
          "A pin can only be fully on or fully off. To fake in-between brightness, the code switches it on and off thousands of times a second and changes the share of time spent on. That trick is called PWM. Here are its three settings.",
        explorer:
          "`PWM_FREQ = 5000` means 5000 on/off cycles per second, too fast for your eye to see. `PWM_BITS = 8` is the **resolution**: 8 bits gives 256 steps, so the brightness value runs from 0 (always off) to 255 (always on). `PWM_CH = 0` is a channel number that only the older core needs. A comma lets you declare several variables of the same type in one line.",
        deep:
          "The ESP32's LEDC peripheral (16 channels and a maximum duty resolution of 20 bits, per the datasheet) counts up to 2^bits and compares against the duty value. At 8 bits the count goes 0 to 255, so the duty is a 0 to 255 number. There is a trade: the counter's clock is divided down from a source clock, so more bits at the same frequency needs a faster timer. 5 kHz with 8 bits is comfortably inside what the hardware can do. 5 kHz is also well above anything visible as flicker.",
      },
      guess: {
        question: 'With `PWM_BITS = 8`, what range of brightness values can you write?',
        options: [
          { text: '0 to 255', right: true },
          {
            text: '0 to 8',
            right: false,
            why: '8 is the number of bits, not the largest value. 8 bits can hold 256 different values.',
          },
          {
            text: '0 to 5000',
            right: false,
            why: '5000 is the frequency (cycles per second), a separate setting.',
          },
        ],
        answer: "8 bits is 2 to the power of 8, which is 256 steps. Counting from 0, that is 0 to 255.",
      },
      words: ['pwm'],
    },
    {
      file: 'src/main.cpp',
      lines: [10, 16],
      anchor: '#if ESP_ARDUINO_VERSION_MAJOR',
      title: 'One name, two core versions',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "The way you set up PWM changed between version 2 and version 3 of the Arduino ESP32 toolkit. This block picks the right set of commands for whichever version is installed, and gives them one shared name each, so the rest of the code does not care.",
        explorer:
          "`#if` is a compile-time `if`: only one branch is kept in the program. `ESP_ARDUINO_VERSION_MAJOR` is a number the core defines. On 3.x you attach the pin directly, `ledcAttach(pin, freq, bits)`, and write by pin with `ledcWrite(pin, duty)`. On 2.x you set up a numbered channel first, then connect the pin to it. `#define PWM_WRITE(v) ...` is a **macro**: it works like a tiny function, but it is pasted in as text.",
        deep:
          "The 2.x to 3.x change moved LEDC from channel-based to pin-based (`ledcSetup` and `ledcAttachPin` were removed from the 3.x API), so this one `#if` keeps the lab building on either. PlatformIO's current espressif32 platform ships core 3.3.12, so the first branch is the one that actually compiles for you. The `do { ... } while (0)` wrapper in the 2.x `PWM_SETUP()` is the usual macro trick: it turns two statements into one, so the macro behaves like a single statement even inside an `if` without braces. The `(v)` in parentheses stops surprises when someone passes an expression like `a + b`.",
      },
      guess: {
        question: 'Why is this check an `#if` instead of a normal `if`?',
        options: [
          { text: 'The two versions have different function names, so only one branch can even compile', right: true },
          {
            text: 'A normal `if` is not allowed on an ESP32',
            right: false,
            why: 'Normal `if` is used everywhere in the file. The issue is the functions inside, not the `if` itself.',
          },
          {
            text: 'To check the version while the program runs',
            right: false,
            why: 'Opposite: `#if` is decided before the program exists, at compile time.',
          },
        ],
        answer: "A normal `if` still has to compile both branches, and the calls from the wrong version would not exist. `#if` throws the unused branch away before compiling.",
      },
      words: ['preprocessor-if', 'define', 'ledc-attach', 'ledc-write', 'do-while-0'],
    },
    {
      file: 'src/main.cpp',
      lines: [18, 24],
      anchor: '// A tiny state machine',
      title: 'The LED state machine',
      text: {
        beginner:
          "The LED can be in one of five modes: fade, blink, on, off, or SOS. A single variable called `mode` remembers which one is active right now. The program just checks that variable to know what to do. A setup like this is called a state machine.",
        explorer:
          "`enum Mode { ... }` makes a new type with five named values. Behind the names they are the numbers 0 to 4 in the order written. `MODE_NAMES` is an array of text labels in the same order, so `MODE_NAMES[mode]` turns a mode into a word you can print. `const char *` is how C++ writes a piece of text that cannot change. `level`, `blinkMs` and `showTouch` are the other settings you can change with commands.",
        deep:
          "Because an unscoped `enum` converts to an integer, `MODE_NAMES[mode]` works, but the order of the two lists has to match by hand. Nothing checks it. If you add a mode, add its name in the same position. These globals live in RAM and are not `const`, which is what lets commands change them. `level` is the top brightness (0 to 255 to match the 8-bit PWM) and `blinkMs` is the on/off time for BLINK.",
      },
      guess: {
        question: 'What does the single variable `mode` store?',
        options: [
          { text: 'Which of the five behaviours the LED should be doing right now', right: true },
          {
            text: 'How bright the LED currently is',
            right: false,
            why: 'Brightness is a separate variable, `level`. `mode` is only the current behaviour.',
          },
          {
            text: 'The text typed into the serial monitor',
            right: false,
            why: 'Typed text is handled later by `readSerial()`. `mode` is set after the text is understood.',
          },
        ],
        answer: "`mode` holds one of FADE, BLINK, ON, OFF or SOS. Every pass of the loop looks at it to decide what the LED does.",
      },
      words: ['enum', 'array', 'c-string', 'bool'],
    },
    {
      file: 'src/main.cpp',
      lines: [26, 28],
      anchor: '// SOS in Morse',
      title: 'The SOS timing table',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "SOS in Morse code is three short flashes, three long, three short. This list holds how long each on and off period lasts, in milliseconds, alternating between on and off.",
        explorer:
          "Read it left to right as on, off, on, off. Three short letters S are `200,200,200,200,200,600`: on 200, off 200, on 200, off 200, on 200, then a longer 600 ms gap before the next letter. The O is three 600 ms dashes. The final 1400 ms is the long pause before the whole message repeats. `uint16_t` is an unsigned 16-bit number (0 to 65535), plenty for these. `SOS_LEN` counts the entries by dividing the array's total size by one element's size.",
        deep:
          "`sizeof(SOS_STEPS)` is the whole array in bytes (18 entries of 2 bytes is 36) and `sizeof(SOS_STEPS[0])` is one entry (2 bytes), so the division gives 18 and updates itself if you add steps. That trick only works where the compiler still knows it is an array; once you pass it to a function it becomes a pointer and `sizeof` would give the pointer size. Even positions (0, 2, 4...) are always on periods, which `sosOn` relies on. Adding the three letters up, the whole message lasts 1600 + 2800 + 2400 = 6800 ms before it repeats. The code sums the array at runtime instead of hard-coding that, so editing a step just works.",
      },
      words: ['uint16-t', 'sizeof'],
    },
    {
      file: 'src/main.cpp',
      lines: [30, 39],
      anchor: 'bool sosOn(uint32_t now)',
      title: 'Is the SOS light on right now?',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "This function answers one question: at this moment in time, should the SOS light be on? It adds up the whole pattern, works out where in the pattern we are now, and walks through the steps until it finds the one we are inside.",
        explorer:
          "A **function** is a named block of code that takes input (`now`, the time in ms) and gives back a result (`true` for on). `total` is the length of the whole pattern. `now % total` is the remainder after dividing, so the time wraps back to the start of the pattern each cycle. Then the loop subtracts each step's length from `t` until `t` is smaller than the current step. That step is the one we are in. Even-numbered steps (0, 2, 4...) are on, which `i % 2 == 0` checks.",
        deep:
          "This is stateless: it works out the answer from the clock alone and remembers nothing between calls, so it cannot get out of sync with the loop. The cost is a short loop on every pass, 18 iterations at most, which is trivial next to the loop's speed. `now` is a `uint32_t` and the maths stays unsigned, so there are no negative surprises. The final `return false` is only there because the compiler wants every path to return something. It can never be reached since `t` is always less than `total`. `now % total` jumps at the 2^32 millisecond wraparound (about 49.7 days), which would glitch one cycle of SOS but nothing else.",
      },
      guess: {
        question: 'What does `now % total` give you?',
        options: [
          { text: 'How far into the current SOS cycle we are', right: true },
          {
            text: 'The number of cycles that have passed',
            right: false,
            why: 'That would be `now / total`. The `%` operator gives the remainder, not the quotient.',
          },
          {
            text: 'The total length of the pattern',
            right: false,
            why: '`total` is already that. The remainder is always smaller than `total`.',
          },
        ],
        answer: "The remainder after dividing. It always lands between 0 and `total - 1`, so it is a position inside one cycle, and the cycle repeats forever.",
      },
      words: ['function', 'if', 'for', 'uint32-t', 'modulo', 'return'],
    },
    {
      file: 'src/main.cpp',
      lines: [41, 52],
      anchor: 'void printState()',
      title: 'Printing state and changing mode',
      text: {
        beginner:
          "`printState` writes the current mode, level and blink time to the monitor. `printHelp` lists the commands you can type. `setMode` changes the mode and prints a note about it. Each does one small job, which makes the code below easy to read.",
        explorer:
          "`void` again means they return nothing, they only do things. `Serial.printf` fills in `%s` (text) and `%d` (whole number) from the arguments. `MODE_NAMES[mode]` turns the current mode into a label. `setMode(Mode m)` takes a mode as input, stores it in the global `mode`, and logs the change. Every command goes through `setMode`, so the log line always matches reality.",
        deep:
          "The `[I]` prefix is only a convention for info lines so you can scan the monitor. The functions share the global variables directly. That is simple but means anything can change `mode`, so funneling the changes through `setMode` is a small safeguard. Note that `setMode` does not reset the level or the blink time: the settings persist as you switch modes. `Serial.printf` formats into a buffer and then sends it over UART0 at 115200 baud, so a long print can take several milliseconds, which is fine here because it only runs when a command arrives.",
      },
      guess: {
        question: 'Why does every command change the mode through `setMode()` instead of setting `mode` directly?',
        options: [
          { text: 'So the mode change and its log message always happen together', right: true },
          {
            text: 'Because `mode` cannot be changed directly',
            right: false,
            why: 'It can, it is a normal global variable. `setMode` is a choice, not a rule from the language.',
          },
          {
            text: 'To make the LED react faster',
            right: false,
            why: 'The LED only reacts later, in `updateLed()`. This function does not change speed.',
          },
        ],
        answer: "One place to change the mode means one place that prints the message. You cannot forget to log, and the two never disagree.",
      },
      words: ['void', 'serial-printf', 'serial'],
    },
    {
      file: 'src/main.cpp',
      lines: [54, 59],
      anchor: 'void runCommand(String cmd)',
      title: 'Splitting a command into name and number',
      text: {
        beginner:
          "When you type something like `blink 200`, this part cleans it up and cuts it in two: the word (`blink`) and the number (`200`). If there is no number, it uses -1 to mean \"none given\".",
        explorer:
          "A `String` is Arduino's text type, and its methods are called with a dot, like `cmd.trim()`. `trim()` removes spaces and line endings at the ends, and `toLowerCase()` makes `ON` and `on` the same. `indexOf(' ')` finds the first space, or -1 if there is none. Then the **ternary** `sp < 0 ? cmd : cmd.substring(0, sp)` says: no space, so the whole thing is the name; otherwise take the text before the space. The number is the text after the space, turned into a number with `toInt()`.",
        deep:
          "`cmd` is passed by value, so `trim()` and `toLowerCase()` change a private copy and the caller's string is untouched. `toInt()` returns 0 when the text is not a number, so `level abc` becomes level 0, which is a quirk worth knowing. -1 works as the \"no number\" marker only because later checks use `arg > 0` or `arg >= 0`, and a typed `-5` would also parse as -5 and be treated as no argument by `blink`. `String` allocates on the heap, which is fine at this scale, but in long-running code that builds many strings it can fragment memory.",
      },
      guess: {
        question: 'For the input `blink 200`, what is `sp` after `cmd.indexOf(\' \')`?',
        options: [
          { text: '5, the position of the space', right: true },
          {
            text: '200, the number',
            right: false,
            why: '`indexOf` returns a position in the text, not a value. Positions count from 0.',
          },
          {
            text: '-1, because there is no space',
            right: false,
            why: '-1 only means "not found". There is a space after the 5 letters of `blink`.',
          },
        ],
        answer: "`blink` is letters at positions 0 to 4, so the space sits at position 5. The name is `cmd.substring(0, 5)` and the number comes from the text after it.",
      },
      words: ['string', 'ternary'],
    },
    {
      file: 'src/main.cpp',
      lines: [61, 70],
      anchor: 'if (name == "on") setMode(ON);',
      title: 'Choosing what to do',
      text: {
        beginner:
          "A chain of checks compares the typed word with each known command. The first match runs. Typing something unknown prints the help text. After any command, the program prints the current state so you can confirm the change.",
        explorer:
          "`else if` chains test one case after another and stop at the first match. `blink` only replaces the blink time if you gave a positive number, then switches to BLINK. `level` needs a number of 0 or more, and `constrain(arg, 0, 255)` clamps it into the valid brightness range, so `level 999` becomes 255. `&&` means both sides must be true. `touch` flips `showTouch` with `!` (not), and a ternary picks the word on or off for the message. Anything left over falls into the last `else` and shows help.",
        deep:
          "`name == \"on\"` works because `String` overloads `==` to compare text, not addresses. With plain C strings it would compare pointers. A bare `level` with no number gives `arg = -1`, so `arg >= 0` fails and the chain falls through to the final `else`, which prints help. The braces `{ ... }` on the `blink` and `touch` lines are needed because those branches hold more than one statement. `printState()` is outside the chain on purpose, so it runs for every input, including unknown ones.",
      },
      guess: {
        question: 'What happens if you type `level 999`?',
        options: [
          { text: 'The level becomes 255, the maximum', right: true },
          {
            text: 'The LED shows an error',
            right: false,
            why: 'Nothing here rejects the number. It is quietly clamped instead.',
          },
          {
            text: 'The level becomes 999 and wraps around',
            right: false,
            why: '`constrain(arg, 0, 255)` stops the number at 255 before it is stored.',
          },
        ],
        answer: "`constrain` clamps the value into the range 0 to 255. Anything larger becomes 255, anything smaller becomes 0.",
      },
      words: ['constrain', 'logical-and', 'logical-not'],
    },
    {
      file: 'src/main.cpp',
      lines: [72, 83],
      anchor: 'void readSerial()',
      title: 'Collecting a typed line',
      text: {
        beginner:
          "Characters arrive one at a time. This function adds each to a `line` until it sees Enter, then hands the finished line to `runCommand`. The line is remembered between calls, so a command can arrive in pieces and still work.",
        explorer:
          "`static String line` keeps its text between calls. `Serial.available()` says how many characters are waiting, and the `while` loop reads them all. `Serial.read()` takes one character. If it is `\\n` or `\\r` (the Enter key, which different systems send differently), the line is done: run it if it is not empty, then clear it. Any other character is added to the end with `+=`.",
        deep:
          "Windows monitors often send `\\r\\n`, so one Enter produces two line-end characters. The second one finds an empty line and the `if (line.length())` check skips it, so no empty command runs. The function never waits: it takes only what is already in the UART's receive buffer and returns, which is what keeps `loop()` fast. `Serial.read()` returns an `int` (-1 if nothing is there) and is stored in a `char`. That is safe here because it is only called after `available()` said there is data.",
      },
      guess: {
        question: 'Why does `line` need to be `static`?',
        options: [
          { text: 'A half-typed command must survive until the next call', right: true },
          {
            text: 'So other files can read it',
            right: false,
            why: '`static` inside a function does not share anything. It only makes the value last.',
          },
          {
            text: 'So it cannot be changed',
            right: false,
            why: 'The code changes it with `+=` and `line = ""`. That would be impossible if it could not change.',
          },
        ],
        answer: "`readSerial()` returns every time it runs out of characters. Without `static`, `line` would restart empty and a command typed over several passes would be lost.",
      },
      words: ['static', 'char', 'while', 'serial-input'],
    },
    {
      file: 'src/main.cpp',
      lines: [85, 90],
      anchor: 'void updateLed(uint32_t now)',
      title: 'updateLed: one case per mode',
      text: {
        beginner:
          "This function looks at `mode` and sets the LED brightness to match. ON uses full level, OFF uses zero, BLINK alternates, and SOS follows the Morse pattern. Each case ends with `break`, which means \"done, leave the switch\".",
        explorer:
          "`switch (mode)` jumps straight to the matching `case`. `break` stops it from running into the next case. `now / blinkMs` counts how many `blinkMs`-long slices have passed (whole-number division drops the remainder), and `% 2 == 0` is true on every other slice, so the LED is on, off, on, off. The `? level : 0` picks full level on even slices and zero on odd ones. For SOS it asks `sosOn(now)`.",
        deep:
          "Because the time is passed in as `now`, the function is a pure function of the clock and the settings. It keeps no timers of its own, so changing `blinkMs` live takes effect on the next call. `blinkMs` can never be 0 here, since `blink` only stores values above 0, so the division is safe. If you forget a `break` the code silently falls through into the next case, a classic C++ bug. Compilers can warn about it, and this switch has none missing.",
      },
      guess: {
        question: 'What is the `break` at the end of each `case` for?',
        options: [
          { text: 'It stops execution from falling through into the next case', right: true },
          {
            text: 'It turns the LED off',
            right: false,
            why: 'LED output is set by `PWM_WRITE`. `break` only controls the flow of code.',
          },
          {
            text: 'It ends the whole program',
            right: false,
            why: 'It only leaves the `switch`. The program keeps running and `loop()` calls this again.',
          },
        ],
        answer: "Without `break`, C++ keeps running into the next case's code. `break` jumps to the end of the `switch`.",
      },
      words: ['switch'],
    },
    {
      file: 'src/main.cpp',
      lines: [91, 98],
      anchor: 'case FADE: {',
      title: 'The breathing fade',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "The fade makes the brightness rise and fall smoothly, once every two seconds. The code turns the clock into a number that climbs from 0 up to 1000 and back down, then scales it to the brightness level.",
        explorer:
          "`now % 2000` repeats every 2 seconds, counting 0 to 1999. The line with `tri` folds that into a triangle: for the first 1000 ms it equals `t` (rising 0 to 1000), then `2000 - t` (falling 1000 back to 0). Multiplying by `level` and dividing by 1000 scales 0..1000 to 0..`level`. The braces around this case let it have its own local variables `t` and `tri`.",
        deep:
          "A triangle wave looks linear but your eye does not see brightness linearly, so the fade looks like it lingers near the bright end. A gamma curve would feel smoother, at the cost of more maths. Multiplication comes before division, which keeps precision with whole numbers: the biggest product is 1000 × 255 = 255,000, which fits easily in a `uint32_t`. Written the other way (`tri / 1000 * level`) the division would round to 0 or 1 first and the fade would be very steppy. The result is a 0 to 255 duty value, matching the 8-bit PWM resolution.",
      },
      guess: {
        question: 'Roughly how long does one full fade (dark, bright, dark) take?',
        options: [
          { text: '2 seconds', right: true },
          {
            text: '1 second',
            right: false,
            why: 'That is just the rising half. The falling half takes another 1000 ms.',
          },
          {
            text: '255 milliseconds',
            right: false,
            why: '255 is the top brightness value, not a time.',
          },
        ],
        answer: "`now % 2000` repeats every 2000 ms: 1 s up, 1 s down.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [100, 107],
      anchor: 'void setup()',
      title: 'setup: start serial, start PWM, say hello',
      text: {
        beginner:
          "Once at power-up: open the serial line, set up the PWM brightness control, wait half a second for the monitor, then print a hello line, the command list, and the current state.",
        explorer:
          "`Serial.begin(115200)` matches the baud rate in `platformio.ini`. `PWM_SETUP()` is the macro from earlier, expanding to whichever setup call suits the installed core. `delay(500)` gives the monitor time to attach. Unlike lab 01 there is no `pinMode` call, because the PWM setup already takes control of the LED pin.",
        deep:
          "`ledcAttach` (3.x) or `ledcAttachPin` (2.x) hands the pin to the LEDC peripheral, which then drives it from the GPIO matrix, so `pinMode(OUTPUT)` would be redundant. The first lines printed after a reset are the ones people most often miss, which is why the short delay is there. Everything after this point in the lab happens in `loop()`.",
      },
      guess: {
        question: 'Lab 01 called `pinMode(PIN_LED, OUTPUT)`. Why does this `setup()` not?',
        options: [
          { text: 'The PWM setup already takes over the pin', right: true },
          {
            text: 'The LED works without being configured',
            right: false,
            why: 'A pin has to be configured somehow. This lab just does it through PWM instead of `pinMode`.',
          },
          {
            text: 'It was forgotten and the lab still works by luck',
            right: false,
            why: 'It is not luck. `ledcAttach` connects the pin to the PWM hardware and configures it as an output.',
          },
        ],
        answer: "`PWM_SETUP()` attaches the pin to the PWM hardware, which makes it an output driven by that hardware. `pinMode` would be redundant.",
      },
      words: ['setup', 'delay'],
    },
    {
      file: 'src/main.cpp',
      lines: [109, 117],
      anchor: 'void loop()',
      title: 'loop: read, sense, maybe print',
      text: {
        beginner:
          "Every pass: check the time, read any typed commands, and measure the touch pin. If you turned on `touch` printing, it shows the reading four times a second so the monitor does not flood.",
        explorer:
          "`now` is read once at the top so everything in one pass agrees on the time. `touchRead(PIN_TOUCH)` returns a number that gets **lower** as a finger gets closer. It is read on every pass, because the next stop needs it even when nothing prints. The print is rate-limited with the same `millis()` trick as lab 01: only when 250 ms have passed since the last print.",
        deep:
          "The `now - lastPrint >= 250` subtraction is wraparound-safe for the same reason as in lab 01: unsigned arithmetic wraps modulo 2^32, so it stays correct across the roll-over at about 49.7 days. On the original ESP32 a finger adds capacitance, and the ESP-IDF docs say the raw value, a cycle count, gets smaller. Readings vary between boards, wires and even the weather, so measure your own. The touch hardware is not rated for every use: the datasheet notes it has not passed the Conducted Susceptibility test, so treat it as a hobby input.",
      },
      guess: {
        question: 'What happens to the `touchRead` number when a finger approaches the wire?',
        options: [
          { text: 'It goes down', right: true },
          {
            text: 'It goes up',
            right: false,
            why: 'That is the common assumption, but on the original ESP32 the count falls as capacitance rises.',
          },
          {
            text: 'It stays the same, only the LED changes',
            right: false,
            why: 'The reading is the whole point: your finger changes it, and the next lines react to that.',
          },
        ],
        answer: "It drops. A finger adds capacitance, and on the original ESP32 more capacitance means a smaller count. That is why the test is `touch < TOUCH_THRESHOLD`.",
      },
      words: ['loop', 'millis', 'touch-read'],
    },
    {
      file: 'src/main.cpp',
      lines: [119, 121],
      anchor: 'if (touch < TOUCH_THRESHOLD)',
      title: 'Touch overrides the mode',
      text: {
        beginner:
          "If the touch reading is below the threshold, the LED goes to full brightness no matter what mode is active. If not, the program runs the normal mode logic. So touching the wire always wins over a typed command.",
        explorer:
          "`PWM_WRITE(255)` sets the duty to the maximum, fully on, regardless of `level`. The `else` branch calls `updateLed(now)` to carry on with the current mode. Because this runs every pass, the moment you let go, the reading rises above 40 and the mode takes over again on the next pass.",
        deep:
          "There is no debounce or smoothing: one low reading flips the LED immediately, and a noisy reading around the threshold can flicker. A common upgrade is to average a few reads or add hysteresis, with one threshold for touching and a slightly higher one for releasing. Because `touch` is only an override and never changes `mode`, releasing the wire returns exactly to where the state machine was, even in the middle of an SOS cycle, since `sosOn` works from the clock alone.",
      },
      guess: {
        question: 'You type `off`, then touch the wire. What does the LED do?',
        options: [
          { text: 'Lights fully while touched, goes dark again on release', right: true },
          {
            text: 'Stays off, because the mode is OFF',
            right: false,
            why: 'The touch check comes first and skips `updateLed` entirely while the wire is touched.',
          },
          {
            text: 'Switches the mode to ON for good',
            right: false,
            why: 'Touch never changes `mode`. It only overrides the output while the reading is low.',
          },
        ],
        answer: "The touch check runs before the mode logic and wins while touched. The `mode` variable is untouched, so the LED returns to off on release.",
      },
    },
  ],
};

export default tour;
