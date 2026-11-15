import type { Tour, TourStop } from '../types';

/**
 * Guided tour of labs/w1-scan (platformio.ini, include/secrets.example.h, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
type Guess = NonNullable<TourStop['guess']>;
const pick = (question: string, right: string, wrongs: [string, string][], answer: string): Guess => ({
  question,
  options: [{ text: right, right: true }, ...wrongs.map(([text, why]) => ({ text, right: false, why }))],
  answer,
});

const tour: Tour = {
  lessonId: 'w1',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'The same project file as before',
      text: {
        beginner:
          'Nothing new here. It is the same project file as lab 02: ESP32 platform, generic DevKit board, Arduino framework, 115200 baud, echo on. Wi-Fi is built into the Arduino toolkit for this chip, so it needs no extra line.',
        explorer:
          'There is no `lib_deps` line, and that is on purpose. `WiFi` ships inside the Arduino-ESP32 framework, so `#include <WiFi.h>` just works. Every Wi-Fi lab in this track is built from the framework alone, with nothing downloaded.',
        deep:
          'PlatformIO pins the framework version through the platform, so the Wi-Fi API you read here is the one that compiles. A library that is part of the framework is found automatically by its include. Only third-party libraries need `lib_deps`.',
      },
      guess: {
        question: 'This lab uses Wi-Fi, yet `platformio.ini` has no Wi-Fi line. Why do you think that is?',
        answer:
          'Wi-Fi support is part of the Arduino framework for the ESP32, so including `WiFi.h` is enough. Nothing extra needs to be installed.',
      },
    },
    {
      file: 'include/secrets.example.h',
      lines: [1, 3],
      anchor: '// Copy this file',
      title: 'A file for things you must not share',
      text: {
        beginner:
          'Your Wi-Fi password should never end up in code you share. So the real values go in a separate file, `secrets.h`, which is kept private. This `secrets.example.h` is the template you copy.',
        explorer:
          'The comment tells you the routine: copy it to `secrets.h`, fill it in. `secrets.h` is listed in `.gitignore`, so it is never committed. `#pragma once` is a one-line guard that stops the file being pasted in twice if two files include it.',
        deep:
          'Keeping secrets in a header is a pragmatic hobby-grade choice: the values are compiled into the firmware, so anyone who can read the flash can read them. It keeps them out of version control, which is the real risk for a shared repo. The firmware also never prints the password.',
      },
      guess: {
        question: 'Why is the real password kept in `secrets.h` and not written in `main.cpp`?',
        answer:
          '`main.cpp` is shown and shared, `secrets.h` is gitignored and stays on your PC. Same idea as a `.env.local` file in a web project.',
      },
      words: ['pragma-once'],
    },
    {
      file: 'include/secrets.example.h',
      lines: [5, 6],
      anchor: '#define WIFI_SSID',
      title: 'Name and password as placeholders',
      text: {
        beginner:
          'Two named values: the network name (SSID) and its password. These are placeholders, so a fresh copy of the project still builds. The firmware notices the placeholder and tells you to fill in your own.',
        explorer:
          '`#define` makes a text substitution: wherever the code says `WIFI_SSID`, the compiler sees the quoted text. The comment says why the name must be a 2.4 GHz network: the chip cannot see 5 GHz ones.',
        deep:
          'Because these are macros, they have no type and cost no memory by themselves. The text ends up in flash as a string literal wherever it is used. The `strcmp` check in `main.cpp` compares against the exact placeholder text, so changing the placeholder here means changing it there.',
      },
      guess: pick(
        'What does the board do while `WIFI_SSID` is still `"your-2.4GHz-network"`?',
        'It still builds and runs, but tells you to create `secrets.h` and refuses to join',
        [
          ['It joins a network with that exact name', 'No such network exists, and the code checks for the placeholder before even trying.'],
          ['It will not build at all', 'The placeholder file is there exactly so the build works without your real values.'],
        ],
        'The code compares the name to the placeholder and prints a hint instead of joining. `scan` still works, because scanning needs no password.',
      ),
      words: ['define'],
    },
    {
      file: 'src/main.cpp',
      lines: [1, 2],
      anchor: '#include <Arduino.h>',
      title: 'Pull in the Wi-Fi toolkit',
      text: {
        beginner:
          'Two includes. `Arduino.h` gives you the basics like `Serial`. `WiFi.h` adds the Wi-Fi commands: scanning, joining, asking for the IP address.',
        explorer:
          '`#include` pastes another file in before compiling. After `WiFi.h`, a ready-made object called `WiFi` exists. You never create it yourself: you just call `WiFi.scanNetworks()`, `WiFi.begin()` and so on.',
        deep:
          '`WiFi` is a global instance of the Arduino-ESP32 Wi-Fi class, which wraps the ESP-IDF Wi-Fi driver. Types such as `wifi_auth_mode_t` and `wl_status_t` come in through this header too, which is why they are usable later without any other include.',
      },
      guess: {
        question: 'Before reading on: which line would you guess turns the Wi-Fi radio into something you can call, like `WiFi.begin(...)`?',
        answer: '`#include <WiFi.h>`. It brings in the `WiFi` object. The radio itself is already part of the chip.',
      },
      words: ['include'],
    },
    {
      file: 'src/main.cpp',
      lines: [4, 10],
      anchor: '// Your Wi-Fi name',
      title: 'Use secrets.h if it exists',
      text: {
        beginner:
          'This block says: if you made your own `secrets.h`, use it. If not, use the example file. That way the project builds on a fresh copy, and your real password is only ever in your private file.',
        explorer:
          '`__has_include("secrets.h")` asks the compiler whether the file exists. `#if` keeps one branch and throws the other away before compiling. The example file defines the same names, so the rest of the code never knows which one it got.',
        deep:
          'Both files define `WIFI_SSID` and `WIFI_PASS`, so the choice is invisible to later code. `__has_include` is a compiler feature that GCC supports, which PlatformIO uses for the ESP32. Searching for `"secrets.h"` includes the lab\'s `include/` folder, which PlatformIO adds to the include path automatically.',
      },
      guess: pick(
        'What is `#if __has_include("secrets.h")` doing here?',
        'Choosing, before compiling, which file to include',
        [
          ['Checking while the program runs whether the file is on the board', 'The check happens in the compiler, on your PC. The board never sees a file called `secrets.h`.'],
          ['Hiding the password from the compiler', 'The compiler reads whichever file is chosen. It is hidden from version control, not from the build.'],
        ],
        'It is a compile-time check. If `secrets.h` is found, it is included; otherwise `secrets.example.h` is used.',
      ),
      words: ['has-include', 'preprocessor-if'],
    },
    {
      file: 'src/main.cpp',
      lines: [12, 16],
      anchor: 'const uint32_t JOIN_TIMEOUT_MS',
      title: 'Three pieces of memory for joining',
      text: {
        beginner:
          'One fixed setting (give up after 15 seconds) and three variables the program updates: whether a join is in progress, when it started, and when it last printed a dot.',
        explorer:
          '`const` fixes the timeout. The `bool` says whether a join is in progress. The two `uint32_t` values store `millis()` readings, a number that counts milliseconds since boot. Keeping them lets the code measure "how long since" without ever pausing.',
        deep:
          'These are globals because `loop()` runs over and over and needs to remember across passes. This is a tiny state machine: idle, or joining with a start time. An unsigned 32-bit millisecond counter wraps after about 49.7 days, and `now - joinStarted` stays correct across the wrap because unsigned subtraction wraps too.',
      },
      guess: pick(
        'Why is `joining` a variable and not just a local inside a function?',
        'The program must remember it between passes of `loop()`',
        [
          ['Locals are not allowed on the ESP32', 'Locals are allowed. The point is that a local is forgotten when the function ends.'],
          ['So the compiler can make it faster', 'Speed is not the reason. It is about memory between calls.'],
        ],
        'A local disappears when its function returns. `loop()` returns every pass, so anything that must survive between passes lives outside the functions.',
      ),
      words: ['const', 'uint32-t', 'bool'],
    },
    {
      file: 'src/main.cpp',
      lines: [18, 26],
      anchor: '// True once you have',
      title: 'Spotting the placeholder',
      text: {
        beginner:
          '`credentialsAreReal()` answers one question: has the placeholder been replaced? If not, `printSetupHint()` tells you what to do. Both are used again and again below.',
        explorer:
          'You cannot compare two texts with `==` in C, because that compares where they live. `strcmp` compares the characters and returns 0 when they match, so `!= 0` means "different". The function returns a `bool`, which keeps the checks later in the file easy to read.',
        deep:
          '`WIFI_SSID` is a string literal, so `strcmp` runs at run time here, though the compiler could fold it. The hint text is long on purpose: this is the first thing a new reader sees. A real project might assert at compile time instead, but then it could not build for people who have not made `secrets.h` yet.',
      },
      guess: pick(
        'What does `strcmp(WIFI_SSID, "your-2.4GHz-network") != 0` mean?',
        'The name is different from the placeholder, so it is a real one',
        [
          ['The two texts are the same', '`strcmp` returns 0 for equal texts, and the test is `!= 0`, the opposite.'],
          ['The name is longer than the placeholder', '`strcmp` does not measure length. It reports whether the characters match.'],
        ],
        '`strcmp` gives 0 when the texts are equal. Not equal to 0 means the reader changed the name.',
      ),
      words: ['strcmp'],
    },
    {
      file: 'src/main.cpp',
      lines: [28, 47],
      anchor: '// The scan gives security',
      title: 'Turning numbers into words',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          'The scan returns security and signal as codes. These two functions turn them into words you can read: `WPA2`, `strong`, and so on.',
        explorer:
          '`wifi_auth_mode_t` is an `enum`, a list of named values. A `switch` jumps to the matching `case` and returns the label. `default` catches anything not listed. `signalWord` uses two cut-offs: -60 and -75 dBm are this lab\'s rule of thumb, not a standard.',
        deep:
          'RSSI is on a logarithmic dBm scale, so 15 dB between the two cut-offs is roughly a thirty-fold drop in power. Real link quality also depends on noise and the other side\'s transmit power, so a number alone is only a hint. Old networks may show up as `WEP`, which is broken; this chip can see it but you should not use it.',
      },
      guess: pick(
        'Why does `encryptionName` have a `default:` case?',
        'To cover any security type the list does not name',
        [
          ['Because a `switch` will not compile without one', 'It would compile. `default` is there to handle values you did not list.'],
          ['To print the password', 'The scan never gives the password, only the kind of security.'],
        ],
        'A new security type could appear that the code does not know. `default` returns `"other"` instead of nothing.',
      ),
      words: ['switch', 'rssi'],
    },
    {
      file: 'src/main.cpp',
      lines: [49, 59],
      anchor: 'const char *statusName',
      title: 'Naming the connection state',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          'The Wi-Fi driver reports its state as a code. This function turns it into a sentence so you can tell "wrong password" from "network not found".',
        explorer:
          '`WL_CONNECTED`, `WL_NO_SSID_AVAIL` and the rest are the named values of `wl_status_t`. The same `switch` pattern as the last stop. These names are what you see in `status` and in a failed join.',
        deep:
          'The driver cannot always tell the real reason for a failure, so a wrong password and a weak signal can both end up as `WL_CONNECT_FAILED`. That is why the message says "wrong password?" with a question mark.',
      },
      guess: pick(
        'A join fails and `statusName` says "network not found". What is the likeliest cause?',
        'The name is wrong, or it is a 5 GHz-only network',
        [
          ['The password is wrong', 'A wrong password usually reports `connect failed`, not "not found".'],
          ['The board ran out of memory', 'That would not give a Wi-Fi status code like this one.'],
        ],
        'The board could not find any network with that name on 2.4 GHz. Check the spelling and the band.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [61, 76],
      anchor: 'void scan()',
      title: 'Run the scan',
      text: {
        beginner:
          '`scan()` first refuses if a join is in progress. Then it asks the radio to listen on every channel and count the networks it hears. That takes two to three seconds.',
        explorer:
          '`WiFi.scanNetworks()` waits until the scan is done and returns how many networks it found. A negative result means the scan failed, and 0 means nothing was heard. Both are handled before printing anything. The program freezes for those seconds, which is fine for a command you typed.',
        deep:
          'The default scan is blocking and active: the radio sends probe requests and also listens for beacons, hopping across the channels. `scanNetworks` can also run asynchronously, which returns at once and lets you poll for the result. This lab keeps it blocking because the output is easier to follow and nothing else needs to run meanwhile.',
      },
      guess: pick(
        'What would `scanNetworks()` return if no network were in range?',
        '0',
        [
          ['-1', 'Negative numbers mean the scan itself failed or is still running.'],
          ['An empty list', 'It returns a count. The details are fetched afterwards by index.'],
        ],
        'It returns the count of networks heard. 0 means none; a negative value means failure.',
      ),
      words: ['wifi-scan'],
    },
    {
      file: 'src/main.cpp',
      lines: [77, 87],
      anchor: '  Serial.println("  #  SSID',
      title: 'Print the table',
      text: {
        beginner:
          'A header line, then one row per network: number, name, signal, channel, band, security and a signal word. Hidden networks have an empty name, so they are shown as `(hidden)`.',
        explorer:
          '`Serial.printf` fills in a template: `%d` is a whole number, `%s` is text, and `%-32s` pads a name to 32 characters so the columns line up. The loop counts from 0, and the network number is `i + 1`. The band column is the fixed text `2.4 GHz`: it is always true on this chip. `scanDelete()` frees the memory the scan used.',
        deep:
          '`WiFi.SSID(i)` returns an Arduino `String`, so `.c_str()` gives the plain C text that `%s` wants. The `(int)` casts matter: some of these calls return `int32_t`, which is `long` on this chip, and `%d` with a `long` can trigger a format warning. The last line is a reminder printed every time, because the most common support question for a Wi-Fi chip is "why can I not see my 5 GHz network".',
      },
      guess: pick(
        'Why does the band column just print the fixed text `2.4 GHz`?',
        'The radio has no other band, so every result is 2.4 GHz',
        [
          ['It reads the band from each network', 'There is nothing to read: no call gives a band, because only one exists.'],
          ['5 GHz is switched off by default', 'It is not a setting. The chip simply has no 5 GHz radio.'],
        ],
        'This ESP32 is 2.4 GHz only, so a 5 GHz network can never appear in the list at all.',
      ),
      words: ['serial-printf', 'string'],
    },
    {
      file: 'src/main.cpp',
      lines: [89, 100],
      anchor: 'void startJoin()',
      title: 'Start joining',
      text: {
        beginner:
          'If the placeholder is still there, it prints the hint and stops. Otherwise it starts joining and notes the time. It does not wait for the result: the next stop watches for that.',
        explorer:
          '`WiFi.begin(name, password)` returns immediately; the joining happens in the background. `WiFi.disconnect()` first makes sure any earlier attempt is dropped. The three assignments at the bottom set up what `updateJoin` will check: a join is running, and when it began.',
        deep:
          'There is no `println` at the end of the "Joining" line, so the progress dots from `updateJoin` extend that same line. Passing the password to `begin` copies it into the driver; by default the driver also saves it in flash so it can reconnect after a reboot. The next lab turns that off with `persistent(false)`.',
      },
      guess: pick(
        'What does `WiFi.begin(...)` do?',
        'Starts the join and returns straight away',
        [
          ['Waits until the board is connected', 'It does not wait. That is why the code checks the status later, from `loop()`.'],
          ['Prints the IP address', 'There is no IP yet at that moment. It is printed once the join succeeds.'],
        ],
        '`begin` only kicks things off. You find out how it went by asking `WiFi.status()` afterwards.',
      ),
      words: ['wifi-begin'],
    },
    {
      file: 'src/main.cpp',
      lines: [102, 119],
      anchor: '// Called every pass of loop()',
      title: 'Wait without freezing',
      text: {
        beginner:
          'Every pass, if a join is running, this checks three things in order: did we connect, did we run out of time, or is it time for another dot. Whichever is true first, wins.',
        explorer:
          '`WiFi.status() == WL_CONNECTED` means we are on the network and have an address, so we print the IP, signal and channel. `now - joinStarted >= JOIN_TIMEOUT_MS` is the same `millis()` time check as in earlier labs. Otherwise a dot is printed every half second. No `delay()` anywhere, so serial commands still work while it waits.',
        deep:
          '`localIP()` returns an `IPAddress`, and `.toString()` makes it printable; the address came from your router by DHCP. On timeout the code calls `WiFi.disconnect()` so the driver stops retrying in the background. The `%lu` format matches `unsigned long`, the type of the timeout division here, which avoids a format warning.',
      },
      guess: pick(
        'Why not just write `while (WiFi.status() != WL_CONNECTED) delay(500);`?',
        'It would freeze everything, including serial commands, until it connected',
        [
          ['It would not compile', 'It compiles, and many beginner examples use it. The cost is that nothing else can run.'],
          ['`WiFi.status()` cannot be called in a loop', 'It can. The problem is the waiting, not the call.'],
        ],
        'A blocking wait works, but the board cannot do anything else meanwhile. Checking on each pass keeps the monitor responsive.',
      ),
      words: ['wifi-status', 'ip-address', 'millis'],
    },
    {
      file: 'src/main.cpp',
      lines: [121, 134],
      anchor: 'void printStatus()',
      title: 'Status and help',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          '`status` prints where the connection stands. If connected, it also lists the network, address and signal. The board\'s own MAC address is always printed.',
        explorer:
          'The details are only printed when `s == WL_CONNECTED`, because asking for an IP while offline would print `0.0.0.0`. `WiFi.macAddress()` is the board\'s hardware address, which a router uses to recognise it. Note it for later: a DHCP reservation in W3 uses it.',
        deep:
          'The MAC is derived from the factory base address in eFuse (one-time-programmable memory). Each interface gets its own address, and Wi-Fi station mode uses the base one. `printHelp()` is a one-liner kept separate so every lab can reuse the same `help` habit.',
      },
      guess: pick(
        'Why are the network and IP only printed when connected?',
        'Offline, they have no meaningful value',
        [
          ['To save memory', 'Printing costs almost nothing. It is about not showing a useless address.'],
          ['The serial port cannot print them while offline', 'Serial works the same either way.'],
        ],
        'Without a connection there is no network name or address to show, so the code skips those lines.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [136, 156],
      anchor: 'void runCommand',
      title: 'Commands from the keyboard',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          'The same typing machinery as lab 02. It collects characters until Enter, then runs the word you typed: `scan`, `join` or `status`. Anything else prints the help line.',
        explorer:
          '`readSerial` adds each typed character to a `static String`, which keeps its value between calls. On Enter it hands the finished line to `runCommand`, which trims it, lowercases it and compares it. The chain of `if` and `else if` runs the first match.',
        deep:
          'Both `\\n` and `\\r` end a line, so it works whatever line ending the monitor sends. Empty lines are ignored by the `line.length()` check. A longer command set would use a table of names and function pointers, but three commands read better as a plain chain.',
      },
      guess: pick(
        'You press Enter on an empty line. What happens?',
        'Nothing: empty lines are ignored',
        [
          ['It prints the help line', 'Help only prints for a word that is not recognised. An empty line never reaches `runCommand`.'],
          ['It runs `scan`', 'Only the exact word `scan` does that.'],
        ],
        '`if (line.length())` skips empty lines, so only a real typed word is run as a command.',
      ),
      words: ['serial-input', 'static'],
    },
    {
      file: 'src/main.cpp',
      lines: [158, 169],
      anchor: 'void setup()',
      title: 'Station mode and a friendly start',
      text: {
        beginner:
          '`setup()` runs once. It opens the serial port, puts the radio into station mode (the board joins a network, it does not make one), waits half a second, and prints a hello with the commands.',
        explorer:
          '`WiFi.mode(WIFI_STA)` has to be set before scanning. `WIFI_AP` would make the board create its own network instead. The short `delay(500)` gives the monitor time to connect, so the first lines are not lost. Then it checks the placeholder: either it names your network, or it tells you to create `secrets.h`.',
        deep:
          'Turning on station mode starts the radio, which is when its current draw goes up: transmit bursts can reach about 240 mA, so the supply should give 500 mA or more. The board does not connect by itself here. `join` is a command so you can see each step instead of it happening before the monitor is ready.',
      },
      guess: pick(
        'What does `WiFi.mode(WIFI_STA)` choose?',
        'The board will join a network like a phone does',
        [
          ['The board will make its own network', 'That is access point mode, `WIFI_AP`.'],
          ['Wi-Fi will be turned off to save power', 'Mode off would be `WIFI_OFF`. Station mode switches the radio on.'],
        ],
        'STA means station: a device that joins a network. Your phone and laptop are stations too.',
      ),
      words: ['setup', 'wifi-mode', 'delay'],
    },
    {
      file: 'src/main.cpp',
      lines: [171, 175],
      anchor: 'void loop()',
      title: 'Two jobs, no waiting',
      text: {
        beginner:
          'Each pass: read the clock, check the keyboard, and let the join check do its work. Both are quick, so the board stays responsive all the time.',
        explorer:
          '`now` is read once at the top so every function in the pass agrees on the time. `readSerial()` handles typed commands. `updateJoin(now)` does nothing at all unless a join is running. The `scan` is the one command that blocks for a couple of seconds, by design.',
        deep:
          'The Wi-Fi driver itself runs on its own FreeRTOS task, separate from `loop()`, which is why a join can progress while `loop()` keeps spinning. That also means some changes to Wi-Fi state arrive behind your back, and the next lab handles them with events.',
      },
      guess: pick(
        'The join is running and you type `status`. What happens?',
        'It answers straight away, because `loop()` is never blocked',
        [
          ['It waits until the join finishes', 'Nothing in the join waits. Each pass of `loop()` just checks quickly.'],
          ['It is ignored', '`readSerial` runs on every pass, so the command is read at once.'],
        ],
        'Because the join is checked in small steps, `readSerial` still runs on every pass. The board answers immediately.',
      ),
      words: ['loop'],
    },
  ],
};

export default tour;
