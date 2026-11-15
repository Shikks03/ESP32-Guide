import type { Tour, TourStop } from '../types';

/**
 * Guided tour of labs/w3-find-by-name (platformio.ini, include/secrets.example.h, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
type Guess = NonNullable<TourStop['guess']>;
const pick = (question: string, right: string, wrongs: [string, string][], answer: string): Guess => ({
  question,
  options: [{ text: right, right: true }, ...wrongs.map(([text, why]) => ({ text, right: false, why }))],
  answer,
});

const tour: Tour = {
  lessonId: 'w3',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'Still the same project file',
      text: {
        beginner: 'Unchanged. The name feature, `ESPmDNS`, is part of the Arduino toolkit for this chip, so it needs no extra line.',
        explorer:
          '`ESPmDNS`, `WebServer` and `WiFi` all come with the framework. The lab folder is still a single project file, one source file and one secrets template.',
        deep:
          'PlatformIO scans the includes in `main.cpp` and links the matching framework libraries, which is why `#include <ESPmDNS.h>` is enough. A third-party library would need `lib_deps`.',
      },
      guess: {
        question: 'This lab adds name lookup (`bench.local`). Do you expect to need a new line in this file?',
        answer: 'No. `ESPmDNS` ships with the Arduino framework, so just including its header is enough.',
      },
    },
    {
      file: 'include/secrets.example.h',
      lines: [1, 6],
      anchor: '// Copy this file',
      title: 'The secrets template, once more',
      text: {
        beginner: 'Copy this to `secrets.h` in this lab\'s `include` folder and fill in your 2.4 GHz network.',
        explorer:
          'The same two placeholders as W1 and W2. `secrets.h` is gitignored, so only this template is ever shared. `#pragma once` stops it being included twice.',
        deep:
          'Because `persistent(false)` is used in `setup()`, the password is not written into the board\'s flash by the Wi-Fi driver either. It exists only inside the firmware image you compiled.',
      },
      guess: {
        question: 'Which of the two files holds your real password, and which is shared?',
        answer: '`secrets.h` holds the real one and stays on your PC. `secrets.example.h` is the shared template with placeholders.',
      },
      words: ['pragma-once', 'define'],
    },
    {
      file: 'src/main.cpp',
      lines: [1, 4],
      anchor: '#include <Arduino.h>',
      title: 'Four includes, one new',
      text: {
        beginner: 'The first three are familiar. `ESPmDNS.h` is new: it is what lets the board answer to a name instead of only an address.',
        explorer:
          '`ESPmDNS.h` gives you an object called `MDNS`. `MDNS.begin("bench")` is what makes `bench.local` work. `WebServer.h` is here only to serve a small status page.',
        deep:
          'mDNS answers questions sent to a well-known multicast address on the local network. The library is a small responder, not a general DNS server: it only answers for the names you give it.',
      },
      guess: {
        question: 'Which include would you guess is the one that makes `bench.local` work?',
        answer: '`ESPmDNS.h`. It provides `MDNS`, the object that answers name lookups on the local network.',
      },
      words: ['include'],
    },
    {
      file: 'src/main.cpp',
      lines: [6, 12],
      anchor: '// Your Wi-Fi name',
      title: 'Use secrets.h if it exists',
      text: {
        beginner: 'If your own `secrets.h` exists it is used. If not, the example is, so the project still builds.',
        explorer:
          '`__has_include` is checked by the compiler before the program exists. Both files define the same names, so the rest of the code is unaware of which one was chosen.',
        deep:
          'Because the check is at compile time, there is no cost on the board. The branch not taken is discarded by the preprocessor.',
      },
      guess: pick(
        'What makes the project build even without your `secrets.h`?',
        'The `#else` branch includes the placeholder file instead',
        [
          ['The compiler invents a password', 'It never invents anything. The example file supplies the placeholder text.'],
          ['The board downloads `secrets.h`', 'The board has no part in it. The choice is made on your PC.'],
        ],
        'If `secrets.h` is missing, the `#else` branch includes `secrets.example.h`, which has the same names.',
      ),
      words: ['has-include', 'preprocessor-if'],
    },
    {
      file: 'src/main.cpp',
      lines: [14, 19],
      anchor: 'const int PIN_LED = 2;',
      title: 'Settings in one place',
      text: {
        beginner:
          'The LED pin, the name the board answers to, how often to print status, and how long to stay offline before starting over. All are named so you can change them in one spot.',
        explorer:
          '`HOSTNAME` is `"bench"`, so the page lives at `bench.local`. Times are in milliseconds: report every 10 seconds, give up after 15. They are `uint32_t` because they are compared with `millis()`, which is that type.',
        deep:
          '`const char *HOSTNAME` is a pointer to text that cannot change. It is used in three places: the name on the network, the name the router shows, and the status page. Keeping one copy means they cannot drift apart.',
      },
      guess: pick(
        'Why are the time settings written in milliseconds?',
        'Because they are compared with `millis()`, which counts in milliseconds',
        [
          ['The board cannot count in seconds', 'It can, but `millis()` is what the code compares against.'],
          ['Milliseconds are more accurate than seconds', 'It is the same clock. It is about matching the unit of `millis()`.'],
        ],
        '`millis()` counts milliseconds, so the settings use the same unit and no conversion is needed.',
      ),
      words: ['const', 'uint32-t'],
    },
    {
      file: 'src/main.cpp',
      lines: [21, 30],
      anchor: '// These are written',
      title: 'Flags set from another task',
      text: {
        beginner:
          'The Wi-Fi system tells us when something happens by setting a flag. `loop()` looks at the flags and reacts. The first three variables are those flags; the rest are the board\'s own bookkeeping.',
        explorer:
          '`gotIp` and `lostLink` are set by a function the Wi-Fi driver calls, which runs on a different task from `loop()`. `volatile` tells the compiler these can change behind its back, so it must read them fresh every time. `lostReason` is the number the driver gives for why the link dropped.',
        deep:
          '`volatile` is enough for a simple flag that one side sets and the other clears. It does not make larger updates safe: anything more than a single flag or number would need a lock or a queue. The pattern here is to keep the handler to one write and let `loop()` do the rest.',
      },
      guess: pick(
        'What does `volatile` do for `gotIp`?',
        'It makes the compiler read the variable fresh each time, because another task can change it',
        [
          ['It makes the variable survive a reboot', 'Variables never survive a reboot unless saved to flash. `volatile` is about reading.'],
          ['It stops the variable ever changing', 'That is `const`. `volatile` says it may change at any moment.'],
        ],
        'Without it, the compiler may keep an old copy in a register and never notice the Wi-Fi driver changed it.',
      ),
      words: ['volatile'],
    },
    {
      file: 'src/main.cpp',
      lines: [32, 34],
      anchor: 'bool credentialsAreReal()',
      title: 'Spotting the placeholder',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'The same check as before: has the network name been changed from the placeholder?',
        explorer:
          '`strcmp` compares two pieces of text and returns 0 when they match, so `!= 0` means "different". If the name is still the placeholder, `setup()` and `loop()` skip all the Wi-Fi work.',
        deep:
          'Skipping everything keeps the board quiet and harmless when there is nothing to join. The only thing running is the keyboard reader, which still answers `help`.',
      },
      guess: pick(
        'What does `strcmp(a, b) != 0` mean?',
        'The two texts are different',
        [
          ['The two texts are the same', '`strcmp` returns 0 for the same text. `!= 0` is the opposite.'],
          ['`a` is longer than `b`', 'It does not compare length, only whether the characters match.'],
        ],
        'Equal gives 0, so not zero means different.',
      ),
      words: ['strcmp'],
    },
    {
      file: 'src/main.cpp',
      lines: [36, 44],
      anchor: '// Called by the Wi-Fi driver',
      title: 'The Wi-Fi event handler',
      text: {
        beginner:
          'The Wi-Fi system calls this function whenever something happens. It only does two things: if we got an address, raise one flag; if the link dropped, remember why and raise the other flag. The real work waits for `loop()`.',
        explorer:
          'This is a callback: you register it once with `WiFi.onEvent(...)` and the driver calls it later. `ARDUINO_EVENT_WIFI_STA_GOT_IP` means the router has given us an address, so we are properly online. `info.wifi_sta_disconnected.reason` is a code explaining a drop.',
        deep:
          'It runs on the Wi-Fi event task, so printing or doing long work in here is risky: the driver is waiting for it, and `Serial` is also used from `loop()`. Setting flags and returning is the safe pattern. Reason codes come from the ESP-IDF; for example, 8 is a normal "we left" after you call `disconnect()`.',
      },
      guess: pick(
        'Why does the handler only set flags instead of printing and reconnecting itself?',
        'It runs on the driver\'s own task, so it should be quick and leave the real work to `loop()`',
        [
          ['Handlers are not allowed to print', 'They can, but it can clash with `loop()` using `Serial` at the same time.'],
          ['Flags are faster than printing, so it looks better', 'Speed is only part of it. The main reason is not tangling up two tasks.'],
        ],
        'Keep the callback tiny, set a flag, and let `loop()` do the printing and decisions in its own time.',
      ),
      words: ['callback', 'wifi-event'],
    },
    {
      file: 'src/main.cpp',
      lines: [46, 54],
      anchor: 'void handleRoot',
      title: 'A small status page',
      text: {
        beginner:
          'This serves a very short web page. Its script asks the board for its status every two seconds and shows the name, address, signal and uptime. It is the page you open at `bench.local`.',
        explorer:
          'The page is joined from several quoted pieces, which C++ glues into one text. It has no style beyond a font and colours, because this lab is about the name, not the page. It calls `/status` and writes the result into the `<p>`. If the fetch fails it says it lost the board.',
        deep:
          'Browsers cache pages hard, so the data is fetched from a separate address (`/status`) that is sent with `no-store`, while the page itself can be cached. It is a plain request and reply: the browser asks, the board answers, with a status code and some content.',
      },
      guess: pick(
        'The page has its own address (`/`), and the live data is at `/status`. Why separate them?',
        'The page is fixed, but the numbers change, so the script keeps fetching only the numbers',
        [
          ['The board cannot send both at once', 'It can. The split is a design choice to keep updates small.'],
          ['Browsers refuse to show numbers inside a page', 'They show any text. The split is about updating without reloading.'],
        ],
        'Load the page once, then refresh only the numbers. That keeps updates tiny and the page from flickering.',
      ),
      words: ['http-request'],
    },
    {
      file: 'src/main.cpp',
      lines: [56, 61],
      anchor: 'void handleStatus',
      title: 'Status as JSON',
      text: {
        beginner: 'This builds the numbers the page asks for as a short piece of structured text: name, address, signal and seconds since boot.',
        explorer:
          'A `String` is joined with `+` piece by piece. The result looks like `{"host":"bench","ip":"192.168.1.42","rssi":-48,"uptime_s":120}`, the same JSON your JavaScript already reads with `r.json()`. `millis() / 1000` turns milliseconds into seconds.',
        deep:
          'Building JSON by hand is fine for a flat object with fixed keys. It breaks if a value can contain a quote or backslash, because nothing escapes it. The values here are an IP, a number and a hostname you chose, so none can. For anything with free text, use a library.',
      },
      guess: pick(
        'What does `millis() / 1000` give?',
        'Seconds since the board started',
        [
          ['The current time of day', '`millis()` counts from boot, not from a clock. The board does not know the time.'],
          ['The number of requests so far', 'It is a time, not a counter of requests.'],
        ],
        '`millis()` is milliseconds since boot. Divided by 1000 it is whole seconds of uptime.',
      ),
      words: ['json'],
    },
    {
      file: 'src/main.cpp',
      lines: [63, 70],
      anchor: 'void printStatus',
      title: 'The status line',
      text: {
        beginner:
          'This prints one line with the name, address, signal and uptime, plus how many times it has reconnected. If offline, it says how long it has been offline instead.',
        explorer:
          'Used by the `status` command and by the every-10-seconds report. The IP is the address the router assigned. The RSSI is signal strength: closer to 0 is stronger. `%lu` prints an unsigned long such as `millis() / 1000`.',
        deep:
          'Printing the IP regularly is deliberate. Your router hands addresses out by DHCP and may change them, so the log always shows the current one. If you want it fixed, ask your router for a DHCP reservation instead of putting a static IP in the code.',
      },
      guess: pick(
        'Why does the board print its IP in every status line?',
        'The router may give it a different address after a reconnect, so you want the current one',
        [
          ['The IP is secret and should be hidden', 'It is a private address on your own network, not a secret.'],
          ['The IP never changes, so it is just decoration', 'It can change. That is exactly why it is shown.'],
        ],
        'DHCP leases can change. The log tells you where to find the board right now.',
      ),
      words: ['ip-address', 'rssi', 'dhcp'],
    },
    {
      file: 'src/main.cpp',
      lines: [72, 77],
      anchor: '// Join (or re-join)',
      title: 'Join from scratch',
      text: {
        beginner: 'One helper that starts joining the network and notes the time. It is used at start-up and again by the watchdog.',
        explorer:
          '`WiFi.disconnect()` drops any half-finished attempt, then `WiFi.begin` starts a fresh join in the background. `offlineSince` records when we started being offline, so the watchdog can measure how long.',
        deep:
          'Calling `begin` again re-runs the whole association: scan for the network, authenticate, ask DHCP for an address. That is heavier than the core\'s own quick reconnect, which is why it is only used when waiting has failed.',
      },
      guess: pick(
        'What does `WiFi.begin(...)` do when called here?',
        'Starts a new join in the background and returns at once',
        [
          ['Waits until the board is online', 'It never waits. The result arrives later as an event.'],
          ['Only checks the password', 'It starts the real join: search for the network, sign in, get an address.'],
        ],
        'It returns immediately, and the `gotIp` flag is set by the event handler when the join succeeds.',
      ),
      words: ['wifi-begin'],
    },
    {
      file: 'src/main.cpp',
      lines: [79, 92],
      anchor: 'void printHelp',
      title: 'Commands, including drop',
      text: {
        beginner:
          'Three commands: `status` prints a line, `help` lists them, and `drop` hangs up the Wi-Fi on purpose so you can watch the board recover.',
        explorer:
          '`WiFi.disconnect()` ends the connection. Because you asked for it, the core does not try to reconnect by itself; that is why the watchdog is needed to bring it back. The command is the same trimmed, lowercased word comparison as in earlier labs.',
        deep:
          'This is a cheap way to test recovery without touching your router. The watchdog needs about 15 seconds, so after `drop` the LED blinks for that long, then the board rejoins and `reconnects` goes up by one.',
      },
      guess: pick(
        'After `drop`, what brings the board back online?',
        'The watchdog in `loop()` after 15 seconds offline',
        [
          ['The Wi-Fi core retries at once on its own', 'A disconnect you asked for is not retried by the core. That is why the watchdog exists.'],
          ['You have to press the EN button', 'No reset is needed. The code rejoins by itself.'],
        ],
        'The watchdog notices it has been offline too long and calls `startJoin()`.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [94, 105],
      anchor: 'void readSerial',
      title: 'Reading typed lines',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'The same keyboard reader as before: it collects characters until Enter, then runs the command.',
        explorer:
          '`static String line` keeps its contents between calls, so a line can be built over many passes. `Serial.available()` says whether any typed characters are waiting and `Serial.read()` takes one. Both `\\n` and `\\r` count as Enter.',
        deep:
          'None of this blocks: if nothing has been typed, the `while` loop does not run and the function returns at once. That is why the board can keep the LED pattern and web server going while it waits for you.',
      },
      guess: pick(
        'What happens if nothing has been typed?',
        'The function returns at once without waiting',
        [
          ['It waits for a key to be pressed', 'It does not wait. `available()` is 0, so the loop is skipped.'],
          ['It prints help', 'Help only prints for an unrecognised typed word.'],
        ],
        '`while (Serial.available())` is false when the buffer is empty, so nothing happens and `loop()` carries on.',
      ),
      words: ['serial-input', 'static'],
    },
    {
      file: 'src/main.cpp',
      lines: [107, 122],
      anchor: '// Runs every pass of loop()',
      title: 'Got an address: server and name',
      text: {
        beginner:
          'When the flag says we got an address, the board marks itself online, starts the web server the first time, and announces its name. Then it prints where to find it.',
        explorer:
          '`gotIp = false` clears the flag so this runs once per join. On the first join it starts the server; on later ones it counts a reconnect. `MDNS.begin(HOSTNAME)` starts answering to `bench.local`, and `addService("http", "tcp", 80)` says a web server lives on port 80. `MDNS.end()` first makes the name announce again after a reconnect.',
        deep:
          'The name only works on your local network: devices ask everyone on it by multicast ("who is bench?") and the board answers. There is no router setup, but it also means the lookup can fail where multicast is blocked, such as some guest networks, so the status line always prints the IP too.',
      },
      guess: pick(
        'Why is `MDNS.begin` called here, after we get an address, and not in `setup()`?',
        'The name has to be announced on the network, and there is no network until we have joined',
        [
          ['`setup()` cannot call library functions', 'It can. The reason is that nothing is on the network yet.'],
          ['To save memory until needed', 'The saving is negligible. It is about timing: the name needs a live connection.'],
        ],
        'Announcing a name needs an address and a network. After a reconnect, the code announces it again.',
      ),
      words: ['mdns'],
    },
    {
      file: 'src/main.cpp',
      lines: [123, 128],
      anchor: 'if (lostLink)',
      title: 'The link dropped',
      text: {
        beginner: 'When the flag says the link dropped, the board marks itself offline, starts a stopwatch for how long, and prints why.',
        explorer:
          '`if (connected) offlineSince = now;` only starts the stopwatch on the first drop, not on each repeat. The printed reason is a number from the driver. The core is already trying to reconnect behind the scenes.',
        deep:
          'Reason codes are ESP-IDF values: many mean the access point asked us to leave or stopped answering. A wrong password usually appears as an authentication failure instead. They help you tell "router rebooted" from "bad signal" when reading a log.',
      },
      guess: pick(
        'Why is `offlineSince` only set `if (connected)`?',
        'So repeated drop events do not keep restarting the stopwatch',
        [
          ['Because it can only be set once ever', 'It is set again on every new outage. The `if` stops repeats within one outage.'],
          ['To save a line of code', 'It changes behaviour: without it, the offline timer would keep resetting.'],
        ],
        'The driver may report several drops in a row. The check keeps the stopwatch at the first one.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [130, 134],
      anchor: '// Watchdog',
      title: 'The watchdog',
      text: {
        beginner: 'If the board has been offline for 15 seconds, it stops waiting and joins again from scratch.',
        explorer:
          'A watchdog is a safety net that acts when something has taken too long. `now - offlineSince >= GIVE_UP_MS` is the same wrap-safe `millis()` time check as in earlier labs. `startJoin()` resets `offlineSince`, so the next try waits another 15 seconds.',
        deep:
          'The core\'s auto-reconnect is good for short drops. It can get stuck in odd cases, for example after a long router outage or an explicit disconnect. A second, slower safety net costs a few lines and removes the "I had to reboot it" failure.',
      },
      guess: pick(
        'The router is off for a minute and comes back. What does the board do?',
        'It tries again every 15 seconds until it is back, with no reset needed',
        [
          ['It needs a reset to recover', 'That is exactly what the watchdog avoids.'],
          ['It stops trying after the first attempt', 'It keeps retrying: each time the watchdog fires, the stopwatch restarts.'],
        ],
        'The watchdog restarts the join every 15 seconds offline, so it recovers by itself.',
      ),
      words: ['millis'],
    },
    {
      file: 'src/main.cpp',
      lines: [136, 144],
      anchor: 'static uint32_t lastReport',
      title: 'Report and show the state',
      text: {
        beginner:
          'Every 10 seconds while online it prints a status line. And the LED shows the state: steady when online, fast blink when offline.',
        explorer:
          '`lastReport` is a `static`, so it keeps its value between passes. The time check keeps the printing to once per 10 seconds. The LED line uses a choice: online gives `HIGH` (on), offline gives `(now / 250) % 2`, which flips between 0 and 1 every 250 ms.',
        deep:
          '`(now / 250) % 2` is a square wave made from the clock, with no state to store. That is the same trick as the blink in lab 01. Writing the LED every pass is cheap, and it means the LED can never get out of step with `connected`.',
      },
      guess: pick(
        'What does the LED show when the board is offline?',
        'It blinks fast, flipping every 250 ms',
        [
          ['It stays off', 'Off could mean "no power". A blink says "alive but looking for the network".'],
          ['It stays on', 'Steady on is the online state.'],
        ],
        'Online is steady, offline is a fast blink, so you can read the state without the monitor.',
      ),
      words: ['digital-write', 'ternary'],
    },
    {
      file: 'src/main.cpp',
      lines: [146, 166],
      anchor: 'void setup()',
      title: 'Set everything up',
      text: {
        beginner:
          '`setup()` prints a hello, then, if you made `secrets.h`, registers the pages, hooks up the event handler, sets the Wi-Fi options and starts joining.',
        explorer:
          '`WiFi.onEvent` registers the handler from earlier. `setHostname` sets the name your router lists the board under. `setAutoReconnect(true)` asks the core to retry by itself. `persistent(false)` stops the driver saving the password into flash. Then `startJoin()` begins.',
        deep:
          'The hostname is set before `WiFi.mode` and `begin`, because the DHCP request carries it. The mDNS name is separate: both use the word `bench` here, but they are two different settings. Registering the event handler first means no early event is missed.',
      },
      guess: pick(
        'What does `WiFi.persistent(false)` do?',
        'Stops the driver saving the Wi-Fi settings into flash',
        [
          ['Makes the connection stay up forever', 'That is what auto-reconnect and the watchdog are for. `persistent` is about saving.'],
          ['Turns the Wi-Fi off', 'Nothing is switched off. It only changes whether settings are written to flash.'],
        ],
        'By default the driver stores the network and password in flash. `false` keeps them only in your firmware.',
      ),
      words: ['setup', 'pin-mode', 'wifi-mode', 'hostname', 'delay'],
    },
    {
      file: 'src/main.cpp',
      lines: [168, 174],
      anchor: 'void loop()',
      title: 'Three small jobs',
      text: {
        beginner: 'Each pass: read the clock, check the keyboard, run the Wi-Fi watcher, and let the web server answer anyone waiting.',
        explorer:
          'Nothing waits. `watchWifi` reacts to the flags and drives the LED, `readSerial` handles commands, and `handleClient` serves the status page. If no secrets are set, `loop()` returns early after reading the keyboard.',
        deep:
          'This is a cooperative loop: each piece does a little and returns. It works because no piece ever blocks. Adding something that blocks for seconds, like a `delay`, would stall the page, the LED pattern and the watchdog together.',
      },
      guess: pick(
        'Why does `loop()` return early when `credentialsAreReal()` is false?',
        'With no real network there is nothing to watch or serve',
        [
          ['To save power', 'Power is not the reason. There is simply nothing to do without a network.'],
          ['Because the keyboard stops working', 'The keyboard reader runs first, so it still works.'],
        ],
        'Without real credentials the board never joins, so the watcher and the server have no work.',
      ),
      words: ['loop'],
    },
  ],
};

export default tour;
