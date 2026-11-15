import type { Tour } from '../types';

/**
 * Guided tour of labs/s2-raw-bytes (platformio.ini, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
const tour: Tour = {
  lessonId: 's2',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'Nothing new here',
      text: {
        beginner:
          "This is the same project file as the loopback lab. The radar's speed is not in here; it is set in the code, because it belongs to a different serial port than the USB monitor.",
        explorer:
          "Six lines: ESP32 platform, DevKit board, Arduino framework, 115200 for the PC monitor, and `monitor_echo` so you can see your typing. The radar runs on UART2 at 256000, set in `Serial2.begin()`.",
        deep:
          "Keeping the monitor at 115200 is deliberate. Frame lines are about 110 characters and arrive ten times a second, roughly 1,100 bytes a second, well inside what 115200 baud carries (about 11,500 bytes a second). If you printed every byte with `raw` plus frames, you would still fit.",
      },
      guess: {
        question: 'Compare this file with the one from S1. What do you expect to be different?',
        answer: 'Nothing. The wiring and the radar speed are in `main.cpp`. The project file only describes the USB side.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [1, 5],
      anchor: '#include <Arduino.h>',
      title: 'Which pin hears the radar',
      text: {
        beginner:
          "The radar sends data out of its TX pin. That wire must go to a pin on the ESP32 that listens, so `PIN_RADAR_RX` is 16. The reverse wire goes to 17. The speed is 256000, what the radar uses.",
        explorer:
          "Transmit always goes to receive and receive to transmit: the two wires cross. Names like `PIN_RADAR_RX` say what the pin does on the ESP32 side, which is why the radar's TX lands on it.",
        deep:
          "The radar's outputs are 3.3 V logic, so they can go straight into an ESP32 input. The supply is a separate matter: the radar's 5 V pin has to see 5 V and nothing from a signal line ever should. The document does not state the radar's RX input tolerance in words, so keep it fed from the ESP32's 3.3 V output, which is the intended connection.",
      },
      guess: {
        question: 'The radar\'s TX wire goes to which ESP32 pin?',
        answer: 'TX talks, RX listens. The radar\'s TX goes to the ESP32\'s RX (GPIO 16) and the other pair crosses the same way.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [7, 10],
      anchor: '// A radar frame',
      title: 'What a frame looks like',
      text: {
        beginner:
          "The radar sends the same-shaped chunk over and over, called a frame. Every frame begins with four known bytes and ends with two known bytes. The program uses those to know where a frame starts and whether it arrived whole.",
        explorer:
          "Numbers starting `0x` are **hexadecimal**: two digits per byte, so `0xAA` is 170. The header is `AA FF 03 00`, the tail is `55 CC`, and the whole frame is 30 bytes: 4 for the header, 24 for three 8-byte targets, 2 for the tail. They are `const` arrays, so they can never change.",
        deep:
          "The header and tail come from the LD2450 serial protocol document. A fixed header is how you find your place in a stream that has no gaps: the receiver can join at any moment, in the middle of a frame, and simply wait for `AA FF 03 00`. The tail is a cheap error check. If the byte after the header's 26 bytes is not `55 CC`, something was dropped or the stream was misaligned.",
      },
      guess: {
        question: 'How many bytes is one frame, in total?',
        options: [
          { text: '30: 4 header + 24 for three targets + 2 tail', right: true },
          {
            text: '24: just the three targets',
            right: false,
            why: 'The targets are 24 of the bytes. The header and tail add 6 more.',
          },
          {
            text: '8: one target block',
            right: false,
            why: 'A target block is 8 bytes, and a frame carries three of them plus the header and tail.',
          },
        ],
        answer: '4 + 3 x 8 + 2 = 30 bytes.',
      },
      words: ['hex'],
    },
    {
      file: 'src/main.cpp',
      lines: [12, 19],
      anchor: 'uint8_t frame[FRAME_LEN];',
      title: 'The frame being built, and the counters',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "`frame` is the box where the bytes of the current frame are collected, and `have` counts how many are in it so far. The other variables are counters for the stats and two on/off switches for what to print.",
        explorer:
          "`have` is the key variable: how far through a frame we are. The three `window...` counters cover the last 2 seconds only, to work out a rate. `bool showFrames = true` and `showRaw = false` are the switches you flip with the `frames` and `raw` commands.",
        deep:
          "All of these are plain globals, which is fine for a program this size because only `loop()` and the functions it calls touch them. There is no interrupt or second task writing to them. Counting bytes in the window and not just frames also lets the program tell \"radar silent\" (zero bytes) from \"radar noisy but no valid frames\" (bytes but no frames).",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [21, 29],
      anchor: 'void printHelp()',
      title: 'Printing a frame as hex',
      text: {
        beginner:
          "`printFrame` prints the time, the frame number, and then all 30 bytes as two-digit hex numbers separated by spaces. That is the line you will see about ten times a second.",
        explorer:
          "`%02X` in `printf` means: print as capital hex, at least two digits, padding with a zero. So the byte 5 prints as `05` and 255 as `FF`. A `for` loop goes through all 30 bytes and prints each one. Two digits per byte keeps the columns lined up, so you can read frame after frame.",
        deep:
          "Printing 30 bytes with 30 separate `printf` calls is simple and fast enough here, since the text is only about 110 characters. The `[%lu ms]` timestamp is `millis()` cast to `unsigned long` so the format and the type agree. Because this prints at the radar's pace and the monitor is slower than the UART, a very long print could eventually delay `loop()`. At ten frames a second it never comes close.",
      },
      guess: {
        question: 'What does `Serial.printf("%02X", 5)` print?',
        options: [
          { text: '05', right: true },
          {
            text: '5',
            right: false,
            why: 'The `02` means at least two digits, padded with a zero.',
          },
          {
            text: '0x5',
            right: false,
            why: '`%02X` does not add the `0x` prefix.',
          },
        ],
        answer: '`%02X` is two hex digits with a leading zero, so 5 becomes `05`.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [31, 43],
      anchor: '// Feed the bytes in one at a time',
      title: 'Hunting for the header, one byte at a time',
      text: {
        beginner:
          "Bytes are fed in one at a time. While the program is still looking for the start of a frame, it asks of each byte: is this the next byte of `AA FF 03 00`? If yes, keep it. If not, start looking again.",
        explorer:
          "`have` counts how many header bytes have matched so far. If the new byte is the next expected one, store it and move on. If it is not, but it is `AA`, it could be the start of a new header, so store it as byte 0 and set `have` to 1. Otherwise go back to 0. This is a **state machine**: a small memory (`have`) and a rule for each byte.",
        deep:
          "The middle branch is the subtle one. Without it, a stream like `AA AA FF 03 00` would lose the real header: the second `AA` fails the match against `FF` and a reset to 0 would throw it away. Restarting at 1 when the failing byte is itself `AA` handles that. The header has only one `AA`, so this simple rule is enough. A header with repeated bytes would need a fuller matcher.",
      },
      guess: {
        question: 'The bytes `AA FF 07` arrive. What happens to `have` when the `07` comes in?',
        options: [
          { text: 'It goes back to 0, because 07 is not the expected 03 and is not AA', right: true },
          {
            text: 'It becomes 3, because three bytes arrived',
            right: false,
            why: 'Only matching bytes advance `have`. The 07 does not match.',
          },
          {
            text: 'Nothing, the byte is kept',
            right: false,
            why: 'A byte that does not match is thrown away and the search starts over.',
          },
        ],
        answer: 'The match breaks at `07`, which is not `AA` either, so `have` returns to 0 and the hunt starts again.',
      },
      words: ['state-machine'],
    },
    {
      file: 'src/main.cpp',
      lines: [45, 57],
      anchor: 'frame[have++] = b;',
      title: 'Collect the rest, then check the tail',
      text: {
        beginner:
          "Once the header has matched, every byte is stored until there are 30. Then the program looks at the last two. If they are `55 CC`, it is a good frame. If not, it counts a bad tail and says so.",
        explorer:
          "`frame[have++] = b` stores the byte and then adds 1 to `have`. When `have` reaches `FRAME_LEN` the frame is full, so reset to 0 for the next one. Counting from zero, a 30-byte frame has its last two bytes at positions 28 and 29, which is `FRAME_LEN - 2` and `FRAME_LEN - 1`. A good frame bumps the counters and prints. A bad one prints which two bytes were found instead.",
        deep:
          "After a bad tail the code just returns to hunting for a header. A fancier version could scan the bad frame for an `AA FF 03 00` inside it and recover faster, but with frames coming 10 times a second, the cost of one lost frame is 100 ms. `have = 0` is done before the check, so every exit leaves the matcher ready for the next frame.",
      },
      guess: {
        question: 'Why does the tail check look at `frame[FRAME_LEN - 2]` and `frame[FRAME_LEN - 1]`?',
        options: [
          { text: 'Counting from 0, the last two of 30 bytes sit at positions 28 and 29', right: true },
          {
            text: 'The tail is always the first two bytes',
            right: false,
            why: 'The first four bytes are the header. The tail comes last.',
          },
          {
            text: 'Arrays in C++ start counting at 1',
            right: false,
            why: 'They start at 0, which is exactly why the last position is 29, not 30.',
          },
        ],
        answer: 'Arrays count from 0, so a 30-byte frame ends at index 29, and the byte before it is index 28.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [59, 72],
      anchor: 'void readRadar()',
      title: 'Read everything that has arrived',
      text: {
        beginner:
          "Every pass of `loop()` this takes all the bytes waiting from the radar, counts them, notes the time of the last one, and passes each to the frame finder. With `raw` turned on it also prints each byte, 16 to a line.",
        explorer:
          "`Serial2.available()` is the number of bytes waiting, and `while` reads until there are none. `lastByteMs` is how recently we heard anything. `++rawColumn == 16` adds one to the counter first and then compares, so a new line starts after every 16 bytes. `static int rawColumn` keeps its value between calls.",
        deep:
          "The radar sends in bursts: a 30-byte frame arrives in about 1.2 ms at 256000 baud, then silence for the rest of the 100 ms. So most calls find nothing, and a few find a whole frame. The UART driver's buffer (set bigger in `setup()`) means the code does not have to catch every byte as it lands.",
      },
      guess: {
        question: 'Why does `readRadar` use `while (Serial2.available())` and not `if`?',
        options: [
          { text: 'A whole frame can be waiting, and `while` takes all of it in one pass', right: true },
          {
            text: 'It makes the loop wait for the radar',
            right: false,
            why: '`while` only repeats as long as bytes are waiting. When there are none, it stops at once.',
          },
          {
            text: 'There is no difference',
            right: false,
            why: 'With `if` you would handle just one byte per `loop()` pass and fall behind the radar.',
          },
        ],
        answer: 'Up to 30 bytes can be waiting at once. `while` drains them all, `if` would take only one per pass.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [74, 88],
      anchor: '// Every 2 seconds',
      title: 'The rate line, and the wiring hint',
      text: {
        beginner:
          "Every two seconds this prints how many frames arrived, so you can see the radar is alive: about 10 per second. If no bytes arrived at all, it prints a reminder of the wiring instead.",
        explorer:
          "`if (now - windowStart < 2000) return;` leaves until two seconds have passed. `secs` is a `float`, a number with a decimal point, so the rate `windowFrames / secs` can be 10.0 instead of rounding to 10. `%.1f` prints one digit after the point. Then the counters for this window are reset. Zero bytes means no radar signal at all, so the message lists every wire to check.",
        deep:
          "The `now - windowStart` pattern survives the `millis()` wraparound at 49 days. The division by `secs` uses the real elapsed time rather than a fixed 2.0, because the report can run a little late if `loop()` was busy. A rate of exactly 10.0 means a frame every 100 ms, as the document specifies. A rate that is low but non-zero with bad tails is a different problem from silence: it points at a baud mismatch or a noisy wire.",
      },
      guess: {
        question: 'The monitor prints `No bytes from the radar` every two seconds. What do you check first?',
        options: [
          { text: 'Power and that radar TX goes to GPIO 16, with USB unplugged while you look', right: true },
          {
            text: 'The `monitor_speed` in platformio.ini',
            right: false,
            why: 'You can read this message, so the monitor speed is fine. The problem is on the radar side.',
          },
          {
            text: 'Press the EN button repeatedly',
            right: false,
            why: 'A reset does not fix a missing wire or missing power.',
          },
        ],
        answer: 'Silence means no bytes reached GPIO 16. Check 5V and GND first, then TX to RX, with the USB unplugged while you touch wires.',
      },
      words: ['float'],
    },
    {
      file: 'src/main.cpp',
      lines: [90, 95],
      anchor: 'void printStats()',
      title: 'Totals on demand',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'Prints the byte, frame and bad-tail totals, and how long ago the last byte arrived.',
        explorer:
          "`last byte ... ms ago` is `millis() - lastByteMs`. If it grows past a few hundred, the radar has gone quiet. The expression `lastByteMs ? ... : 0` avoids a huge nonsense number before any byte has ever arrived.",
        deep:
          "`lastByteMs ? a : b` relies on 0 being false. That works because `millis()` is never exactly 0 by the time a byte arrives, since `setup()` has a 500 ms delay. It is a small shortcut, and a separate `bool` would be more explicit.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [97, 105],
      anchor: 'void runCommand(String cmd)',
      title: 'Four small commands',
      levels: ['explorer', 'deep'],
      text: {
        beginner: '`frames` and `raw` flip two switches, `stats` prints totals, `reset` clears them.',
        explorer:
          "`showFrames = !showFrames` flips a true/false variable. The `\\n` at the start of the `raw` message gives it a fresh line, because `raw` prints bytes without line ends and the message could otherwise land in the middle of a row. `reset` clears three counters with one chained assignment.",
        deep:
          "`bytesTotal = framesTotal = badTails = 0` works because an assignment is itself an expression with a value, evaluated right to left. Reset does not clear the frame rate window, so the next rate line is still honest.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [107, 118],
      anchor: 'void readSerial()',
      title: 'Line reader, as before',
      levels: ['deep'],
      text: {
        beginner: 'Collects what you type until Enter.',
        explorer: 'The same function as in lab 02 and S1.',
        deep:
          "Both ports are read in `loop()`: `readSerial()` for your typing on UART0 and `readRadar()` for the radar on UART2. They never share a buffer, so a flood of radar data cannot swallow your commands.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [120, 131],
      anchor: 'void setup()',
      title: 'Start both ports and say what to look for',
      text: {
        beginner:
          "Starts the USB monitor and the radar port, waits half a second, and prints which pins and speed are in use and what a frame looks like. That way you know what you are looking for.",
        explorer:
          "`Serial2.begin(RADAR_BAUD, SERIAL_8N1, PIN_RADAR_RX, PIN_RADAR_TX)` is the same call as in S1, with the same reason for giving the pins. `windowStart = millis()` starts the first 2-second window from now, not from boot.",
        deep:
          "Printing the expected header and tail at boot is documentation that cannot go stale: it comes from the same program that does the matching. If the radar's output mode were changed, for example with the radar's configuration commands that this lab does not use, those lines are what you would check frames against.",
      },
      guess: {
        question: 'Where does the radar\'s speed of 256000 get applied?',
        options: [
          { text: 'In `Serial2.begin()`, for UART2 only', right: true },
          {
            text: 'In `monitor_speed` in platformio.ini',
            right: false,
            why: 'That is the USB monitor speed, 115200. It has nothing to do with the radar link.',
          },
          {
            text: 'Automatically, the radar tells the ESP32',
            right: false,
            why: 'UARTs have no negotiation. Both ends must be set to the same speed beforehand.',
          },
        ],
        answer: 'Only `Serial2.begin()` sets it, and only for UART2. The USB monitor is a separate port at 115200.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [133, 137],
      anchor: 'void loop()',
      title: 'loop: three quick jobs',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'Read what you typed, read what the radar sent, and print the rate line when it is due.',
        explorer: 'Three calls and no waiting. Each one returns straight away if there is nothing to do, so the loop spins thousands of times a second.',
        deep:
          "`millis()` is read once and passed in, so the rate check and anything else in one pass agree on the time. Nothing in the loop blocks, so frames are handled within microseconds of arriving.",
      },
    },
  ],
};

export default tour;
