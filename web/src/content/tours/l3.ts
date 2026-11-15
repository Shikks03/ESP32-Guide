import type { Tour } from '../types';

/**
 * Guided tour of labs/l3-scenes (platformio.ini, include/secrets.example.h, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 * Wi-Fi and request code is the same as lab L2, so those stops are short.
 */
const tour: Tour = {
  lessonId: 'l3',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'Same project file as L2',
      text: {
        beginner:
          "Unchanged from the last lab: ESP32 board, Arduino framework, 115200 baud, and your typing echoed in the monitor. No libraries to add.",
        explorer:
          "Everything this lab needs, Wi-Fi and web requests, is inside the Arduino-ESP32 core. `monitor_echo = yes` lets you see the scene names as you type them.",
        deep:
          "The build is the same size as L2 to within a few kilobytes: scenes are a handful of table rows and one small encoding function, so the cost is almost all Wi-Fi and HTTP, not your code.",
      },
      guess: {
        question: 'Scenes are new in this lab. Do they need a new line in `platformio.ini`?',
        answer:
          "No. A scene is just data in your own code plus a request you already know how to send, so the project file stays the same.",
      },
    },
    {
      file: 'include/secrets.example.h',
      lines: [1, 6],
      anchor: '#pragma once',
      title: 'The same secrets template',
      text: {
        beginner:
          "The same three placeholders as L2: Wi-Fi name, password and the bulb's address. If you already made `secrets.h` for L2, copy it into this lab's `include` folder.",
        explorer:
          "Each lab folder is its own project, so each needs its own `secrets.h`. The real file is gitignored. The bulb's address should be fixed (reserve it in your router), or the scenes will start failing after a reboot.",
        deep:
          "Secrets compiled into firmware can be read from the flash by anyone holding the board. For a bench lab that is acceptable; for anything you hand to someone else, move credentials to a provisioning step.",
      },
      guess: {
        question: 'You already made `secrets.h` in lab L2. Why does L3 still need one?',
        answer:
          "Because each lab is a separate PlatformIO project with its own `include` folder. Copy your file across, or make a new one.",
      },
      words: ['pragma-once', 'define'],
    },
    {
      file: 'src/main.cpp',
      lines: [1, 15],
      anchor: '#include <Arduino.h>',
      title: 'Includes, secrets and time limits',
      text: {
        beginner:
          "Same start as L2: three toolkits, the secrets file with its fallback, and time limits so a dead bulb cannot freeze the program.",
        explorer:
          "`__has_include` lets the code use your `secrets.h` when it exists and the example when it does not, so the project always builds. The three constants are **timeouts** in milliseconds: 15 s to join Wi-Fi, 2 s to reach the bulb, 3 s for its reply.",
        deep:
          "The numbers are plain constants at the top so you can tune them. 2 and 3 seconds are generous for a bulb on the same Wi-Fi. If a request ever times out in practice, look at signal strength before raising the limits.",
      },
      guess: {
        question: 'Which line makes the project build even when `secrets.h` does not exist?',
        options: [
          { text: 'The `#if __has_include("secrets.h")` block', right: true },
          {
            text: '`const char *PLACEHOLDER_SSID`',
            right: false,
            why: 'That is only a text to compare against at run time. The fallback is decided at compile time.',
          },
          {
            text: '`#include <WiFi.h>`',
            right: false,
            why: 'That brings in the Wi-Fi toolkit and has nothing to do with the secrets file.',
          },
        ],
        answer: "`__has_include` asks the compiler whether the file exists and picks the `#else` branch when it does not.",
      },
      words: ['include', 'has-include', 'preprocessor-if', 'const', 'c-string', 'uint32-t', 'uint16-t', 'timeout'],
    },
    {
      file: 'src/main.cpp',
      lines: [17, 26],
      anchor: 'const int CT_MIN',
      title: 'A scene is one bundle of settings',
      text: {
        beginner:
          "A scene is a small bundle of values: a name, white or colour, how bright, and either a white tone or a colour. The `struct` names the slots. `CT_MIN` and `CT_MAX` are the white tones this bulb can make, from warm 2700 to cool 6500.",
        explorer:
          "`struct Scene` is a custom type with seven fields. `mode` is the text `\"cct\"` (white, set by colour temperature) or `\"rgb\"` (colour). `brightness` is a percent. `ct` is Kelvin and only matters in `cct` mode; `r`, `g`, `b` only matter in `rgb` mode. A scene always says which mode it is in, because the docs do not say whether sending `ct` or `rgb` alone switches the mode.",
        deep:
          "Unused fields hold zeros, which is a little wasteful but keeps every scene the same shape, so one function can send any of them. `const char *` for the mode is cheap and compares with `strcmp`. An `enum` would be safer against typos, but the text is exactly what goes into the URL, so keeping it as text removes a translation step.",
      },
      guess: {
        question: 'Why does every scene carry its own `mode`?',
        options: [
          { text: 'So each request states white or colour explicitly instead of relying on a guess', right: true },
          {
            text: 'Because the bulb has no default mode',
            right: false,
            why: 'The bulb is always in some mode. The point is that the docs do not promise `ct` or `rgb` will change it.',
          },
          {
            text: 'To save memory',
            right: false,
            why: 'It costs a little memory per scene. The reason is clarity and safety, not size.',
          },
        ],
        answer: "Sending `mode` every time means a scene works no matter what the bulb was doing before.",
      },
      words: ['int', 'struct'],
    },
    {
      file: 'src/main.cpp',
      lines: [28, 35],
      anchor: 'const Scene SCENES[]',
      title: 'The scene table',
      text: {
        beginner:
          "The five scenes are rows in a table. `desk` is full brightness and a cool white. `bed` is very dim and a warm white. The other three are colours at 60 % brightness. To add a scene, add a row.",
        explorer:
          "Each row fills the `Scene` fields in order: name, mode, brightness, `ct`, then red, green, blue. `desk` uses 6000 K, a cool white that is clearly daylight-like but easier on the eyes than the 6500 K maximum; that is a taste call, so change it. `bed` is 10 % at 2700 K, the warmest the bulb makes. `SCENE_COUNT` divides the table's size by one row's size, so it updates itself when you add rows.",
        deep:
          "`sizeof(SCENES) / sizeof(SCENES[0])` works because the compiler still knows `SCENES` is an array here. The table is `const`, so it lives in flash rather than RAM. Percent brightness is not perceptual: 10 % feels brighter than you would expect, so try 3 to 5 % if `bed` is still too bright at night.",
      },
      guess: {
        question: 'What do you change to make a new scene called `reading`?',
        options: [
          { text: 'Add one row to `SCENES`; `SCENE_COUNT` adjusts itself', right: true },
          {
            text: 'Add a new `if` branch in `runCommand` and a new function',
            right: false,
            why: 'That is the work you avoid with a table. The loop in `runCommand` already checks every row.',
          },
          {
            text: 'Change `SCENE_COUNT` to 6 by hand',
            right: false,
            why: 'It is computed from the table size, so it follows the number of rows without any edit.',
          },
        ],
        answer: "One more row is enough, because `runCommand` loops over the whole table and `SCENE_COUNT` counts the rows.",
      },
      words: ['array', 'sizeof'],
    },
    {
      file: 'src/main.cpp',
      lines: [37, 41],
      anchor: 'int fadeSeconds = 2;',
      title: 'Fade time, and the placeholder check',
      text: {
        beginner:
          "`fadeSeconds` is how long every change takes to fade, in seconds. Below it is the same helper as L2 that checks whether you have replaced the placeholder Wi-Fi name.",
        explorer:
          "`fadeSeconds` is a plain variable, not `const`, because the `fade` command changes it while the program runs. 0 means switch instantly. `haveCredentials()` is `strcmp(...) != 0`: true when the name is not the placeholder. `strcmp` returns 0 for equal texts.",
        deep:
          "The Shelly `transition_duration` argument is in seconds for the RPC call. Because the same variable is used for every command, a `fade 0` followed by `desk` snaps, and `fade 5` followed by `bed` dims slowly, which is the intended feel for a bedside scene.",
      },
      words: ['bool', 'function', 'return', 'strcmp'],
    },
    {
      file: 'src/main.cpp',
      lines: [43, 61],
      anchor: 'bool joinWifi() {',
      title: 'joinWifi: same as L2',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Unchanged from L2: stop with a message if the secrets are missing, otherwise join Wi-Fi and wait up to 15 seconds.",
        explorer:
          "A guard at the top returns early with instructions when you have not made `secrets.h`. Then `WiFi.begin` starts joining and a `while` loop polls `WiFi.status()` every 250 ms until it connects or the deadline passes. Success prints the board's IP address and signal strength; failure names the likely causes.",
        deep:
          "Every request calls this first, so a dropped Wi-Fi link is repaired on the next command. When the board is already connected it returns at the first `if` and costs nothing. See the L2 tour for the details of the polling loop and the unsigned time arithmetic.",
      },
      words: ['wifi-join', 'if', 'while', 'millis', 'delay'],
    },
    {
      file: 'src/main.cpp',
      lines: [63, 77],
      anchor: '// Percent-encode',
      title: 'urlEncode: make [255,0,0] safe for a URL',
      text: {
        beginner:
          "Colours are sent as a list like `[255,0,0]`. Brackets and commas can confuse a web address, so this function rewrites them into safe codes. Letters and digits pass through untouched.",
        explorer:
          "It walks through the text one character at a time. Letters, digits and `- _ . ~` are copied as they are. Anything else becomes `%` plus the character's code in two hex digits: `[` becomes `%5B`, `,` becomes `%2C`, `]` becomes `%5D`. `snprintf` writes into a tiny 4-byte buffer: `%%` prints a literal percent sign and `%02X` prints the byte as two hex digits. `[255,0,0]` ends up as `%5B255%2C0%2C0%5D`.",
        deep:
          "The `(unsigned char)` casts matter: a plain `char` can be negative for bytes above 127, and `isalnum` and `%X` both misbehave on negative values. The buffer holds `%`, two digits and the terminating zero, so 4 bytes is exactly right, and `snprintf` cannot write past it. The Shelly docs show raw brackets in the example URL; encoding them is the form that does not depend on how the HTTP client treats those characters.",
      },
      guess: {
        question: 'What does `urlEncode("[0,0,255]")` return?',
        options: [
          { text: '`%5B0%2C0%2C255%5D`', right: true },
          {
            text: '`[0,0,255]`, unchanged',
            right: false,
            why: 'Brackets and commas are not letters or digits, so each is rewritten as a `%` code.',
          },
          {
            text: '`%5B%30%2C%30%2C%32%35%35%5D`',
            right: false,
            why: 'Digits are kept as they are. Only the brackets and commas are encoded.',
          },
        ],
        answer: "Digits stay, and each bracket or comma becomes `%` plus its hex code, giving `%5B0%2C0%2C255%5D`.",
      },
      words: ['url-encode', 'snprintf', 'isalnum', 'char'],
    },
    {
      file: 'src/main.cpp',
      lines: [79, 103],
      anchor: 'bool callBulb(',
      title: 'callBulb: same as L2',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Unchanged from L2: this builds the address, sends the request with time limits, and prints the status and the bulb's reply.",
        explorer:
          "The URL is `http://<bulb>/rpc/<method>?<query>`, an **RPC** call. `HTTPClient` sends a GET with a 2 s connect limit and a 3 s reply limit. A negative code means nobody answered; a positive one is the bulb's **HTTP status**, where 200 is success. The status and body are printed either way, so if a scene does nothing you can read the bulb's own complaint.",
        deep:
          "`const String &` parameters avoid copying. `http.end()` runs on every path so the connection is always released. The body is the raw JSON or `null`; this lab still does not parse it. Seeing the real reply is the fastest way to learn which argument the bulb disliked.",
      },
      words: ['string-concat', 'reference-param', 'rpc', 'http-client', 'http-get', 'http-status', 'string'],
    },
    {
      file: 'src/main.cpp',
      lines: [105, 108],
      anchor: '// "&transition_duration=N"',
      title: 'fadePart: add a fade only when wanted',
      text: {
        beginner:
          "This returns the little piece of web address that asks for a smooth fade, or nothing at all when the fade is 0. It is added to the end of every change.",
        explorer:
          "`cond ? a : b` is a one-line if/else. If `fadeSeconds` is above 0 the result is `&transition_duration=2` (or whatever the number is); otherwise it is an empty string. `transition_duration` is a documented `RGBCCT.Set` argument, in seconds. With it, the bulb changes smoothly instead of snapping.",
        deep:
          "Leaving the argument out for 0 avoids relying on how the bulb treats an explicit zero. Both branches of the ternary must be the same type, which is why the second one is written `String(\"\")` instead of a bare `\"\"`. The bulb's config also has a `transition_duration` field (see `RGBCCT.GetConfig`); what it does when a request sends none is not something the docs spell out, so check it on your bulb.",
      },
      guess: {
        question: 'With `fadeSeconds = 0`, what does `fadePart()` return?',
        options: [
          { text: 'An empty string, so no fade argument is sent', right: true },
          {
            text: '`&transition_duration=0`',
            right: false,
            why: 'The condition `fadeSeconds > 0` is false, so the second choice is used, which is empty.',
          },
          {
            text: '`false`',
            right: false,
            why: 'It always returns a `String`, never a bool.',
          },
        ],
        answer: "The condition is false, so the empty string is returned and the request carries no fade argument.",
      },
      words: ['ternary'],
    },
    {
      file: 'src/main.cpp',
      lines: [110, 121],
      anchor: 'void applyScene(',
      title: 'applyScene: one scene, one request',
      text: {
        beginner:
          "This turns one table row into one request. It starts the address with the settings every scene has, adds either the white tone or the encoded colour, adds the fade, and sends it.",
        explorer:
          "`q` starts as `id=0&on=true&mode=cct&brightness=100` (for example). White scenes add `&ct=6000`. Colour scenes build the text `[255,0,0]`, encode it with `urlEncode`, and add it as `&rgb=...`. Then `fadePart()` is appended and `callBulb(\"RGBCCT.Set\", q)` sends it. `on=true` is always included, so choosing a scene also wakes the bulb up.",
        deep:
          "`strcmp(s.mode, \"cct\") == 0` is the text comparison for \"is this a white scene\". `const Scene &s` passes the row by reference without copying. The finished white request looks like `RGBCCT.Set?id=0&on=true&mode=cct&brightness=100&ct=6000&transition_duration=2`, using only argument names the Shelly docs list for this call: `id`, `on`, `mode`, `brightness`, `ct`, `rgb` and `transition_duration`.",
      },
      guess: {
        question: 'Why does `applyScene` always include `on=true`?',
        options: [
          { text: 'So a scene also works when the bulb is currently off', right: true },
          {
            text: 'Because `RGBCCT.Set` refuses requests without it',
            right: false,
            why: 'The docs only require one of several arguments. `on` is included for a different reason: the bulb should light up.',
          },
          {
            text: 'To make the fade slower',
            right: false,
            why: 'Fade length comes from `transition_duration`, not from `on`.',
          },
        ],
        answer: "Choosing `bed` at midnight should light the bulb, not silently change settings on a bulb that stays dark.",
      },
      words: ['void'],
    },
    {
      file: 'src/main.cpp',
      lines: [123, 127],
      anchor: 'void printHelp()',
      title: 'Three lines of help',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Prints all the commands, grouped into scenes, dials and basics.",
        explorer:
          "Three `Serial.println` lines. Keep the ranges here in step with the clamps in `runCommand`: brightness 0 to 100, colour temperature 2700 to 6500.",
        deep:
          "If you add a row to `SCENES`, the scene list in the help is not updated for you. A neat upgrade is to loop over the table and print each name, so the help can never go stale.",
      },
      words: ['serial'],
    },
    {
      file: 'src/main.cpp',
      lines: [129, 138],
      anchor: 'void runCommand(String cmd)',
      title: 'Split the command, try the scenes first',
      text: {
        beginner:
          "The typed line is cleaned up and cut into a word and a number, like `bright 30`. Then the code checks the word against every scene name in the table. If one matches, that scene is applied and the function is done.",
        explorer:
          "The splitting is the same as in lab 02: `trim()`, `toLowerCase()`, then the first space separates the name from the number (-1 means no number). The `for` loop walks the table with `i`. `name == SCENES[i].name` compares an Arduino `String` with plain text, which works. On a match it applies the scene and `return`s, so none of the commands below run.",
        deep:
          "Checking the table first means a scene name wins over a command of the same name. That is fine now but worth remembering if you ever call a scene `on`. `toInt()` returns 0 for text that is not a number, so `bright abc` becomes 0, but the `arg >= 0` checks below still accept it; that quirk is why the help text shows the allowed ranges.",
      },
      guess: {
        question: 'You type `bed`. What stops the code from also running the `on` and `off` checks below?',
        options: [
          { text: 'The `return` right after `applyScene`', right: true },
          {
            text: 'The `for` loop ends on its own',
            right: false,
            why: 'The loop ending would still let the code carry on below it. It is the `return` that leaves the whole function.',
          },
          {
            text: 'Nothing, they all run',
            right: false,
            why: 'They would if there were no `return`, but the function is left as soon as a scene matches.',
          },
        ],
        answer: "`return` leaves `runCommand` immediately, so only the matching scene runs.",
      },
      words: ['for', 'logical-and'],
    },
    {
      file: 'src/main.cpp',
      lines: [139, 153],
      anchor: 'if (name == "on") callBulb',
      title: 'The other commands, with limits',
      text: {
        beginner:
          "Everything that is not a scene: on, off, toggle, status, a brightness number, a white tone number, and a fade time. Numbers are clamped into the range the bulb accepts, so a typo cannot send nonsense.",
        explorer:
          "`bright 30` clamps 30 into 0 to 100 and sends `brightness=30` with `on=true`; no `mode` is sent, so it keeps the current white or colour. `ct 4000` clamps into 2700 to 6500 and sends `mode=cct&ct=4000`, because a white tone only makes sense in white mode. `fade 5` only changes the variable and prints it. `constrain(x, lo, hi)` is the clamp. `&&` means both conditions must hold, so a bare `bright` with no number falls through to help.",
        deep:
          "`on` and `off` use `RGBCCT.Set` (the same result however often you send it), while `toggle` flips, so a retry of `toggle` after a timeout can undo itself. `ct` always sends `mode=cct`, and scenes always send theirs; `bright` is the one place we leave `mode` alone on purpose. The `fade` limit of 30 seconds is a choice in this code, not a limit from the docs.",
      },
      guess: {
        question: 'What does `ct 9000` send to the bulb?',
        options: [
          { text: '`ct=6500`, the top of the range, along with `mode=cct`', right: true },
          {
            text: '`ct=9000`, and the bulb decides what to do',
            right: false,
            why: '`constrain(arg, CT_MIN, CT_MAX)` caps the number before it is used.',
          },
          {
            text: 'Nothing, 9000 is rejected with an error',
            right: false,
            why: 'The code does not reject it. It quietly clamps it to the nearest allowed value.',
          },
        ],
        answer: "`constrain` clamps 9000 down to `CT_MAX` (6500) before the request is built.",
      },
      words: ['constrain'],
    },
    {
      file: 'src/main.cpp',
      lines: [155, 166],
      anchor: 'void readSerial()',
      title: 'Collecting a typed line',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Same helper as before: it collects typed letters until you press Enter, then runs the line as a command.",
        explorer:
          "`static String line` keeps the half-typed command between calls. `Serial.available()` and `Serial.read()` take what has arrived, one character at a time. Enter (`\\n` or `\\r`) finishes the line. While a request is waiting for the bulb, typed characters queue up in the serial buffer and are handled afterwards.",
        deep:
          "Because `callBulb` blocks for up to a few seconds in the worst case, a long burst of typing during a slow request could overflow the small serial buffer. For typed commands that does not happen in practice.",
      },
      words: ['static', 'serial-input'],
    },
    {
      file: 'src/main.cpp',
      lines: [168, 174],
      anchor: 'void setup()',
      title: 'setup: start serial, join Wi-Fi, show help',
      text: {
        beginner:
          "Once at power-up: open the serial line, say which bulb it will use, join Wi-Fi, and print the command list.",
        explorer:
          "`Serial.begin(115200)` matches the monitor speed and the half-second `delay` lets the monitor attach. Joining at boot moves the connect delay away from your first command, and shows any Wi-Fi problem straight away.",
        deep:
          "There is no scene sent at boot on purpose: a board that restarts should not suddenly change your lights. Whether to restore a scene after a power cut is a design question that belongs in the Zones track.",
      },
      words: ['setup', 'serial-printf'],
    },
    {
      file: 'src/main.cpp',
      lines: [176, 178],
      anchor: 'void loop()',
      title: 'loop: listen for commands',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "The loop only checks for typed commands, again and again.",
        explorer:
          "All the work happens when a command arrives. There is no timer or animation, so `loop()` is just `readSerial()`.",
        deep:
          "Later, something like the radar will decide when a scene should change. That decision would call `applyScene(...)` from here, using the same table and the same request code.",
      },
      words: ['loop'],
    },
  ],
};

export default tour;
