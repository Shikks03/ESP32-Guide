import type { Tour } from '../types';

/**
 * Guided tour of labs/s1-loopback (platformio.ini, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
const tour: Tour = {
  lessonId: 's1',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'Two serial links, one speed in this file',
      text: {
        beginner:
          "The same project file as lab 02. The speed in it, 115200, is for the USB cable between the board and your PC. The radar link runs at a different speed, and you will see that one in the code, not here.",
        explorer:
          "`monitor_speed = 115200` is the baud rate of the monitor on your PC talking to UART0, the port wired to the USB chip. This lab also uses UART2 on GPIO 16 and 17 at 256000. PlatformIO knows nothing about that second port, so its speed lives in `main.cpp`. `monitor_echo = yes` is here again because you type commands.",
        deep:
          "Each UART has its own baud setting and its own pins, so two ports can run at two speeds at the same time. The USB-serial chip on your board sits on UART0 (GPIO 1 and 3) and cannot go to 256000 with a reliable monitor, which is one reason the radar gets a separate port. That is also why this lab can print results to the PC while it hammers UART2 at full speed.",
      },
      guess: {
        question: 'The monitor runs at 115200. Do you expect the radar link to use that number too? Why or why not?',
        answer:
          "No. They are different wires on different UARTs. The monitor link is set here. The radar link is set in `Serial2.begin()` in the code, and the radar talks at 256000.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [1, 7],
      anchor: '#include <Arduino.h>',
      title: 'Pins, speed and limits as named constants',
      text: {
        beginner:
          "Five named numbers at the top: the receive pin (16), the transmit pin (17), the radar's speed (256000), the longest test message, and how long to wait for an answer. Naming them means the rest of the code reads like words, and you change one line to change a setting.",
        explorer:
          "UART means two wires: one sends, one receives, and both ends agree on a speed called the **baud rate**. `RADAR_BAUD` is 256000 bits per second. `size_t` is the type C++ uses for sizes and counts, and `uint32_t` is an unsigned 32-bit number. `TIMEOUT_US = 200000` is in microseconds, so 200 ms. A byte at this speed takes under 40 microseconds, so 200 ms is generous.",
        deep:
          "Receive is first in the pin pair because the Arduino call takes `rxPin` before `txPin`. On a WROOM-32, GPIO 16 and 17 are free to use: they only become flash-memory pins on the WROVER module, which has PSRAM. Using `const` instead of `#define` gives the names a type, so a mix-up like passing the baud where a pin goes can be caught by the compiler, at least when the types differ.",
      },
      guess: {
        question: 'What does `256000` in `RADAR_BAUD` count?',
        answer: 'Baud is bits per second. Both ends of a UART link must use the same number, or the bytes arrive as garbage.',
      },
      words: ['include', 'const', 'uint32-t', 'size-t', 'uart'],
    },
    {
      file: 'src/main.cpp',
      lines: [9, 20],
      anchor: '// One test in flight',
      title: 'One struct holds the whole test',
      text: {
        beginner:
          "A test has several facts that belong together: what we sent, what came back, how many bytes, and whether we are still waiting. A `struct` bundles them into one named thing called `Test`, and the last line creates one, with everything set to zero.",
        explorer:
          "`uint8_t` is one byte, 0 to 255, the right type for raw serial data. `sent` and `back` are arrays of 256 bytes. `got` counts the bytes that have come back and `wrong` counts the ones that did not match. `Test test = {};` makes a variable of that type and the empty braces set every field to zero or false. You read a field with a dot: `test.got`.",
        deep:
          "Only one test runs at a time, so a single global `test` is enough, and keeping it in a struct makes it obvious which variables belong to the test and which are totals. The two 256-byte arrays cost 512 bytes of RAM, set aside once at startup, never on the heap. `isText` only decides how the result is printed. The sizes use the same constant `MAX_TEST`, so the arrays and the limit cannot drift apart.",
      },
      guess: {
        question: 'What does `Test test = {};` do?',
        options: [
          { text: 'Creates a Test and sets every field to zero or false', right: true },
          {
            text: 'Declares the type but creates nothing',
            right: false,
            why: 'The type was declared by the `struct Test { ... }` above. This line makes an actual variable named `test`.',
          },
          {
            text: 'Fills the arrays with 255',
            right: false,
            why: 'Empty braces mean zero, not 255.',
          },
        ],
        answer: 'The empty braces zero everything, so `active` starts false and `got` starts at 0.',
      },
      words: ['struct', 'uint8-t', 'bool'],
    },
    {
      file: 'src/main.cpp',
      lines: [22, 24],
      anchor: '// Running totals',
      title: 'Running totals',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Counters for the `stats` command: bytes sent, bytes back, wrong bytes, tests passed and failed, and stray bytes.",
        explorer:
          "A **stray byte** is one that arrives when no test is waiting for it. With a jumper in place that never happens. With the wire out, a floating input pin can pick up noise, and this counter shows it. Several variables of the same type can be declared on one line, separated by commas.",
        deep:
          "These are `uint32_t` so they cannot go negative and will take over 4 billion counts to wrap, which at full speed (25,600 bytes per second) is about two days of continuous sending. In practice a test is a few hundred bytes at a time.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [26, 28],
      anchor: 'void printHelp()',
      title: 'The command list',
      levels: ['deep'],
      text: {
        beginner: 'Prints the commands you can type.',
        explorer: 'One line of text. It is called at boot and for any unknown command.',
        deep:
          "Keeping the help text in one function means the list is printed in the same way from both places, so it cannot get out of date in one of them.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [30, 41],
      anchor: 'void startTest(const uint8_t *data, size_t len, bool isText)',
      title: 'Send a test out of GPIO 17',
      text: {
        beginner:
          "First it empties the receive side, in case old bytes are waiting. Then it remembers what it is about to send, notes the time, and writes the bytes out of pin 17. The loop will watch for them coming back in.",
        explorer:
          "`const uint8_t *data` is a **pointer**: the address of the first byte of the message, marked read-only. `memcpy` copies `len` bytes into `test.sent` so we can compare later. `micros()` is the clock in microseconds, finer than `millis()`. `Serial2.write(data, len)` queues the bytes for the hardware to send, and it returns quickly, long before the last bit has left the pin.",
        deep:
          "`memcpy` does not check that `len` fits. The `send` command caps it at `MAX_TEST`, which is the size of the array, so it always does here. Draining first matters: bytes left over from an earlier timed-out test would be counted as this test's answers and every comparison after that would be off by some bytes. Because the pin is looped back, the sent bytes come straight into the receive FIFO while we are still sending, which is why `Serial2.setRxBufferSize(1024)` is set in `setup()`.",
      },
      guess: {
        question: 'Why does `startTest` read and throw away anything waiting in `Serial2` before it sends?',
        options: [
          { text: 'So leftovers from an old test are not mistaken for this test\'s answer', right: true },
          {
            text: 'To make the UART faster',
            right: false,
            why: 'Draining has no effect on speed. It only clears old data.',
          },
          {
            text: 'Because the UART refuses to send while data is waiting',
            right: false,
            why: 'Sending and receiving are independent. The drain is the program\'s own choice.',
          },
        ],
        answer: 'Anything already waiting would be compared against the new message and look like errors. Emptying first gives a clean start.',
      },
      words: ['pointer', 'memcpy', 'micros'],
    },
    {
      file: 'src/main.cpp',
      lines: [43, 63],
      anchor: 'void finishTest(uint32_t elapsedUs)',
      title: 'Judge the test and say what it means',
      text: {
        beginner:
          "When a test ends, this checks two things: did every byte come back, and did every byte match. It prints what came back, the counts and the time, and if nothing at all came back it says which wire to look at.",
        explorer:
          "`ok` is true only if `got == len` and `wrong == 0`. The small loop prints the returned bytes as letters, using a dot for anything that is not printable (the same test as ASCII 32 to 126). `%u` and `%lu` in `printf` print unsigned numbers, and the casts keep the compiler happy about their size. A `got` of exactly 0 almost always means the loop wire is missing.",
        deep:
          "The test passes or fails on bytes, not on what they say, so `burst` can use every value from 0 to 255 including ones that look like control characters. The ternary `ok ? \"I\" : \"E\"` picks the log tag. Failure comes in two flavours that the numbers separate: `got < len` (bytes lost or never sent) versus `wrong > 0` (bytes arrived but changed, typically a baud-rate mismatch).",
      },
      guess: {
        question: 'The result says `0 of 5 bytes came back`. What is the most likely cause?',
        options: [
          { text: 'GPIO 16 and GPIO 17 are not joined', right: true },
          {
            text: 'The baud rate is too high',
            right: false,
            why: 'A wrong baud makes bytes arrive changed. With nothing wired, nothing arrives at all.',
          },
          {
            text: 'The message was too long',
            right: false,
            why: 'Five bytes is far below the 256-byte limit.',
          },
        ],
        answer: 'With the wire out, the ESP32 sends into nothing and hears nothing. That is what a missing radar wire will look like in S2.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [65, 81],
      anchor: '// Called every pass',
      title: 'Collect the bytes that come back',
      text: {
        beginner:
          "Every pass of `loop()`, this reads whatever has arrived on pin 16. Each byte is checked against the byte we sent in that position. When all the bytes are back, or 200 ms has passed, the test ends.",
        explorer:
          "`Serial2.available()` says how many bytes are waiting. The `while` reads them all. If there is no test, or the test already has all its bytes, the byte is a stray: count it and `continue` to the next one. Otherwise store it and compare it to `test.sent[test.got]`. `micros() - test.startUs` is the elapsed time, and the subtraction stays correct even when the clock wraps.",
        deep:
          "This function never waits. If the bytes are not there yet it returns, and `loop()` calls it again. That is why the test is a small state held in `test` rather than a blocking loop: the monitor commands and anything else keep working while a test is in flight. The comparison is position by position, so a lost byte shifts everything after it and makes many later bytes show up as wrong, not just one.",
      },
      guess: {
        question: 'What does `continue` do inside this `while` loop?',
        options: [
          { text: 'Skips the rest of this byte\'s handling and moves on to the next waiting byte', right: true },
          {
            text: 'Ends the whole function',
            right: false,
            why: 'That would be `return`. `continue` only skips to the next pass of the loop.',
          },
          {
            text: 'Waits for more bytes to arrive',
            right: false,
            why: 'Nothing here waits. `continue` is a jump, not a pause.',
          },
        ],
        answer: '`continue` jumps to the next pass of the `while`. A stray byte is counted and nothing more is done with it.',
      },
      words: ['continue'],
    },
    {
      file: 'src/main.cpp',
      lines: [83, 92],
      anchor: 'void printStats()',
      title: 'Totals, and where 39 microseconds comes from',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'Prints the settings and the running totals. It also prints how long one byte takes on the wire.',
        explorer:
          "Each byte is 10 bits on the wire: one start bit, 8 data bits and one stop bit. That is what `8N1` means. 10 bits times a millionth of a second divided by 256000 is about 39 microseconds, so 256 bytes need about 10 ms. The code does that sum rather than printing a fixed number.",
        deep:
          "`10UL * 1000000UL / RADAR_BAUD` is integer division, so it rounds down to 39 (39.06 exactly). The `UL` suffix keeps the multiplication in unsigned long so 10 million cannot overflow. This is the minimum time: the time reported by a test will be longer, because `loop()` only notices the returning bytes when it comes round to read them.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [94, 118],
      anchor: 'void runCommand(String line)',
      title: 'Commands: keep the text, lowercase the word',
      text: {
        beginner:
          "A typed line like `send hello` is split into the command word (`send`) and the rest (`hello`). Only the command word is made lowercase, so `hello` is sent exactly as you typed it. `burst` builds a message holding every byte value from 0 to 255.",
        explorer:
          "This is the same splitting as lab 02, with one change: the rest of the line keeps its capitals, because the text you send should not change. `if (test.active)` stops a second test from starting while one is still running. The `burst` loop fills the array with `0, 1, 2 ... 255`, and `(uint8_t)i` converts the counter to a byte.",
        deep:
          "`rest.c_str()` gives the String's characters as a plain array, which is what `startTest` wants. The text is capped at `MAX_TEST` bytes, so a long line is quietly shortened. `send` echoes what it sent before the test starts so the output always reads in order: sent, back, result. Because the check is byte by byte and the burst contains every value, it also exercises bytes that look like control codes such as `0x0A`.",
      },
      guess: {
        question: 'Why is only `name` lowercased, not the whole line?',
        options: [
          { text: 'So the text you ask to send arrives exactly as typed', right: true },
          {
            text: 'Lowercase text is faster to send',
            right: false,
            why: 'Speed is the same for any byte.',
          },
          {
            text: 'Serial cannot carry capital letters',
            right: false,
            why: 'Any byte value is fine. Capital letters are just different byte values.',
          },
        ],
        answer: 'Commands should be case-insensitive, but the message is data. Lowercasing it would change the bytes you meant to test.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [120, 131],
      anchor: 'void readSerial()',
      title: 'The same line reader as lab 02',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'This collects what you type into the monitor, one character at a time, and runs the command when you press Enter.',
        explorer:
          "It is the `readSerial()` from lab 02. It reads from `Serial`, the USB port, not `Serial2`. The `static String line` keeps a half-typed command between calls, and Enter (`\\n` or `\\r`) runs it.",
        deep:
          "Notice there are two serial objects in play. `Serial` carries your typing and the replies on UART0. `Serial2` carries the loopback test on UART2. Mixing them up is an easy bug: printing to `Serial2` would send text out of GPIO 17 instead of the monitor.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [133, 145],
      anchor: 'void setup()',
      title: 'Start both serial ports, with pins you choose',
      text: {
        beginner:
          "Two serial ports are started: the one for the USB monitor, and the second one on pins 16 and 17 at the radar's speed. Then it prints a short welcome and sends `ping` to itself as a first test.",
        explorer:
          "`Serial.begin(115200)` is the monitor. `Serial2.begin(RADAR_BAUD, SERIAL_8N1, PIN_RX2, PIN_TX2)` starts UART2 at 256000, with 8 data bits, no parity, 1 stop bit, and your pins: receive first, then transmit. `setRxBufferSize(1024)` makes the incoming buffer bigger, and it has to come before `begin()`. Because the 256-byte burst arrives while the code is still sending it, a bigger buffer is safer.",
        deep:
          "In Arduino-ESP32 3.x the default pins of `Serial2` are 4 and 25, where older 2.x versions used 16 and 17. If you left the pins out, the code would compile and run but listen on the wrong pins, and nothing would come back. Passing them explicitly is the fix, and it is the same line you will use for the radar. Boot ends with an automatic test so you learn about a missing jumper right away.",
      },
      guess: {
        question: 'Why does the code give pins 16 and 17 to `Serial2.begin()` instead of relying on the defaults?',
        options: [
          { text: 'In core 3.x the defaults changed to 4 and 25, so they must be given', right: true },
          {
            text: 'The defaults are fine, the pins are only there for documentation',
            right: false,
            why: 'The defaults on core 3.x are different pins. Without the explicit pins, nothing would come back.',
          },
          {
            text: 'Serial2 only works on pins 16 and 17',
            right: false,
            why: 'The ESP32 can route UART2 to most free pins. 16 and 17 are simply the pair this guide picked.',
          },
        ],
        answer: 'Always pass the pins. In core 3.x the default pair is 4 and 25, which would silently leave your wire unused.',
      },
      words: ['serial2-begin'],
    },
    {
      file: 'src/main.cpp',
      lines: [147, 150],
      anchor: 'void loop()',
      title: 'loop: listen to you, listen to the wire',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'Each pass it checks for something you typed, then checks for bytes coming back from the loop wire.',
        explorer:
          "Two quick checks, nothing blocking. Because neither call waits, the board stays responsive, and a test ends the moment its last byte arrives.",
        deep:
          "At 256000 baud a byte arrives every 39 microseconds, but the UART driver buffers them in the background, so `loop()` does not have to be that fast. It only has to come back before the 1024-byte buffer fills, which at this speed takes about 40 ms.",
      },
    },
  ],
};

export default tour;
