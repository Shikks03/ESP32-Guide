import type { Tour, TourStop } from '../types';

/**
 * Guided tour of labs/w4-ota (platformio.ini, include/secrets.example.h, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
type Guess = NonNullable<TourStop['guess']>;
const pick = (question: string, right: string, wrongs: [string, string][], answer: string): Guess => ({
  question,
  options: [{ text: right, right: true }, ...wrongs.map(([text, why]) => ({ text, right: false, why }))],
  answer,
});

const tour: Tour = {
  lessonId: 'w4',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'The USB environment',
      text: {
        beginner:
          'The usual project settings, now with a name: `esp32dev`. This is the environment you use for the first upload, over the USB cable.',
        explorer:
          'A PlatformIO project can have several environments, each starting with a `[env:name]` header. Running `pio run -e esp32dev` picks this one. With no `-e`, `pio run` builds all of them, which is how both are checked in one go.',
        deep:
          'Environments let one source tree target different boards, or the same board in different ways. Here the board is the same and only the upload method differs. The build itself is identical, so the firmware is the same file either way.',
      },
      guess: {
        question: 'This file will soon have two environments. What do you think differs between them?',
        answer: 'Only how the firmware is uploaded: through the USB cable in this one, over Wi-Fi in the next. The program is the same.',
      },
    },
    {
      file: 'platformio.ini',
      lines: [8, 16],
      anchor: '; Second environment',
      title: 'The Wi-Fi environment',
      text: {
        beginner:
          'A second environment called `ota`. It builds the same firmware but uploads it over Wi-Fi, to the board named `bench.local`, using the password from your terminal.',
        explorer:
          '`extends = env:esp32dev` copies every setting from the first environment, so only the differences are written. `upload_protocol = espota` uses the OTA uploader instead of a serial one. `upload_port` is where to send it. `--auth=${sysenv.OTA_PASSWORD}` reads the password from an environment variable you set in PowerShell, so the password is never written into this file.',
        deep:
          'Lines starting with `;` are comments. The `${sysenv.NAME}` form reads your shell\'s environment when PlatformIO starts, so a missing variable simply gives an empty password and the upload fails with an authentication error. If `bench.local` does not resolve on your machine, put the board\'s IP in `upload_port` instead.',
      },
      guess: pick(
        'Why does the password come from `${sysenv.OTA_PASSWORD}` instead of being typed into this file?',
        'This file may be shared or committed, and a password in it would leak',
        [
          ['PlatformIO cannot read plain text', 'It reads this file as plain text. The reason is to keep the password out of it.'],
          ['The password changes every upload', 'It stays the same. The point is where it is stored, not how often it changes.'],
        ],
        'The variable lives only in your terminal. Nothing in the project files holds the password.',
      ),
      words: ['env-var'],
    },
    {
      file: 'include/secrets.example.h',
      lines: [1, 3],
      anchor: '// Copy this file',
      title: 'Same secrets routine',
      text: {
        beginner: 'Copy this file to `secrets.h` and fill it in. It is private and gitignored, so your passwords stay on your PC.',
        explorer:
          'Same as the earlier labs, with one extra setting below. `#pragma once` makes sure the file is only read once, however many files include it.',
        deep:
          'A second reason to keep this out of the repo: the OTA password lets anyone who knows it replace the firmware on your board. Treat it like a Wi-Fi password, not like a harmless setting.',
      },
      guess: {
        question: 'There are now two passwords. Which would you guess matters more to keep private, and why?',
        answer: 'Both matter, but the OTA password lets someone replace the program running on your board, so guard it as carefully as the Wi-Fi one.',
      },
      words: ['pragma-once', 'define'],
    },
    {
      file: 'include/secrets.example.h',
      lines: [5, 7],
      anchor: '#define WIFI_SSID',
      title: 'Wi-Fi settings and an upload password',
      text: {
        beginner:
          'The network name and password as before, plus `OTA_PASSWORD`. That third one is a password you invent: the board checks it before accepting new firmware.',
        explorer:
          'The uploader has to send the same word. You set it twice: here, so the firmware knows it, and in your terminal as `$env:OTA_PASSWORD`, so PlatformIO can send it. `"change-me"` is a placeholder, and the firmware refuses to start OTA while it is still that.',
        deep:
          'The check is plain text compared on the board and sent as a hashed challenge during the upload, so the password itself is not sent in the clear. It is still a small shared secret on a local network, not strong security.',
      },
      guess: pick(
        'What does the firmware do while `OTA_PASSWORD` is still `"change-me"`?',
        'It refuses to start OTA and tells you to set a real password',
        [
          ['It starts OTA with that password anyway', 'Anyone who read this file could then upload. The code refuses instead.'],
          ['It starts OTA with no password', 'It never runs OTA without a real password.'],
        ],
        'A well-known placeholder is as good as no password, so OTA stays off until you change it.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [1, 3],
      anchor: '#include <Arduino.h>',
      title: 'Wi-Fi and ArduinoOTA',
      text: {
        beginner: '`Arduino.h` for the basics, `WiFi.h` for the connection, and `ArduinoOTA.h` for receiving new firmware.',
        explorer:
          '`ArduinoOTA.h` gives you an object called `ArduinoOTA`. Unlike W3, there is no `ESPmDNS.h` here and no web server: the OTA library announces the board\'s name on the network by itself.',
        deep:
          'ArduinoOTA starts mDNS internally using the hostname you give it, which is how `bench.local` exists with no separate setup. It listens on its own port for the upload tool. It is part of the Arduino-ESP32 framework, so there is no `lib_deps`.',
      },
      guess: {
        question: 'W3 included `ESPmDNS.h` to get `bench.local`. This lab does not. How do you think the name still works?',
        answer: '`ArduinoOTA` starts mDNS on its own with the hostname you set, so the name is announced without extra code.',
      },
      words: ['include'],
    },
    {
      file: 'src/main.cpp',
      lines: [5, 11],
      anchor: '// Your Wi-Fi name',
      title: 'Use secrets.h if it exists',
      text: {
        beginner: 'If you made your own `secrets.h` it is used. If not, the example is, so the project still builds.',
        explorer:
          '`__has_include` is answered by the compiler on your PC. `#if` keeps one branch and discards the other. Both files define the same three names.',
        deep:
          'This is why both `pio run` environments build on a fresh copy of the project with nothing set up, which matters for a repo that other people clone.',
      },
      guess: pick(
        'You have not made `secrets.h` yet. What does the build do?',
        'It uses `secrets.example.h` and succeeds',
        [
          ['It fails with "file not found"', 'The `#else` branch is exactly there to prevent that.'],
          ['It asks you for the password', 'A build never asks questions. The placeholder file is used.'],
        ],
        'The compiler falls back to the example file. The firmware then prints a hint when it runs.',
      ),
      words: ['has-include', 'preprocessor-if'],
    },
    {
      file: 'src/main.cpp',
      lines: [13, 21],
      anchor: 'const int PIN_LED = 2;',
      title: 'The things you will change',
      text: {
        beginner:
          'The LED pin, the name `bench`, how fast the LED blinks, and a version label. `BLINK_MS` and `FW_VERSION` are the two you edit to prove the Wi-Fi upload worked.',
        explorer:
          '`BLINK_MS = 1000` means the LED flips every second. Change it to 200 and upload over Wi-Fi: a faster blink is proof the new firmware is running. `FW_VERSION` shows up in the monitor so you can check without looking at the LED. The four `bool` flags remember what is going on: blinking, mid-upload, OTA running, and connected before.',
        deep:
          'Two visible changes (LED speed and a printed version) make the update easy to verify from across a room. Setting the version in code, not guessing, is a habit worth keeping: a board that says "v2" can be trusted to be running v2.',
      },
      guess: pick(
        'You change `BLINK_MS` to 200 and upload over Wi-Fi. How do you know it worked?',
        'The LED blinks faster, and `status` shows the new version',
        [
          ['The cable stops being needed', 'The cable may still give power. What proves it worked is the changed behaviour.'],
          ['Nothing changes until you press reset', 'The board restarts itself after an OTA update.'],
        ],
        'The board restarts into the new firmware by itself. The faster blink and the version label are the proof.',
      ),
      words: ['const', 'uint32-t', 'bool'],
    },
    {
      file: 'src/main.cpp',
      lines: [23, 29],
      anchor: 'bool credentialsAreReal()',
      title: 'Two placeholder checks',
      text: {
        beginner:
          'One check asks "is the Wi-Fi name still the placeholder?" and another asks "is the OTA password still `change-me`?". If either is, that part stays off.',
        explorer:
          '`strcmp` compares two pieces of text and returns 0 when they match, so `!= 0` means "different, so it is real". OTA depends on both: you need a network and a real password.',
        deep:
          'Refusing to start with the default password is a small guard against the commonest mistake with OTA: leaving it open to anyone who can guess the placeholder. The check costs two lines and runs once.',
      },
      guess: pick(
        'Why check the OTA password at all? The upload tool will reject a wrong one.',
        'A well-known placeholder would let anyone on your network upload firmware',
        [
          ['The compiler needs it to be different', 'It builds either way. The check is a safety guard at run time.'],
          ['To make the upload faster', 'It has no effect on speed.'],
        ],
        'If the password is the published placeholder, the lock is useless. So OTA only starts with your own.',
      ),
      words: ['strcmp'],
    },
    {
      file: 'src/main.cpp',
      lines: [31, 33],
      anchor: 'void setupOta()',
      title: 'Name and password',
      text: {
        beginner:
          'Two settings for the OTA listener: the board answers to `bench`, and an upload is only accepted if it brings the right password.',
        explorer:
          '`OTA` means over-the-air: new firmware arrives by Wi-Fi instead of USB. `setHostname` gives the board its name on the network, which is why `bench.local` works. `setPassword` is the shared secret the uploader must send.',
        deep:
          'The board is not downloading anything. It sits and listens, the uploader connects to it, authenticates, and streams the new program. That is why the first flash has to be over USB: there is no listener until firmware with this code is already running.',
      },
      guess: pick(
        'Why must the very first upload still go over USB?',
        'No firmware is listening for Wi-Fi uploads until one with this code is on the board',
        [
          ['Wi-Fi uploads only work on Mondays', 'Nothing like that. It is simply that nothing is listening yet.'],
          ['The USB cable is needed for the password', 'The password is checked over Wi-Fi. USB is only needed to get the listener there.'],
        ],
        'OTA needs firmware that already contains the OTA code. USB puts it there the first time.',
      ),
      words: ['ota', 'arduino-ota', 'hostname'],
    },
    {
      file: 'src/main.cpp',
      lines: [35, 39],
      anchor: '  ArduinoOTA.onStart',
      title: 'When an upload starts',
      text: {
        beginner:
          'This runs when an upload begins. It marks the board as busy, switches the LED off so the blink does not fight the upload, and prints a "do not unplug" line.',
        explorer:
          'The code in `[]() { ... }` is a small function with no name. You hand it to `onStart` and the library calls it when an upload begins. This is a callback. It sets `otaBusy`, which the last line of `loop()` checks so the LED stays off during the upload.',
        deep:
          'Unlike the Wi-Fi event handler in W3, OTA callbacks run in the context of `ArduinoOTA.handle()`, so they are called from `loop()` and printing here is safe. The upload then happens inside that same `handle()` call, which is why `loop()` is blocked until it finishes.',
      },
      guess: pick(
        'The code between `[]() {` and `}` has no name. How does it run?',
        'The library calls it when an upload starts, because we handed it over',
        [
          ['It runs once at power-on', 'It is not called at start-up. It waits for an upload.'],
          ['It runs on every pass of `loop()`', 'It is only called by the library when an upload begins.'],
        ],
        'You give the library a function now, and it calls it later at the right moment. That is a callback.',
      ),
      words: ['lambda', 'callback'],
    },
    {
      file: 'src/main.cpp',
      lines: [40, 47],
      anchor: '  ArduinoOTA.onProgress',
      title: 'Progress in tens',
      text: {
        beginner: 'While data arrives, this prints how far along it is, once for every 10 percent, so the monitor does not flood.',
        explorer:
          'The library gives you `done` and `total` bytes. `done * 10 / total` is a whole number from 0 to 10. A line only prints when that number changes from the last one, and `static` keeps `lastTen` between calls. `%u%%` prints the number and a real `%` sign.',
        deep:
          'Starting `lastTen` at 99 guarantees the first call prints, because 0 is not equal to 99. The integer division rounds down, so 100% only prints when the last bytes arrive. Printing every chunk would slow the upload down.',
      },
      guess: pick(
        'Why does the code only print when `ten` changes?',
        'Otherwise it would print for every small chunk and flood the monitor',
        [
          ['Serial cannot print numbers twice', 'It can. It is about not printing hundreds of lines.'],
          ['To speed up the CPU', 'It is about output volume, not CPU speed.'],
        ],
        'There are many small chunks. Printing at each 10 percent keeps it readable.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [48, 50],
      anchor: '  ArduinoOTA.onEnd',
      title: 'When it finishes',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'When the last byte has arrived, it prints a message. The board then restarts into the new program by itself.',
        explorer:
          'This is the third callback. The message appears just before the restart, so it is the last line you see from the old firmware. The restart is done by the library.',
        deep:
          'The new firmware is written to a spare slot in flash, and only when it is complete does the board switch to it. If power is cut mid-upload, the old program still boots. That is the point of keeping two slots.',
      },
      guess: pick(
        'Power is cut halfway through an upload. What is the likely result?',
        'The old firmware still starts, because the new one went into a spare slot',
        [
          ['The board is permanently broken', 'The two-slot design exists to avoid this.'],
          ['The half-written firmware runs', 'It is only used once complete and checked.'],
        ],
        'Updates go into the other slot and only become active at the end, so an interrupted upload leaves the old one working.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [51, 62],
      anchor: '  ArduinoOTA.onError',
      title: 'Errors, then begin()',
      text: {
        beginner:
          'If an upload fails, this prints why: wrong password, could not connect, and so on. The last line, `ArduinoOTA.begin()`, switches the listener on.',
        explorer:
          'The error arrives as a code, and the chain of `if` and `else if` turns it into words. A wrong upload password shows up as `wrong password`. `begin()` is what starts listening; until it runs, no upload is accepted.',
        deep:
          '`const char *why = "unknown"` is the default, so an error the code does not name still prints something. `begin()` also starts the mDNS responder that makes `bench.local` work. It must come after the name and password are set.',
      },
      guess: pick(
        'You upload with the wrong `OTA_PASSWORD`. What does the monitor show?',
        '`OTA error: wrong password`',
        [
          ['Nothing at all', 'The error callback prints it, so you do see something.'],
          ['The new firmware starts anyway', 'The board rejects the upload before writing anything.'],
        ],
        'The authentication fails, `onError` runs, and `otaBusy` is cleared so the LED goes back to blinking.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [64, 71],
      anchor: 'void printStatus()',
      title: 'Which firmware is running?',
      levels: ['explorer', 'deep'],
      text: {
        beginner: '`status` prints the version, the blink speed, and where the board is on the network.',
        explorer:
          'The version line answers "is my upload live?". If connected it also prints the name, IP address and signal strength. `%lu` prints an unsigned long such as `BLINK_MS`.',
        deep:
          'Printing the version is a cheap sanity check: after an OTA update, a version string is the only way to be sure the new image booted, rather than the old one still running.',
      },
      guess: pick(
        'After an OTA upload, what is the surest way to know the new firmware is running?',
        'Ask the board for its version with `status`',
        [
          ['Check that the upload tool said done', 'It only says the file was sent. The version proves it booted.'],
          ['Look at the cable', 'The cable tells you nothing about what is running.'],
        ],
        'The version string comes from the running program itself, so it cannot be out of date.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [73, 85],
      anchor: 'void printHelp',
      title: 'LED commands, still available',
      text: {
        beginner: '`blink`, `on` and `off` control the LED from the keyboard, so the board stays useful while it waits for new firmware.',
        explorer:
          '`blinking` is the flag that decides whether the LED blinks or holds. `on` and `off` turn it into a fixed state. Each command is a short one-line handler.',
        deep:
          'This keeps the "LED plus name" idea from the earlier labs without a web server, which keeps the image small and leaves more flash for the second OTA slot.',
      },
      guess: pick(
        'You type `on`. What happens to the blinking?',
        'It stops, and the LED stays on',
        [
          ['It keeps blinking', '`on` sets `blinking = false`, so the loop stops toggling.'],
          ['The LED turns off', '`off` does that. `on` holds the LED lit.'],
        ],
        'The command clears `blinking` and drives the pin high. `blink` turns blinking on again.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [87, 98],
      anchor: 'void readSerial',
      title: 'Reading typed lines',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'The same keyboard reader as before: it collects characters until Enter, then runs the command.',
        explorer:
          '`static String line` keeps its value between calls. `Serial.available()` checks whether anything was typed and `Serial.read()` takes one character. Either `\\n` or `\\r` ends the line.',
        deep:
          'Because nothing here waits, `ArduinoOTA.handle()` in `loop()` still gets called often, which matters: a `loop()` that is blocked cannot notice an upload.',
      },
      guess: pick(
        'Why must the keyboard reader never wait for a key?',
        'Because `loop()` has to keep calling `ArduinoOTA.handle()` to notice uploads',
        [
          ['Because Serial is slow', 'Serial is fine. The problem is blocking the loop.'],
          ['Because OTA uses the keyboard', 'OTA never uses the keyboard. It listens on the network.'],
        ],
        'If `loop()` stopped to wait for a key, uploads would be missed until you pressed one.',
      ),
      words: ['serial-input', 'static'],
    },
    {
      file: 'src/main.cpp',
      lines: [100, 116],
      anchor: '// Start OTA the first time',
      title: 'Start OTA once we are online',
      text: {
        beginner:
          'When the board first gets on the network, it prints its address and starts OTA, but only if you set your own OTA password. Otherwise it says why OTA stays off.',
        explorer:
          '`up && !wasConnected` is the instant of joining. `!otaStarted` makes sure `setupOta()` only runs once, even after a reconnect. If the password is still the placeholder, a warning prints instead. Losing the connection just prints a line: the core reconnects by itself.',
        deep:
          'OTA must start after Wi-Fi is up, because it opens a network listener and announces an mDNS name. After a drop and reconnect it keeps working without a restart. Everything runs from `loop()`, with no blocking waits.',
      },
      guess: pick(
        'The Wi-Fi drops and comes back. Does `setupOta()` run again?',
        'No, because `otaStarted` is already true',
        [
          ['Yes, every time the Wi-Fi comes back', 'The `!otaStarted` check stops a second setup.'],
          ['Yes, it must or OTA stops working', 'OTA keeps working across a reconnect without being set up again.'],
        ],
        'It is set up once. The flag `otaStarted` remembers that.',
      ),
      words: ['wifi-status'],
    },
    {
      file: 'src/main.cpp',
      lines: [118, 132],
      anchor: 'void setup()',
      title: 'Start joining',
      text: {
        beginner:
          'Open the serial port, set the LED pin, print a hello with the firmware version, and start joining. If `secrets.h` is missing it stops early with a hint.',
        explorer:
          '`WiFi.mode(WIFI_STA)` makes the board join a network, and `WiFi.begin` starts that in the background. The firmware version is printed first thing, so every monitor session starts with proof of what is running. The early `return` leaves the board quiet when there is nothing to join.',
        deep:
          'With no real network, nothing Wi-Fi-related starts and `loop()` also returns early, so this lab is safe to flash before you have made `secrets.h`. The OTA listener only starts later, from `watchWifi`, after an address arrives.',
      },
      guess: pick(
        'Why is the firmware version the first thing printed?',
        'It tells you at once which build is running after an update',
        [
          ['The version makes Wi-Fi connect faster', 'It has no effect on Wi-Fi. It is information for you.'],
          ['The upload tool needs it', 'The tool does not read it. It is for you to read.'],
        ],
        'After an OTA update, the first line of the log confirms the new firmware booted.',
      ),
      words: ['setup', 'pin-mode', 'wifi-mode', 'wifi-begin', 'delay'],
    },
    {
      file: 'src/main.cpp',
      lines: [134, 141],
      anchor: 'void loop()',
      title: 'Keep listening',
      text: {
        beginner:
          'Each pass: read the clock, check the keyboard, watch the Wi-Fi, listen for an upload, and blink the LED if nothing is being uploaded.',
        explorer:
          '`ArduinoOTA.handle()` is what actually notices an incoming upload, so it must be called often and only after setup. The last line is the blink: `(now / BLINK_MS) % 2` flips between 0 and 1 every `BLINK_MS` milliseconds, and `digitalWrite` drives the pin with it. It is skipped while `otaBusy` is true.',
        deep:
          'Once an upload starts, `handle()` runs the whole transfer before returning, so `loop()` is blocked for its duration. That is expected, and it is why `otaBusy` only matters for the LED outside that time. If you ever add a long `delay()` to this loop, uploads will start failing or time out.',
      },
      guess: pick(
        'What would break OTA if you added it to `loop()`?',
        'A long `delay()`, because `handle()` would be called too rarely to notice an upload',
        [
          ['Another `Serial.println`', 'Short prints are fine. Only long waits starve `handle()`.'],
          ['Nothing can break OTA once it has started', 'A blocked loop is the commonest way to lose it.'],
        ],
        '`handle()` has to run frequently. A long wait means uploads fail or time out.',
      ),
      words: ['loop', 'millis', 'digital-write'],
    },
  ],
};

export default tour;
