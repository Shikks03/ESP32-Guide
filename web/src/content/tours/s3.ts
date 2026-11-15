import type { Tour } from '../types';

/**
 * Guided tour of labs/s3-parse (platformio.ini, src/main.cpp, ts/parseFrame.ts).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
const tour: Tour = {
  lessonId: 's3',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'Same settings again',
      text: {
        beginner: "The same project file as S2. Parsing is all in the code, so nothing here changes.",
        explorer: "ESP32 platform, DevKit board, Arduino framework, monitor at 115200 with echo. The radar's own speed is set in `Serial2.begin()`.",
        deep: "This lab needs no extra build flags or libraries. The parser is plain C++ with fixed-size arrays and no heap use, which is one reason it is easy to port line for line to TypeScript.",
      },
      guess: {
        question: 'Parsing is new in this lab. Which settings file do you expect to change for it?',
        answer: 'None. Parsing is just code in `main.cpp`. The project settings describe the board and the monitor, not what the program does with the bytes.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [1, 10],
      anchor: '#include <Arduino.h>',
      title: 'Pins, speed, frame layout',
      text: {
        beginner: "The same pins and constants as S2, plus `MAX_TARGETS = 3`: a frame can hold at most three targets.",
        explorer: "`HEADER`, `TAIL` and `FRAME_LEN` describe the frame, exactly as in S2. `MAX_TARGETS` names the 3 so the loops below say what they mean instead of a bare number.",
        deep: "Three is a limit of the radar's frame format, not of this code. If a future radar sent more, you would change `MAX_TARGETS` and the block size here, and the loops would follow.",
      },
      guess: {
        question: 'How many targets can one LD2450 frame carry?',
        answer: 'Three 8-byte blocks, so up to three targets. Empty slots are filled with zeros.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [12, 19],
      anchor: '// The official example frame',
      title: 'A frame with a known answer',
      text: {
        beginner: "This is a real example frame printed in the radar's own document. The program keeps it so it can check its own parser: the document says what the answer must be.",
        explorer: "It is the same 30 bytes as the lesson shows: header, one target (`0E 03 B1 86 10 00 40 01`), two empty blocks, tail. Having a frame with a known answer lets you test the parser without a radar.",
        deep: "A known-answer test is the cheapest kind of safety net for a parser: if someone later edits the sign rule and gets it subtly wrong, the self-test fails at boot instead of the room view looking odd. The frame is `const`, so it lives in flash and uses no RAM.",
      },
      guess: {
        question: 'Why keep a fixed example frame in the program?',
        options: [
          { text: 'So the parser can be checked against an answer the document already gives', right: true },
          { text: 'The radar needs it to start up', right: false, why: 'The radar sends its own frames and never asks for this one.' },
          { text: 'To print something when no radar is connected', right: false, why: 'The self-test does print it, but the point is the check, not filling the screen.' },
        ],
        answer: 'The document decodes this frame by hand. If the code gets the same numbers, the rules are right.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [21, 27],
      anchor: 'struct Target {',
      title: 'What a target is',
      text: {
        beginner: "A target has a position (x and y in millimetres), a speed, a size number called resolution, and a yes/no flag saying whether the slot holds anyone at all.",
        explorer: "`int16_t` is a signed 16-bit number, so it can be negative: x is negative on one side of the radar. `speed` is in centimetres per second. `resolution` is `uint16_t` because it is never negative. `present` tells you whether to believe the other four fields.",
        deep: "Putting `present` in the struct, instead of using a magic coordinate for no target, avoids a real bug: x = 0 and y = 0 are legal positions. A struct of two int16 pairs and a flag is small enough (10 bytes after padding) to pass around freely, and three of them fit in a few dozen bytes of stack.",
      },
      guess: {
        question: 'Why does `Target` have a separate `present` flag?',
        options: [
          { text: 'Zero is a valid position, so the numbers alone cannot say "nobody here"', right: true },
          { text: 'To save memory', right: false, why: 'The flag takes memory, it does not save any.' },
          { text: 'The radar sends the flag in the frame', right: false, why: 'There is no flag in the frame. The code works it out from whether the 8 bytes are all zero.' },
        ],
        answer: '`present` is worked out from the frame. It cannot be replaced by a special x or y value because those are real positions too.',
      },
      words: ['int16-t'],
    },
    {
      file: 'src/main.cpp',
      lines: [29, 34],
      anchor: 'uint8_t frame[FRAME_LEN];',
      title: 'Frame and counters',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "The frame buffer and the counters. `every` decides how many frames are skipped between printed lines, so the monitor does not flood.",
        explorer: "`every = 2` means print every second frame: 10 frames a second becomes about 5 lines a second. `lastCount` remembers how many targets the previous frame had, so \"no targets\" can be printed once and not ten times a second. It starts at -1, which is neither 0 nor a real count, so the first frame always prints.",
        deep: "-1 as an \"unknown yet\" value works because a real count is never negative. The same trick avoids printing nothing at all if the room is empty from the very start: the first empty frame still prints `none` once.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [36, 38],
      anchor: '// The sign rule',
      title: 'The sign rule, as the document writes it',
      text: {
        beginner: "The radar does not store negative numbers the way most computers do. The top bit says the sign: set means positive, clear means negative. The other 15 bits are the size.",
        explorer: "The document says: highest bit 1 is positive, 0 is negative, and the other 15 bits are the value. So `0x0010` is 16 with the top bit clear, which means -16. And `0x8010` is the same size with the top bit set, which means +16. This is sign-and-magnitude. It is **not** two's complement.",
        deep: "Two's complement, what C++ uses for `int16_t`, would read `0x0010` as +16, so using the raw bytes as an `int16_t` gives the wrong sign for every value. The official example proves the rule: speed `10 00` decodes to -16 cm/s and y `B1 86` (0x86B1, top bit set) to +1713 mm. The same rule is applied to x, y and speed.",
      },
      guess: {
        question: 'Under the radar\'s rule, what does a raw value of `0x0010` mean for speed?',
        options: [
          { text: '-16 cm/s: top bit clear means negative', right: true },
          { text: '+16 cm/s', right: false, why: 'That is what two\'s complement would say. The radar uses the top bit as the sign, and here it is clear, which means negative.' },
          { text: '16 mm/s', right: false, why: 'The unit is cm/s, and the sign is still negative.' },
        ],
        answer: 'The top bit is clear, so negative, and the other 15 bits are 16. That is the speed -16 cm/s in the official example.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [39, 43],
      anchor: 'int16_t decodeSigned(uint8_t lo, uint8_t hi)',
      title: 'decodeSigned: two bytes in, one signed number out',
      text: {
        beginner: "Takes the two bytes of a number, low one first, glues them together, then reads the top bit as the sign and the rest as the size.",
        explorer: "`hi << 8` slides the second byte up eight places, and `lo | (hi << 8)` joins the two: that is **little-endian**, low byte first. `raw & 0x7FFF` keeps the low 15 bits, the size. `raw & 0x8000` isolates the top bit, which is non-zero if it was set. The last line picks `mag` for positive and `-mag` for negative.",
        deep: "`0x7FFF` is fifteen ones, so the mask drops only the sign bit. `mag` fits in an `int16_t` because it is at most 32767. Because `-mag` is computed on a signed value, it gives a normal negative number. For raw 0x0000 the result is 0, and a real zero is never confused with a missing target because a positive zero is encoded as 0x8000, not 0x0000.",
      },
      guess: {
        question: 'The bytes `2C 81` arrive (low byte first). What does `decodeSigned(0x2C, 0x81)` return?',
        options: [
          { text: '+300', right: true },
          { text: '-300', right: false, why: 'The raw value is 0x812C. Its top bit is set, which in this encoding means positive.' },
          { text: '33068', right: false, why: 'That is 0x812C read as a plain unsigned number. It forgets to treat the top bit as a sign.' },
        ],
        answer: 'raw = 0x812C. The top bit is set, so positive, and the other 15 bits are 0x012C = 300.',
      },
      words: ['shift-or', 'bit-mask'],
    },
    {
      file: 'src/main.cpp',
      lines: [45, 58],
      anchor: '// Turn one good',
      title: 'parseFrame: three blocks of eight bytes',
      text: {
        beginner: "For each of the three slots, it looks at that slot's 8 bytes. If they are all zero, nobody is there. Otherwise it decodes x, y, speed and resolution from them.",
        explorer: "`f + 4 + i * 8` is a pointer to the start of block `i`: skip the 4 header bytes, then 8 per earlier block. The `for k` loop checks whether all 8 bytes are zero. x uses `p[0]` and `p[1]`, y uses `p[2]` and `p[3]`, speed `p[4]` and `p[5]`, and resolution `p[6]` and `p[7]` joined the same low-byte-first way.",
        deep: "Fields of an empty slot are set to zero so the struct never carries stale numbers. The decision `empty ? 0 : ...` is the same check repeated four times, which is cheap and keeps each line readable. The function does not re-check the header or tail: it is only called by code that already verified them.",
      },
      guess: {
        question: 'For `i = 2` (the third target), where does its block start in the frame?',
        options: [
          { text: 'Byte 20: 4 header bytes + 2 earlier blocks of 8', right: true },
          { text: 'Byte 12', right: false, why: 'That is where the second block starts (4 + 8).' },
          { text: 'Byte 28', right: false, why: 'Byte 28 is where the tail begins.' },
        ],
        answer: '4 + 2 x 8 = 20, and the block runs to byte 27. The tail is bytes 28 and 29.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [60, 74],
      anchor: 'void printHelp()',
      title: 'Printing targets',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "Prints one line with a time stamp, then each of the three slots: its numbers with units, or `none`.",
        explorer: "The `for` loop goes through the slots. `%d` prints a signed number and `%u` an unsigned one (resolution cannot be negative). Units are written out (`mm`, `cm/s`) so the output is self-explanatory.",
        deep: "The line is built from several `printf` calls with no newline until the end, which is fine on a single-threaded loop. `T%d` uses `i + 1` so people see T1 to T3, not T0 to T2, even though the array counts from 0.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [76, 87],
      anchor: '// Parse the official frame',
      title: 'The self-test',
      text: {
        beginner: "Parses the built-in example frame and prints the result. If it matches the answer the radar's document gives, it says `parser OK`.",
        explorer: "The expected values are the ones from the document: x = -782, y = 1713, speed = -16, resolution = 320, and targets 2 and 3 empty. `ok` is `true` only if every one matches (`&&` means all must be true). The ternary then prints the OK or WRONG line. It runs at boot and on the `test` command.",
        deep: "The test needs no radar and no Wi-Fi, so it is the first thing to check if numbers later look odd. It only guards the decode, not the frame finder. A broken frame finder would still pass this test but print nothing, which you would see from the counts in `stats`.",
      },
      guess: {
        question: 'What y value does the self-test expect?',
        options: [
          { text: '1713 mm', right: true },
          { text: '34481 mm', right: false, why: 'That is the raw number 0x86B1. The top bit is the sign, so the real size is 34481 - 32768.' },
          { text: '-1713 mm', right: false, why: 'The top bit of `B1 86` is set, which means positive.' },
        ],
        answer: 'y is bytes `B1 86` = 0x86B1. Top bit set means positive, and the low 15 bits are 1713.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [89, 104],
      anchor: 'void handleFrame()',
      title: 'What to do with each good frame',
      text: {
        beginner: "Each good frame is parsed and the targets are counted. If anyone is there, a line is printed (every second frame). If nobody is, it prints `none` once when the room becomes empty, and then stays quiet.",
        explorer: "`count` is how many slots have `present` set. `maxSeen` remembers the most targets seen at once. When the count is 0 and the previous frame was not, print once. Otherwise, for a non-empty frame, `framesTotal % every == 0` prints only every Nth frame. At the end `lastCount` is updated for the next frame.",
        deep: "Printing on change for the empty case and on a schedule for the busy case keeps the monitor readable in both. A line is still printed even when the target list changes between prints, since each line is a full snapshot of all three slots.",
      },
      guess: {
        question: 'Why does the code print `none` only when `lastCount != 0`?',
        options: [
          { text: 'An empty room would otherwise print ten identical lines a second', right: true },
          { text: 'The radar sends an empty frame only once', right: false, why: 'It sends frames ten times a second, empty or not.' },
          { text: 'So `none` never appears at boot', right: false, why: 'The first frame is the opposite: `lastCount` starts at -1 so it does print.' },
        ],
        answer: 'It prints the change from busy to empty once, and stays quiet while nothing changes.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [106, 128],
      anchor: 'void feedByte(uint8_t b)',
      title: 'Finding frames: same as S2',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "The frame finder from S2, almost unchanged. It collects 30 bytes, checks the tail, and now calls `handleFrame()` for good frames.",
        explorer: "Same state machine: match the header byte by byte, collect up to 30, check `55 CC`. The one difference is the good-frame branch, which calls `handleFrame()` instead of printing hex. A bad frame just counts.",
        deep: "Each lab carries its own copy so it builds on its own. In a bigger project this would live in one shared file. Keeping frame finding and parsing as two separate steps is what lets S4 swap the printing for a network send without touching either.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [130, 147],
      anchor: 'void printStats()',
      title: 'Stats and commands',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "`stats` prints totals. `every <n>` changes how often lines are printed. `test` re-runs the self-test.",
        explorer: "`every 5` prints every 5th frame. `constrain(arg, 1, 100)` keeps the number between 1 and 100, and the check `arg > 0` rejects zero and non-numbers. The command split is the same as in lab 02.",
        deep: "`toInt()` returns 0 for text that is not a number, so `every abc` is rejected by the `arg > 0` check and falls through to the help message. A bare `every` has `arg = -1` and does the same.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [149, 160],
      anchor: 'void readSerial()',
      title: 'Line reader',
      levels: ['deep'],
      text: {
        beginner: "Collects your typed command.",
        explorer: "Same function as before.",
        deep: "Unchanged since lab 02. It reads from the USB port, `Serial`, not the radar's `Serial2`.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [162, 171],
      anchor: 'void setup()',
      title: 'Start, self-test, ready',
      text: {
        beginner: "Starts both serial ports, prints the pin line, runs the self-test and prints the command list.",
        explorer: "The same `Serial2.begin(...)` as in S2, with explicit pins. `selfTest()` is called once here so a parser problem shows up straight away at boot.",
        deep: "Order matters a little: the radar port is started first so bytes begin to buffer during the half-second `delay`. Nothing is lost, because the buffer was enlarged with `setRxBufferSize(1024)` before `begin()`.",
      },
      guess: {
        question: 'The self-test passes at boot, but nothing prints once you stand in front of the radar. Where is the problem likely to be?',
        options: [
          { text: 'The wiring or the frame finder, not the decode', right: true },
          { text: 'The sign rule', right: false, why: 'The self-test just proved the decode gives the right answer on the official frame.' },
          { text: 'The struct layout', right: false, why: 'The self-test also exercises the struct. Both are fine.' },
        ],
        answer: 'The self-test covers decoding only. If nothing prints, check `stats` for frames arriving, then go back to the S2 wiring checks.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [173, 176],
      anchor: 'void loop()',
      title: 'loop: read, feed, repeat',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "Reads your typing, then feeds every waiting radar byte into the frame finder.",
        explorer: "`while (Serial2.available()) feedByte(Serial2.read());` is read-and-process in one line. A `while` with no braces runs just the next statement.",
        deep: "Everything that matters happens inside `feedByte` the moment a frame completes. There is no timer: the radar's own 10 Hz rhythm drives the printing.",
      },
    },
    {
      file: 'ts/parseFrame.ts',
      lines: [1, 13],
      anchor: '// LD2450 frame parser in TypeScript',
      title: 'The same parser in TypeScript',
      text: {
        beginner: "This file does the same job as the C++ above, in the language you already know. It describes a target, and lists the header, tail and frame length.",
        explorer: "`Target` is an interface with four numbers. Unlike the C++ struct there is no `present` field: an empty slot is `null` instead, which is the TypeScript way to say there is nothing there. `HEADER` and `TAIL` are plain arrays of numbers.",
        deep: "`number` in TypeScript is a double, so no int16 wrapping happens: the decoded value is just a number between -32767 and 32767. That also means the rule has to be written explicitly, which is the point of this exercise.",
      },
      guess: {
        question: 'You know TypeScript. Before reading on, how would you mark an empty target slot?',
        answer: 'The file uses `null` in the result array, typed as `(Target | null)[]`, so a caller has to check before reading `x` or `y`.',
      },
    },
    {
      file: 'ts/parseFrame.ts',
      lines: [15, 21],
      anchor: '// The sign rule from the protocol document',
      title: 'decodeSigned in TypeScript',
      text: {
        beginner: "The same rule as in the C++: read the two bytes low-byte-first, and let the top bit decide the sign.",
        explorer: "Line for line the same as the C++ version: `lo | (hi << 8)`, mask with `0x7fff`, test `0x8000`. One small difference: it writes `0 - mag` and not `-mag`, because in JavaScript `-0` is a real value that prints as `-0`.",
        deep: "This is the line to compare with the C++: `return (raw & 0x8000) ? mag : -mag;` and `return raw & 0x8000 ? mag : 0 - mag;`. Same rule, same result for every input. JavaScript bitwise operators work on 32-bit integers, so `hi << 8` is safe for any byte.",
      },
      guess: {
        question: 'Why does the TypeScript write `0 - mag` and not `-mag`?',
        options: [
          { text: 'In JavaScript `-0` is a distinct value, and `0 - 0` gives a plain 0', right: true },
          { text: 'It is faster', right: false, why: 'There is no speed difference to speak of. It is about the result for zero.' },
          { text: 'TypeScript does not allow unary minus', right: false, why: 'Unary minus is fine. It just turns 0 into -0.' },
        ],
        answer: 'A raw 0x0000 would otherwise give `-0`, which is harmless but prints oddly and fails strict equality tests against 0.',
      },
    },
    {
      file: 'ts/parseFrame.ts',
      lines: [23, 45],
      anchor: '/** Returns 3 slots',
      title: 'parseFrame in TypeScript',
      text: {
        beginner: "Checks the length, header and tail, and gives up with `null` if any is wrong. Then it reads three blocks of 8 bytes and returns a list with a target or `null` for each.",
        explorer: "`HEADER.some(...)` is true if any header byte differs. `bytes.subarray(p, p + 8)` is a view of one block, and `block.every((b) => b === 0)` is the all-zero check. The numbers come out of `decodeSigned`, and resolution is the plain unsigned join of the last two bytes.",
        deep: "The function is pure: no state, no I/O. In a browser you could feed it chunks from the Web Serial API, but a real stream needs the same header-hunting state machine as the C++, since a stream does not arrive cut into frames. This version assumes you hand it exactly one frame at a time.",
      },
      guess: {
        question: 'What does `parseFrame` return for a 30-byte frame whose tail is wrong?',
        options: [
          { text: '`null`', right: true },
          { text: 'An array of three `null`s', right: false, why: 'That is what a good frame with nobody in the room returns. A bad frame is rejected as a whole.' },
          { text: 'It throws an error', right: false, why: 'It never throws. A bad frame is reported with the return value.' },
        ],
        answer: 'The tail check returns `null` straight away, before any block is read.',
      },
    },
    {
      file: 'ts/parseFrame.ts',
      lines: [47, 57],
      anchor: '// The official example frame',
      title: 'Try it on the official frame',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "The official example frame as a list of bytes, and a line that prints the result.",
        explorer: "Run the file with `npx tsx parseFrame.ts` and the last line should print `x: -782, y: 1713, speed: -16, resolution: 320` followed by two `null`s. Change a byte and see what changes.",
        deep: "Try the second and third sample frames from the lesson, then break the frame: change the tail or drop a byte and watch `null` come back. Then write the stream version, which finds the header in a longer array of bytes. That is the next step before using this against a live radar.",
      },
    },
  ],
};

export default tour;
