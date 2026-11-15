import type { Tour, TourStop } from '../types';

/**
 * Guided tour of labs/w2-web-switch (platformio.ini, include/secrets.example.h, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
type Guess = NonNullable<TourStop['guess']>;
const pick = (question: string, right: string, wrongs: [string, string][], answer: string): Guess => ({
  question,
  options: [{ text: right, right: true }, ...wrongs.map(([text, why]) => ({ text, right: false, why }))],
  answer,
});

const tour: Tour = {
  lessonId: 'w2',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'Still no extra libraries',
      text: {
        beginner:
          'The same project file again. The web server is part of the Arduino toolkit for this chip, so nothing needs adding for it.',
        explorer:
          '`WebServer` and `WiFi` both ship with the Arduino-ESP32 framework. That is why a whole web server fits in one project file with no `lib_deps`. Everything, including the page itself, is inside the firmware.',
        deep:
          'There are other web server libraries for the ESP32 (async ones are popular). This lab sticks to the built-in synchronous `WebServer`: simpler to read, and plenty for a page with one button. It handles one request at a time, which is fine for a phone.',
      },
      guess: {
        question: 'A web server is a big thing. Why do you think this lab needs no extra library line?',
        answer: 'The Arduino framework for the ESP32 already includes `WebServer`. Including its header is all it takes.',
      },
    },
    {
      file: 'include/secrets.example.h',
      lines: [1, 6],
      anchor: '// Copy this file',
      title: 'The same secrets file',
      text: {
        beginner:
          'Same idea as W1: copy this to `secrets.h` and put in your own 2.4 GHz network. Each lab folder has its own copy.',
        explorer:
          '`#pragma once` stops the header being included twice. The two `#define` lines are the network name and password. They are placeholders so the project still builds before you fill them in.',
        deep:
          'Nothing in this lab sends the password anywhere except to your router when joining. The web page the board serves never contains it, and it is not printed to the serial port.',
      },
      guess: {
        question: 'What would go wrong if you edited this file instead of making a copy called `secrets.h`?',
        answer: 'This file is the template that is shared. Your real password would end up in a file that can be committed. The copy is gitignored.',
      },
      words: ['pragma-once', 'define'],
    },
    {
      file: 'src/main.cpp',
      lines: [1, 3],
      anchor: '#include <Arduino.h>',
      title: 'Three includes',
      text: {
        beginner:
          '`Arduino.h` for the basics, `WiFi.h` for the connection, and `WebServer.h` for the web server that answers browsers.',
        explorer:
          'Each `#include` pastes a header in before compiling. `WebServer.h` defines a class called `WebServer`, which you make an object from in a moment. It sits on top of the Wi-Fi connection.',
        deep:
          '`WebServer` is built on the same TCP sockets the Wi-Fi stack provides. It parses the request line and arguments for you and gives you `send()` for the reply. You get a path, a method and a few arguments, not a full web framework.',
      },
      guess: {
        question: 'Which of the three includes do you think is new compared with W1?',
        answer: '`WebServer.h`. W1 only needed `WiFi.h`. The web server is the new part.',
      },
      words: ['include'],
    },
    {
      file: 'src/main.cpp',
      lines: [5, 11],
      anchor: '// Your Wi-Fi name',
      title: 'Use secrets.h if it exists',
      text: {
        beginner:
          'If you made your own `secrets.h`, it is used. If not, the example file is used, so the project still builds.',
        explorer:
          '`__has_include` asks the compiler whether a file exists, and `#if` keeps one branch and discards the other before compiling. Both files define `WIFI_SSID` and `WIFI_PASS`, so the rest of the code does not care which one it got.',
        deep:
          'This all happens at compile time, on your PC. The board never sees a file called `secrets.h`; only the text values end up in the firmware.',
      },
      guess: pick(
        'When is the `#if __has_include("secrets.h")` choice made?',
        'While the code is compiled, on your PC',
        [
          ['Each time the board starts', 'The board has no files. The choice is made before the program exists.'],
          ['When a phone opens the page', 'It has nothing to do with the web page. It is a build-time choice.'],
        ],
        'The compiler chooses once, while building. The result is fixed in the firmware you upload.',
      ),
      words: ['has-include', 'preprocessor-if'],
    },
    {
      file: 'src/main.cpp',
      lines: [13, 18],
      anchor: 'const int PIN_LED = 2;',
      title: 'The LED, the server and three flags',
      text: {
        beginner:
          'The LED pin, a web server called `server`, and three yes/no flags: is the LED on, has the server started, and were we connected a moment ago.',
        explorer:
          '`WebServer server(80)` makes the server object. 80 is the normal web port, so a browser needs no port number after the address. `ledOn` is the one fact the page shows. `serverStarted` and `wasConnected` let the code notice changes: "we just got on" or "we just fell off".',
        deep:
          'The server is created before Wi-Fi is up, but it is not started: `server.begin()` is called later, once there is an address to listen on. Starting a listener before the network exists can fail in ways that are annoying to debug.',
      },
      guess: pick(
        'Why does the server use port 80?',
        'It is the default web port, so the browser does not need a number',
        [
          ['It is the only port the ESP32 has', 'The chip has thousands of ports. 80 is just the convention for plain HTTP.'],
          ['It is the GPIO pin number of the LED', 'Ports and GPIO pins are unrelated. The LED pin is 2.'],
        ],
        'Browsers assume port 80 for `http://`. Use another number and you would have to type it after the address.',
      ),
      words: ['const', 'bool', 'web-server'],
    },
    {
      file: 'src/main.cpp',
      lines: [20, 44],
      anchor: '// The whole web page',
      title: 'The page lives in the firmware',
      text: {
        beginner:
          'This is the whole web page: some HTML, some CSS for the look, and a small script. It is stored as text inside the program, so nothing has to be fetched from the internet.',
        explorer:
          'The `R"HTML( ... )HTML"` marks a raw string, where quotes and new lines need no escaping. The page draws one big round button. The script remembers whether the LED is on, calls `/state` when it opens and every 2 seconds, and calls `/led?on=1` or `0` when you tap. Every answer is JSON that `show` turns into the button\'s colour and label.',
        deep:
          'The page uses no framework and no CDN: plain `fetch`, plain DOM, `async/await`. That is on purpose, since the board must work with no internet. If the board is switched off, the fetch fails and the page says it lost the board and keeps retrying. The page is about 1.5 KB; flash is the limit, not speed.',
      },
      guess: pick(
        'Why is the page text inside `main.cpp` and not fetched from a website?',
        'The board must work with no internet, so everything it serves is its own',
        [
          ['The ESP32 cannot talk to websites', 'It can. This lab just chooses to stay local.'],
          ['Browsers refuse to load pages from other servers', 'Browsers load from many servers. The choice here is about being local-first.'],
        ],
        'Local-first means nothing depends on the internet. The page, its style and its script all come from the board.',
      ),
      words: ['raw-string'],
    },
    {
      file: 'src/main.cpp',
      lines: [46, 48],
      anchor: 'bool credentialsAreReal()',
      title: 'Spotting the placeholder',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'The same check as W1: is the network name still the placeholder? If so, the board will not try to join.',
        explorer:
          '`strcmp` compares two pieces of text and returns 0 when they match. `!= 0` flips it to "different", meaning you set a real name.',
        deep:
          'You cannot use `==` between two `const char *` values, because that compares memory addresses, not the characters. `strcmp` walks both texts character by character.',
      },
      guess: pick(
        'What does `strcmp` return when the two texts are equal?',
        '0',
        [
          ['1', 'It returns 0 for equal texts. Non-zero values mean they differ.'],
          ['true', 'It returns a number, not a `bool`. The `!= 0` turns it into a yes/no.'],
        ],
        '0 means equal, which is why the test reads `!= 0` for "different".',
      ),
      words: ['strcmp'],
    },
    {
      file: 'src/main.cpp',
      lines: [50, 54],
      anchor: 'void setLed',
      title: 'One place that changes the LED',
      text: {
        beginner:
          '`setLed` does three things together: remember the new state, switch the real LED, and print a line. Both the web page and the serial commands call it, so they always agree.',
        explorer:
          '`on ? HIGH : LOW` is a one-line choice: if `on` is true use `HIGH`, otherwise `LOW`. `digitalWrite` then drives the pin to about 3.3 V or 0 V. The `printf` uses the same `? :` to pick the word.',
        deep:
          'Having a single function change the output means there is one source of truth for `ledOn`. If the web handler wrote the pin directly and the serial command wrote it separately, the page could show the wrong state after a serial command.',
      },
      guess: pick(
        'Why do both the web page and the serial commands go through `setLed`?',
        'So the saved state and the real LED can never disagree',
        [
          ['Serial cannot control pins by itself', 'It can. The point is keeping the variable and the pin in step.'],
          ['It makes the LED brighter', 'Brightness is not involved. It only sets on or off.'],
        ],
        'One function, one place that updates both the variable and the pin. Everything else just calls it.',
      ),
      words: ['digital-write', 'high-low', 'ternary'],
    },
    {
      file: 'src/main.cpp',
      lines: [56, 59],
      anchor: 'void sendState',
      title: 'Reply with the state as JSON',
      text: {
        beginner:
          'This builds the little answer the page asks for: `{"on":true}` or `{"on":false}`. The header tells the browser not to keep an old copy.',
        explorer:
          '`server.send(200, type, text)` is the reply: 200 means OK, the type says it is JSON, and the text is the body. The JSON is written by hand as a string, so the quotes inside are escaped with backslashes. `Cache-Control: no-store` stops the phone showing a stale answer.',
        deep:
          'With only two possible answers, a hand-written string is simpler than a JSON library, and it costs no memory. For anything with more fields you would build the string with `String` or use ArduinoJson, which this lab avoids because it is an external library.',
      },
      guess: pick(
        'What does the status code `200` in `send(200, ...)` mean?',
        'Everything went fine',
        [
          ['The LED is on', 'It is about the request, not the LED. The LED state is in the body.'],
          ['200 bytes follow', 'It is a status code, not a size. 200 is the standard code for success.'],
        ],
        '200 means OK. 400 would say the request was wrong, and 404 that nothing lives at that address.',
      ),
      words: ['json', 'http-request'],
    },
    {
      file: 'src/main.cpp',
      lines: [61, 63],
      anchor: 'void handleRoot',
      title: 'Serve the page',
      text: {
        beginner: 'When a browser asks for the main address, this sends it the page and says "this is HTML".',
        explorer:
          'A function like this is called a handler. You never call it yourself: you register it with `server.on("/", handleRoot)` in `setup()`, and the server calls it each time a browser asks for `/`.',
        deep:
          '`send` copies the string into a `String` before sending, so there is a short-lived copy of the page in RAM for each request. At about 1.5 KB that is nothing. A much bigger page would use `send_P`, which reads straight from flash.',
      },
      guess: pick(
        'Where is `handleRoot` called from?',
        'The web server calls it, because we registered it with `server.on`',
        [
          ['From `loop()` every pass', 'It would then send the page to nobody. It runs only when a browser asks.'],
          ['From `setup()` once', '`setup` only registers it. It does not call it.'],
        ],
        'Handing a function to someone else to call later is a callback. Same idea as `addEventListener`.',
      ),
      words: ['callback'],
    },
    {
      file: 'src/main.cpp',
      lines: [65, 73],
      anchor: '// GET /led?on=1',
      title: 'The handler that does something',
      text: {
        beginner:
          'This handles `/led?on=1` and `/led?on=0`. It reads the `on` part, switches the LED, and replies with the new state. If `on` is missing it says so.',
        explorer:
          '`server.hasArg("on")` checks the request carries an `on` value. If not, it replies `400`, which means the request was wrong, and returns. Otherwise `server.arg("on") == "1"` turns the text `"1"` into a true or false for `setLed`. Then `sendState()` replies, so the page updates at once.',
        deep:
          'Changing something with a GET request is a shortcut. A browser may repeat or prefetch a GET, which is harmless for an LED but would be a poor design for something that charges money. A cleaner API would use POST. On a private lab network, GET keeps the page and `curl` examples to one line each.',
      },
      guess: pick(
        'You open `/led` in the browser with no `?on=` part. What happens?',
        'The board replies with error 400 and the LED does not change',
        [
          ['The LED turns off', 'It does not guess. Without `on`, the handler stops early.'],
          ['The page loads normally', 'That is `/`. This address is the handler that needs a value.'],
        ],
        'The `hasArg` check catches it, sends 400 with a hint, and `return` leaves the function before anything changes.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [75, 77],
      anchor: 'void handleNotFound',
      title: 'Any other address',
      levels: ['explorer', 'deep'],
      text: {
        beginner: 'If a browser asks for an address nobody handles, the board answers "not found" instead of leaving it waiting.',
        explorer:
          'Status `404` is the standard "no such page". It is registered with `server.onNotFound(...)`. Browsers also ask for `/favicon.ico` by themselves, and this is what answers that.',
        deep:
          'Without this, the library sends its own default 404. Having your own lets you add a hint or a log line later. It costs nothing, and it makes odd requests visible when you debug.',
      },
      guess: pick(
        'A browser asks for `/favicon.ico`. What does the board reply?',
        '404, not found',
        [
          ['200 with the page', 'Only `/` returns the page. Anything unknown goes to the not-found handler.'],
          ['Nothing, it ignores it', 'It answers, so the browser is not left hanging.'],
        ],
        'No handler is registered for that path, so `handleNotFound` answers 404.',
      ),
    },
    {
      file: 'src/main.cpp',
      lines: [79, 90],
      anchor: 'void printAddress',
      title: 'Tell you where to browse',
      text: {
        beginner:
          'Once connected, this prints the exact address to type on your phone. If not connected yet, it says so.',
        explorer:
          '`WiFi.localIP()` is the address your router gave the board. `.toString()` makes it printable, and `.c_str()` turns it into the plain text `%s` expects. The RSSI (signal strength) is printed too, since a weak signal is a common reason a page feels slow.',
        deep:
          'The address comes from the router\'s DHCP and can change after a reboot. W3 shows how to find the board by name instead, and how to ask the router for a fixed address.',
      },
      guess: pick(
        'The board is rebooted tomorrow. Will the address be the same?',
        'Not necessarily: the router can hand out a different one',
        [
          ['Yes, it is built into the chip', 'The chip has a fixed MAC address, but the IP address comes from the router.'],
          ['Yes, because it is saved in secrets.h', 'You never put the IP in `secrets.h`. The board asks for one each time it joins.'],
        ],
        'The IP is leased by the router and can change. That is the problem W3 solves.',
      ),
      words: ['ip-address'],
    },
    {
      file: 'src/main.cpp',
      lines: [92, 112],
      anchor: 'void runCommand',
      title: 'Serial commands as a second remote',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          'You can also control the LED from the keyboard: `on`, `off`, or `ip`. It is the same typing machinery as the earlier labs.',
        explorer:
          '`readSerial` collects characters into a `static String`, which keeps its value between calls, until Enter. Then `runCommand` trims and lowercases the line and compares it. `on` and `off` call the same `setLed` the web page uses.',
        deep:
          'Because both control paths share `setLed`, typing `on` in the monitor updates the real LED immediately, and the phone page shows it at its next 2-second check.',
      },
      guess: pick(
        'You type `on` in the monitor. How does the phone page find out?',
        'It asks `/state` every 2 seconds and sees the change',
        [
          ['The board pushes it to the phone', 'The board does not push anything in this lab. The page asks.'],
          ['It never finds out', 'It does, within about two seconds, because of the repeating check.'],
        ],
        'The page polls `/state` on a timer. That is simple, and good enough here. The radar track streams updates instead.',
      ),
      words: ['serial-input', 'static'],
    },
    {
      file: 'src/main.cpp',
      lines: [114, 135],
      anchor: '// Watch the connection',
      title: 'Start the server when we get online',
      text: {
        beginner:
          'Every pass, this compares "are we connected now" with "were we connected a moment ago". The moment we get on, it starts the web server and prints the address. If we fall off, it says so.',
        explorer:
          '`up` is computed fresh, and `wasConnected` keeps last pass\'s answer. `up && !wasConnected` is the instant of joining, so the server starts exactly once (guarded by `serverStarted`). While not connected, a "still trying" line prints every 5 seconds using the `millis()` time check, so the monitor is not flooded.',
        deep:
          'Comparing now with before is edge detection: it turns a state ("connected") into an event ("just connected"). If the router goes away, the core keeps retrying by itself, so the server needs no restart: it simply keeps listening and requests work again after reconnect. W3 adds a watchdog for the cases where retrying alone does not recover.',
      },
      guess: pick(
        'Why does the code compare `up` with `wasConnected`?',
        'To act once at the moment of joining, not on every pass',
        [
          ['To make the connection faster', 'It does not touch the connection. It only notices a change.'],
          ['Because `WiFi.status()` can only be read once', 'It can be read as often as you like.'],
        ],
        'Without the comparison, "Web server started" would print on every pass of `loop()`.',
      ),
      words: ['wifi-status', 'millis'],
    },
    {
      file: 'src/main.cpp',
      lines: [137, 156],
      anchor: 'void setup()',
      title: 'Register the pages, then join',
      text: {
        beginner:
          '`setup()` sets the LED up, tells the server which address goes to which function, and starts joining Wi-Fi. If you have not made `secrets.h`, it stops early with a hint.',
        explorer:
          '`server.on("/", handleRoot)` links an address to a handler. `onNotFound` covers everything else. Registering happens before the server starts. `WiFi.mode(WIFI_STA)` makes the board join a network (rather than make one), and `WiFi.begin` starts the join in the background without waiting.',
        deep:
          'The early `return` inside `setup()` is deliberate: with a placeholder name, nothing Wi-Fi related is started, and `loop()` only reads the keyboard. `pinMode(OUTPUT)` plus `digitalWrite(LOW)` start the LED in a known state instead of whatever the pin floated to.',
      },
      guess: pick(
        'In `setup()`, `server.on("/led", handleLed)` runs. What has happened?',
        'The server has been told which function to call for `/led`, nothing more',
        [
          ['The LED has been switched on', 'Nothing runs yet. `on` only registers the handler.'],
          ['The server is now answering browsers', 'It starts only later, at `server.begin()`, once Wi-Fi is up.'],
        ],
        'It is a registration. The handler runs only when a browser requests `/led`.',
      ),
      words: ['setup', 'pin-mode', 'wifi-begin', 'wifi-mode', 'delay'],
    },
    {
      file: 'src/main.cpp',
      lines: [158, 163],
      anchor: 'void loop()',
      title: 'Listen for browsers',
      text: {
        beginner:
          'Each pass: read the clock, check the keyboard, keep an eye on the connection, and let the web server answer anyone waiting.',
        explorer:
          '`server.handleClient()` is what actually serves requests. It must be called often. If `loop()` were blocked by a `delay`, pages would be slow or fail to load. It only runs once `serverStarted` is true.',
        deep:
          '`WebServer` is synchronous: `handleClient()` accepts a connection, reads the request, runs the handler and writes the reply, all inside that call. One slow handler delays every other request. For a button page that is fine.',
      },
      guess: pick(
        'What would happen if `loop()` contained `delay(5000)`?',
        'The page would respond slowly or time out, because `handleClient` runs so rarely',
        [
          ['Nothing, the server is separate', '`WebServer` is driven from `loop()` by `handleClient()`. If that call is delayed, so is every reply.'],
          ['The LED would blink every 5 seconds', 'Nothing blinks in this lab. The delay would just make the board unresponsive.'],
        ],
        'The server only works when `handleClient()` is called. A long wait in `loop()` starves it.',
      ),
      words: ['loop'],
    },
  ],
};

export default tour;
