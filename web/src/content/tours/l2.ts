import type { Tour } from '../types';

/**
 * Guided tour of labs/l2-switch (platformio.ini, include/secrets.example.h, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
const tour: Tour = {
  lessonId: 'l2',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'The same settings as lab 02',
      text: {
        beginner:
          "Nothing new here. It is the same project file as lab 02, including `monitor_echo = yes` so you can see what you type. Wi-Fi and the web-request tool both come with the ESP32 toolkit, so there is no extra line asking for a library.",
        explorer:
          "A project that makes web requests usually needs a library; here `WiFi.h` and `HTTPClient.h` are already part of the Arduino-ESP32 core that PlatformIO downloads for `framework = arduino`. That is why there is no `lib_deps` line. The rule for this guide is the same: no external libraries, nothing from the internet at run time.",
        deep:
          "PlatformIO's espressif32 platform v8.0.0 pins Arduino-ESP32 core 3.3.12, which bundles `WiFi`, `HTTPClient`, `WebServer`, `ESPmDNS` and `ArduinoOTA`. Linking Wi-Fi and the HTTP client adds about a megabyte to the program, which is why the flash use in the build report jumps compared with lab 02. It still fits the default partition layout, with room left.",
      },
      guess: {
        question: 'This project makes web requests. Why does `platformio.ini` not list any library?',
        answer:
          "Because `WiFi` and `HTTPClient` ship inside the Arduino core that `framework = arduino` already pulls in. Nothing extra needs downloading.",
      },
    },
    {
      file: 'include/secrets.example.h',
      lines: [1, 6],
      anchor: '#pragma once',
      title: 'A template for your private values',
      text: {
        beginner:
          "This file holds three settings: your Wi-Fi name, your Wi-Fi password and the bulb's address. It contains placeholders only. You copy it to `secrets.h`, fill in your real values there, and `secrets.h` is never committed.",
        explorer:
          "`#define WIFI_SSID \"...\"` makes the name `WIFI_SSID` stand for that text everywhere in the program. Keeping the real values in a separate file means the code on GitHub never contains your password. `#pragma once` stops the file being pasted in twice if two files include it. The network must be 2.4 GHz: the ESP32's radio cannot see 5 GHz.",
        deep:
          "The real `secrets.h` is listed in `.gitignore`, and the example is the only version that gets committed. Note that the values are baked into the compiled program: anyone who reads the flash of your board can read the Wi-Fi password, so this is a hobby-grade scheme, fine for a bench, not for a product. `BULB_IP` should be fixed: reserve it for the bulb in your router (a DHCP reservation) so it does not change after a reboot.",
      },
      guess: {
        question: 'Why are the Wi-Fi name and password in a separate file instead of in `main.cpp`?',
        answer:
          "So the real values can stay out of version control. `main.cpp` and the example file are safe to commit; your own `secrets.h` is not.",
      },
      words: ['pragma-once', 'define'],
    },
    {
      file: 'src/main.cpp',
      lines: [1, 3],
      anchor: '#include <Arduino.h>',
      title: 'Three toolkits',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Three lines pull in three toolkits: the basic Arduino one, the Wi-Fi one, and the one that sends web requests.",
        explorer:
          "`Arduino.h` gives you `Serial`, `delay` and `millis`. `WiFi.h` gives you the `WiFi` object for joining a network. `HTTPClient.h` gives you the `HTTPClient` type that sends the request to the bulb. The angle brackets mean they come from the toolkit, not from your own folder.",
        deep:
          "`<...>` makes the compiler search the toolkit's include folders, while `\"...\"` (used next for the secrets) searches your project first. `HTTPClient` sits on top of `WiFiClient`, which sits on the LwIP network stack. You never touch those layers directly, which is the point.",
      },
      words: ['include'],
    },
    {
      file: 'src/main.cpp',
      lines: [5, 10],
      anchor: '// Real values live',
      title: 'Use secrets.h if it exists',
      text: {
        beginner:
          "If you made your own `secrets.h`, the program uses it. If not, it uses the example file, so the project still builds on a fresh copy. The example only has placeholders, so the board will tell you to make the real file.",
        explorer:
          "`__has_include(\"secrets.h\")` is a question for the compiler: does that file exist? The `#if` keeps one branch and throws the other away before compiling. That makes the build work with or without your real file, and the code never needs a password to compile. At run time the program checks whether the name is still the placeholder and says so.",
        deep:
          "Because `include/` is on PlatformIO's include path automatically, both names resolve with no build flags. The alternative, a build flag like `-DWIFI_SSID=...` from an environment variable, keeps secrets out of files completely but is harder to follow for a beginner. A build that quietly succeeded with an example file is exactly why the code checks at run time and prints a clear message, instead of failing in a confusing way later.",
      },
      guess: {
        question: 'You have not created `secrets.h` yet. What does this code do?',
        options: [
          { text: 'Falls back to `secrets.example.h` and still builds', right: true },
          {
            text: 'Stops the build with an error',
            right: false,
            why: '`__has_include` is there precisely so a missing file is not an error.',
          },
          {
            text: 'Downloads a secrets file from the internet',
            right: false,
            why: 'Nothing here touches the internet. The compiler only checks whether a file exists on your disk.',
          },
        ],
        answer: "The `#else` branch includes the example, which holds placeholders. It builds fine, and at run time the program tells you to create the real file.",
      },
      words: ['has-include', 'preprocessor-if'],
    },
    {
      file: 'src/main.cpp',
      lines: [12, 15],
      anchor: 'const char *PLACEHOLDER_SSID',
      title: 'The placeholder and three time limits',
      text: {
        beginner:
          "A named placeholder text, and three time limits in milliseconds: how long to try joining Wi-Fi, how long to wait for the bulb to pick up, and how long to wait for its reply. They stop the program waiting forever.",
        explorer:
          "`PLACEHOLDER_SSID` is the exact text used in the example file, so the code can tell whether you ever filled in the real one. The three limits are **timeouts**: 15 seconds to join Wi-Fi, 2 seconds to reach the bulb, 3 seconds for it to answer. `uint32_t` and `uint16_t` are whole numbers of a fixed size (32 and 16 bits). The smaller type is plenty for 2000 and 3000.",
        deep:
          "`setConnectTimeout` and `setTimeout` on `HTTPClient` take milliseconds. The two are different on purpose: connecting to a device that is on the network answers almost at once, so 2 seconds is generous, while an answer may involve the bulb doing work. A bulb that is unplugged simply never answers, and without these limits the ESP32 would wait much longer. The limits are not a guarantee: while they wait, `loop()` is blocked and the serial input is not read.",
      },
      guess: {
        question: 'What is the 2000 in `CONNECT_TIMEOUT_MS` for?',
        options: [
          { text: 'How long to wait for the bulb to accept a connection, in milliseconds', right: true },
          {
            text: 'The number of bytes the reply may contain',
            right: false,
            why: 'It is a time, not a size. The name ends in MS for milliseconds.',
          },
          {
            text: 'The port number the bulb listens on',
            right: false,
            why: 'The bulb uses the normal web port. 2000 is only a number of milliseconds.',
          },
        ],
        answer: "2000 ms is 2 seconds. If the bulb has not accepted the connection by then, the call fails instead of hanging.",
      },
      words: ['const', 'c-string', 'uint32-t', 'uint16-t', 'timeout'],
    },
    {
      file: 'src/main.cpp',
      lines: [17, 19],
      anchor: 'bool haveCredentials()',
      title: 'Are the credentials still placeholders?',
      text: {
        beginner:
          "A tiny function that answers yes or no: have you replaced the placeholder Wi-Fi name with a real one? It compares the two texts.",
        explorer:
          "`bool` means the function answers true or false. `strcmp` compares two pieces of plain text letter by letter and returns 0 when they are equal, so `!= 0` means \"different\", which means you filled in your own. Plain quoted text cannot be compared with `==` in C++, because that would compare where the text sits in memory.",
        deep:
          "`WIFI_SSID` is a macro that expands to a string literal, and `PLACEHOLDER_SSID` is a `const char *` to another literal. Comparing the two with `==` would compare two addresses and might even give true by accident if the compiler merges identical literals. `strcmp` reads the characters. This only checks the Wi-Fi name; it cannot tell that `BULB_IP` is still the example address.",
      },
      guess: {
        question: 'What does `strcmp(a, b)` return when the two texts are the same?',
        options: [
          { text: '0', right: true },
          {
            text: '1',
            right: false,
            why: 'In C, 1 would usually mean true, but `strcmp` is the odd one out: it returns 0 for equal.',
          },
          {
            text: 'true',
            right: false,
            why: '`strcmp` returns a number (negative, zero or positive), not a `bool`.',
          },
        ],
        answer: "0 means \"no difference\". That is why the code writes `!= 0` to mean \"they differ\".",
      },
      words: ['bool', 'function', 'return', 'strcmp'],
    },
    {
      file: 'src/main.cpp',
      lines: [21, 26],
      anchor: 'bool joinWifi() {',
      title: 'Stop early with a clear message',
      text: {
        beginner:
          "The first job of `joinWifi` is to check the placeholder. If you have not made `secrets.h`, it prints exactly what to do and gives up, instead of trying to join a network called \"your-2.4GHz-network\".",
        explorer:
          "`if (!haveCredentials())` reads \"if we do NOT have credentials\". Inside, two `println` lines explain the fix and `return false` leaves the function straight away. That pattern, check the bad case first and leave early, is called a guard. Everything below only runs when the check passed.",
        deep:
          "Returning `false` makes every caller (`callBulb`, `setup`) skip the network work, so with no secrets the board prints the same message on every command instead of crashing or blocking. The first `Serial.println` ends with a comma on purpose: the message is split over two lines so it fits an 80-column monitor.",
      },
      guess: {
        question: 'Why does the function `return false` right after printing the message?',
        options: [
          { text: 'There is no point trying to join a network that does not exist', right: true },
          {
            text: 'To restart the board',
            right: false,
            why: '`return` only leaves this function. Nothing restarts.',
          },
          {
            text: 'Because `println` always fails',
            right: false,
            why: '`println` works fine. The `false` is the function telling its caller that joining did not happen.',
          },
        ],
        answer: "Without real credentials the join cannot work, so the function reports failure straight away.",
      },
      words: ['if'],
    },
    {
      file: 'src/main.cpp',
      lines: [27, 32],
      anchor: 'if (WiFi.status() == WL_CONNECTED) return true;',
      title: 'Join, and wait with a deadline',
      text: {
        beginner:
          "If the board is already on the network, it returns at once. Otherwise it starts joining and checks every quarter of a second whether it worked, giving up after 15 seconds.",
        explorer:
          "`WiFi.mode(WIFI_STA)` makes the board a client, like a phone. `WiFi.begin(ssid, pass)` starts joining and returns immediately, so the code then loops: `while` it is not yet connected **and** less than 15 seconds have passed, wait 250 ms and look again. `millis() - start` is how long we have been waiting. Calling this at the top of every request means a dropped Wi-Fi connection gets repaired the next time you type a command.",
        deep:
          "`WiFi.begin` is asynchronous: the join happens in the Wi-Fi task while this one polls. The `delay(250)` here is blocking, which is acceptable because nothing else needs to run while we wait for the join and the whole wait is capped by the deadline. The unsigned subtraction `millis() - start` stays correct across the 49.7-day wrap. A real network has more failure states than connected or not; for this lab, success or timeout is enough.",
      },
      guess: {
        question: 'The loop stops waiting under two conditions. Which pair?',
        options: [
          { text: 'The board connected, or 15 seconds passed', right: true },
          {
            text: 'The bulb answered, or you typed a command',
            right: false,
            why: 'The bulb is not involved yet, and typing does not interrupt this loop. It is only about joining the network.',
          },
          {
            text: 'Only when the board connected',
            right: false,
            why: 'There is a second condition, `millis() - start < WIFI_TIMEOUT_MS`. Without it a wrong password would wait forever.',
          },
        ],
        answer: "`while (not connected && under 15 s)` ends as soon as either part becomes false: connected, or out of time.",
      },
      words: ['wifi-join', 'while', 'millis', 'delay'],
    },
    {
      file: 'src/main.cpp',
      lines: [33, 39],
      anchor: 'if (WiFi.status() != WL_CONNECTED) {',
      title: 'Report what happened',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "If the board is still not connected after the wait, it prints a reason and gives up. If it is connected, it prints its own address and the signal strength.",
        explorer:
          "A wrong password and a 5 GHz-only network look the same from here: the join simply never finishes. The error text names both. On success it prints the IP the router gave the board and `WiFi.RSSI()`, the signal strength in dBm (closer to 0 is stronger; around -60 is good, below -80 is poor). `.c_str()` turns an Arduino `String` into plain text that `printf` can use with `%s`.",
        deep:
          "`localIP().toString()` makes a temporary `String`, and `c_str()` points into it, which is safe here only because both live until the end of the statement. The RSSI value is a negative number of decibel-milliwatts, a logarithmic scale where every 10 dB is a tenfold change in power. Once the board has joined, WiFi stays up on its own and reconnects are handled by the stack, so most calls to `joinWifi()` return at the very first `if`.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [41, 46],
      anchor: '// One call to the bulb',
      title: 'Build the address of the request',
      text: {
        beginner:
          "This function sends one request to the bulb. It starts by putting the address together from pieces: the bulb's IP, the method name, and the settings after a question mark. Then it prints the address so you can see exactly what was sent.",
        explorer:
          "`callBulb(method, query)` is the one place every command goes through. The URL ends up looking like `http://192.168.1.50/rpc/RGBCCT.Set?id=0&on=true`, an **RPC** call. `String(\"http://\") + BULB_IP + ...` joins text; the first piece has to be a `String`, because two bare quoted pieces cannot be added. The `&` after a type, as in `const String &method`, means the string is passed without copying it, and `const` promises not to change it. The question mark and settings are added only if there are any.",
        deep:
          "Passing by `const &` avoids copying the string into the function, a small saving here but a good habit. `query` is a **query string**: `name=value` pairs joined by `&`. Nothing here encodes characters, because these four commands only use letters, digits and `=`/`&`; lab L3 adds the encoding it needs for colours. Sending control over plain HTTP to a device on your own LAN is the point of local-first, but anyone on that network can send the same request, which is why the bulb's optional password exists.",
      },
      guess: {
        question: 'For `callBulb("RGBCCT.Toggle", "id=0")`, what is the full URL?',
        options: [
          { text: '`http://<BULB_IP>/rpc/RGBCCT.Toggle?id=0`', right: true },
          {
            text: '`http://<BULB_IP>/RGBCCT.Toggle/id=0`',
            right: false,
            why: 'The code adds `/rpc/` before the method name and a `?` before the settings.',
          },
          {
            text: '`RGBCCT.Toggle?id=0`',
            right: false,
            why: 'That is only the end. The code puts `http://`, the IP and `/rpc/` in front.',
          },
        ],
        answer: "`http://` + the bulb's IP + `/rpc/` + the method, then `?` and the settings because the query text is not empty.",
      },
      words: ['string-concat', 'reference-param', 'query-string', 'rpc'],
    },
    {
      file: 'src/main.cpp',
      lines: [48, 54],
      anchor: 'HTTPClient http;',
      title: 'Open the request with time limits',
      text: {
        beginner:
          "This creates the web-request tool, tells it how long to wait, and points it at the address. If the address is not valid it stops here.",
        explorer:
          "`HTTPClient http;` makes one request tool (think of a tiny `fetch`). Both timeouts are set before anything is sent. `http.begin(url)` gives it the address. It returns false if the URL cannot be understood, so the code checks for that. Every early `return false` in this function is a quiet way of saying \"this command did not happen\".",
        deep:
          "`HTTPClient` is a normal local variable, created fresh for each call, so each request is an independent connection and nothing carries over. That costs a little time per request, but it removes a whole class of stale-connection bugs. Because the URL starts with `http://`, no TLS is involved; an `https://` bulb address would need certificate handling this lab does not do.",
      },
      guess: {
        question: 'Why are the timeouts set before `http.begin(url)` and `GET()`?',
        options: [
          { text: 'So they are already in force when the request starts', right: true },
          {
            text: 'Because `GET()` cannot be called without them',
            right: false,
            why: '`GET()` works without them. It would simply wait for the default time.',
          },
          {
            text: 'To speed up the bulb',
            right: false,
            why: 'They only limit how long the ESP32 waits. The bulb is not affected.',
          },
        ],
        answer: "A limit set after the request has already gone out would not help it. Setting them first makes them apply to the whole call.",
      },
      words: ['http-client'],
    },
    {
      file: 'src/main.cpp',
      lines: [55, 60],
      anchor: 'int code = http.GET();',
      title: 'Send it, and check for no answer',
      text: {
        beginner:
          "`GET()` sends the request and waits. It gives back a number. A negative number means the bulb never answered, so the code prints a hint and stops.",
        explorer:
          "`GET()` returns the **HTTP status code**: 200 means OK. Negative numbers are not HTTP at all; they are errors from the ESP32's side, such as a timeout or a refused connection. `HTTPClient::errorToString(code)` turns the number into words. `http.end()` closes the connection and frees its memory, and it must be called on every path, including this error one.",
        deep:
          "A zero or negative code means no HTTP response arrived. The usual causes here: wrong `BULB_IP`, the bulb is unplugged or on another network, or the ESP32 lost Wi-Fi in the meantime. A positive code that is not 200, such as 401 when a password is on or 404 for a misspelled method, did arrive and falls through to the printing below, where you can read the bulb's own error text in the body.",
      },
      guess: {
        question: '`GET()` returns -1. What does that tell you?',
        options: [
          { text: 'The request failed on the ESP32 side, for example nobody answered in time', right: true },
          {
            text: 'The bulb replied with an error page',
            right: false,
            why: 'An error page from the bulb arrives with a positive code like 404 or 401. Negative means no reply at all.',
          },
          {
            text: 'The light is now off',
            right: false,
            why: 'The code has nothing to do with light state. It is only the result of the network call.',
          },
        ],
        answer: "Negative codes are local failures. A reply from the bulb always has a positive HTTP code.",
      },
      words: ['http-get', 'http-status'],
    },
    {
      file: 'src/main.cpp',
      lines: [61, 66],
      anchor: 'String body = http.getString();',
      title: 'Print the status and the reply',
      text: {
        beginner:
          "Now it reads the bulb's reply as text and closes the connection. It prints the status number and the reply, so you always see what the bulb said.",
        explorer:
          "`getString()` collects the body of the reply into a `String`. For `RGBCCT.Set` the reply is `null`, and for `RGBCCT.GetStatus` it is a JSON object that includes `output`, `brightness`, `mode` and `ct`. The function returns true only for code 200, so a caller can tell success from failure. Nothing here parses the JSON: reading it is your job, in the monitor.",
        deep:
          "The body is read after `GET()` returns, and the whole reply is held in memory, which is fine for these short replies. Printing the raw reply is a deliberate choice: when something goes wrong, the bulb's own words are the best debugging information you have. A more complete program would pick the one field it needs out of the JSON, and lab L3 shows how little of that you need.",
      },
      guess: {
        question: 'What does the function return for a status of 404?',
        options: [
          { text: 'false, only 200 counts as success', right: true },
          {
            text: 'true, because the bulb answered',
            right: false,
            why: 'An answer is not the same as success. The check is `code == 200`.',
          },
          {
            text: 'It never gets this far',
            right: false,
            why: 'A 404 is a normal positive code, so the code reaches the print lines.',
          },
        ],
        answer: "`code == 200` is false for 404, so the function prints the status and body and returns false.",
      },
      words: ['string'],
    },
    {
      file: 'src/main.cpp',
      lines: [68, 70],
      anchor: 'void printHelp()',
      title: 'The command list',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Prints the five commands you can type.",
        explorer:
          "`void` means the function returns nothing, it only does something. This one prints a single line listing `on`, `off`, `toggle`, `status` and `help`. It is also what unknown commands fall back to.",
        deep:
          "Keeping the help text in a function means `setup()` and `runCommand()` can both call it, so the two never drift apart. When you add a command in a later lab, add it here at the same time.",
      },
      words: ['void', 'serial'],
    },
    {
      file: 'src/main.cpp',
      lines: [72, 80],
      anchor: 'void runCommand(String cmd)',
      title: 'Four commands, four requests',
      text: {
        beginner:
          "The typed word is cleaned up and compared with the known commands. Each one makes one request to the bulb. Anything else shows the help.",
        explorer:
          "`trim()` removes stray spaces and the line ending, and `toLowerCase()` makes `ON` and `on` the same. Then an `else if` chain tries each name in turn. `on` and `off` call `RGBCCT.Set` with `on=true` or `on=false`. `toggle` calls `RGBCCT.Toggle`, which flips the state. `status` calls `RGBCCT.GetStatus`, which only reads. Every command goes through `callBulb`, so the printing and the error handling are the same for all.",
        deep:
          "`on` and `off` use `Set`, which is idempotent: sending `off` twice leaves the light off. `toggle` is not, so a retried toggle after a timeout can leave the light in the opposite state to the one you wanted. `Set` with only `on` is valid because the docs require at least one of `on`, `brightness`, `ct`, `rgb`, `mode` or `offset`. Colour and brightness are left for lab L3.",
      },
      guess: {
        question: 'You type `ON` in capitals. What happens?',
        options: [
          { text: 'It works, because `toLowerCase()` turns it into `on` first', right: true },
          {
            text: 'The help text prints, because `ON` is not `on`',
            right: false,
            why: 'The command is lower-cased before it is compared, so capitals do not matter.',
          },
          {
            text: 'The bulb turns off',
            right: false,
            why: '`ON` becomes `on`, which sends `on=true`.',
          },
        ],
        answer: "The command is lower-cased first, so `ON`, `On` and `on` are all the same command.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [82, 93],
      anchor: 'void readSerial()',
      title: 'Collecting a typed line',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "The same helper as in lab 02: it collects typed letters until you press Enter, then runs the finished line as a command.",
        explorer:
          "`static String line` keeps its text between calls, so a command can arrive in pieces. `Serial.available()` says how many typed characters are waiting, and `Serial.read()` takes one. A `\\n` or `\\r` (Enter) ends the line, and any other character is added to the end. It never waits, so `loop()` stays fast. The one catch in this lab: a command that triggers a request blocks for up to a few seconds while waiting for the bulb.",
        deep:
          "While `callBulb` waits for the bulb, nothing reads the serial port. Typed characters pile up in the UART's receive buffer and are processed afterwards, so nothing is lost for short bursts, but the board is not responsive during the wait. A more advanced version would run the request in its own task or use an asynchronous client. For a lab with one bulb and a 2 to 3 second worst case, blocking is the simpler and honest choice.",
      },
      words: ['static', 'char', 'serial-input'],
    },
    {
      file: 'src/main.cpp',
      lines: [95, 101],
      anchor: 'void setup()',
      title: 'setup: start serial, join Wi-Fi',
      text: {
        beginner:
          "Once at power-up: open the serial line, print which bulb address is being used, try to join Wi-Fi, and show the command list.",
        explorer:
          "`Serial.begin(115200)` matches `monitor_speed`. `delay(500)` gives the monitor a moment to attach, so you do not miss the first lines. `Serial.printf` fills the bulb's address into the `%s` spot. `joinWifi()` runs once here so you see the join result right at boot, even though every request would also join if needed.",
        deep:
          "Joining at boot, instead of waiting for the first command, moves the 1 to 5 second connect delay to a moment when you expect to wait anyway. The return value is ignored here on purpose: if the join fails, the next command tries again. Nothing is printed beyond the help line, so the first thing you type is what makes the board talk to the bulb.",
      },
      guess: {
        question: 'Why call `joinWifi()` in `setup()` when `callBulb` calls it anyway?',
        options: [
          { text: 'To get the connection delay and any error over with at start-up', right: true },
          {
            text: 'Because `callBulb` cannot join Wi-Fi by itself',
            right: false,
            why: '`callBulb` does call `joinWifi()` itself, so a dropped connection is repaired on demand.',
          },
          {
            text: 'To make the LED on the board blink',
            right: false,
            why: 'This lab does not touch the LED. The call only deals with Wi-Fi.',
          },
        ],
        answer: "Joining takes a few seconds. Doing it at boot means your first command is quick, and you see a join problem straight away.",
      },
      words: ['setup', 'serial-printf'],
    },
    {
      file: 'src/main.cpp',
      lines: [103, 105],
      anchor: 'void loop()',
      title: 'loop: just listen',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "The loop only checks for typed commands, over and over. Everything else happens when a command arrives.",
        explorer:
          "`loop()` runs forever after `setup()`. Here it does one thing: `readSerial()`. There is no LED to animate and no timer, because this lab only reacts to what you type.",
        deep:
          "An idle `loop()` that returns at once is fine: the Arduino core still yields to the Wi-Fi and system tasks between calls. Later labs that need background work, such as reconnecting or polling the bulb, will add `millis()` timers here.",
      },
      words: ['loop'],
    },
  ],
};

export default tour;
