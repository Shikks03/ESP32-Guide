import type { Tour } from '../types';

/**
 * Guided tour of labs/s4-room-view (platformio.ini, include/secrets.example.h, src/main.cpp).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
const tour: Tour = {
  lessonId: 's4',
  stops: [
    {
      file: 'platformio.ini',
      lines: [1, 6],
      anchor: '[env:esp32dev]',
      title: 'Still the same six lines',
      text: {
        beginner: "Even with Wi-Fi and a web page, the project file does not change. The Wi-Fi and web server code ships with the Arduino toolkit for the ESP32, so there is nothing extra to download.",
        explorer: "No `lib_deps` line, so no outside libraries: `WiFi`, `WebServer` and the serial code are all part of the Arduino-ESP32 core that `framework = arduino` brings in.",
        deep: "The firmware is about 1 MB, roughly three quarters of the default app partition, so the Wi-Fi stack is a real cost. That leaves room for this lab, but a big addition such as OTA updates or a TLS client would need a different partition table.",
      },
      guess: {
        question: 'This lab adds Wi-Fi and a web server. Which line in this file would you expect to need adding?',
        answer: 'None. Both come with the Arduino core already selected by `framework = arduino`.',
      },
    },
    {
      file: 'include/secrets.example.h',
      lines: [1, 6],
      anchor: '// Copy this file to secrets.h',
      title: 'Your Wi-Fi details live in a file that is never committed',
      text: {
        beginner: "This file holds placeholders for your Wi-Fi name and password. You copy it to `secrets.h`, fill in your real details, and `secrets.h` is kept out of the repo, so your password never leaves your PC.",
        explorer: "`#define WIFI_SSID \"...\"` gives a name to a piece of text. `#pragma once` stops the file being pasted in twice. `secrets.h` is listed in `.gitignore`. This example file is the one that is committed, and it holds only fake values.",
        deep: "A `#define` string is substituted by the preprocessor wherever `WIFI_SSID` appears, so the password becomes part of the compiled binary. Anyone who gets the `.bin` file can find it, so treat flashed firmware as sensitive too. The ESP32 only sees 2.4 GHz networks, so the name has to be one of those.",
      },
      guess: {
        question: 'Before reading the next stop: why is the committed file called `secrets.example.h` and not `secrets.h`?',
        answer: 'So the real password file can be kept out of the repo. The example shows the format with fake values and gets copied to `secrets.h` on your own machine.',
      },
      words: ['pragma-once'],
    },
    {
      file: 'src/main.cpp',
      lines: [1, 9],
      anchor: '#include <Arduino.h>',
      title: 'Use secrets.h if it exists, the example if not',
      text: {
        beginner: "The first three lines bring in Arduino, Wi-Fi and the web server. Then the program picks which secrets file to use: your real one if you made it, otherwise the placeholders. That way the project builds either way.",
        explorer: "`__has_include(\"secrets.h\")` asks the compiler whether that file exists. The `#if ... #else ... #endif` block keeps only one of the two includes. With the placeholders, the build works and the program notices at run time and tells you to create `secrets.h`.",
        deep: "Doing this at compile time means nothing about secrets has to be in the repo for `pio run` to succeed, and nobody can accidentally commit real credentials by copying a template over. The cost: a build without `secrets.h` runs fine but cannot join any network, which is why the firmware checks for the placeholder text and says so.",
      },
      guess: {
        question: 'There is no `secrets.h` yet. What happens when you build?',
        answer: 'The fallback include is used. Nothing breaks, and the board reminds you to make a real `secrets.h`.',
      },
      words: ['has-include'],
    },
    {
      file: 'src/main.cpp',
      lines: [11, 22],
      anchor: 'const int PIN_RADAR_RX = 16;',
      title: 'Pins, room size and a left-right switch',
      text: {
        beginner: "The radar pins and speed are as before. New are the room size in millimetres, which the web page uses to draw the room, and `FLIP_X`, a switch you can turn on if left and right look swapped.",
        explorer: "`ROOM_W_MM` and `ROOM_D_MM` are 2220 and 2160, the size of the room this project is for. The page is drawn from these numbers, so another room only needs these two lines changed. `FLIP_X` mirrors every x value before it is sent to the page.",
        deep: "The protocol document gives the sign rule for x but not which side of the radar is positive in the room, and this guide has not confirmed it. Rather than guess, the lab has a one-line fix after a test walk. The same question comes back in the zones work: whatever you decide there must be consistent with what the page draws.",
      },
      guess: {
        question: 'You walk to your left and the dot goes right. What do you change?',
        options: [
          { text: 'Set `FLIP_X` to `true` and upload again', right: true },
          { text: 'Swap the TX and RX wires', right: false, why: 'That would stop the data arriving at all. The data is fine, only the left-right sign needs flipping.' },
          { text: 'Change `ROOM_W_MM`', right: false, why: 'That only changes the size of the drawn room, not which side is positive.' },
        ],
        answer: '`FLIP_X` negates x before sending, which mirrors the picture without touching the wiring.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [24, 35],
      anchor: 'struct Target {',
      title: 'The same target struct and frame variables',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "The same `Target` struct and frame variables as in S3. Nothing new.",
        explorer: "The only new variable is `showTargets`, which the `targets` command flips, so you can still see parsed numbers in the monitor while the web page is also being fed.",
        deep: "Copying the parser into each lab keeps every lab buildable on its own folder. When the parts are combined in the Zones track, this would become one shared file included by all.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [37, 41],
      anchor: 'WebServer web(80);',
      title: 'Two servers: one for the page, one for the stream',
      text: {
        beginner: "The board runs two little servers. One on port 80 hands out the web page when a browser asks. The other on port 81 keeps a connection open and pushes the targets to up to three viewers.",
        explorer: "`WebServer web(80)` is the ready-made web server: it parses requests and calls your handler. `WiFiServer sse(81)` is only a listener: it accepts connections and says nothing about web protocols. `WiFiClient viewers[3]` holds the open connections, one per watching browser.",
        deep: "A browser that uses `EventSource` opens one request and expects it to stay open forever. The `WebServer` class is built around answering a request and finishing it, so a second plain server gives you full control of the socket and avoids any extra library. The cost is that the page and the stream are on different ports, which is why the stream has to send a cross-origin header.",
      },
      guess: {
        question: 'Why use a second server on port 81 for the stream?',
        options: [
          { text: 'The stream keeps each connection open, which a normal request handler is not made for', right: true },
          { text: 'Port 80 is not allowed to send data', right: false, why: 'Port 80 serves the page fine. The difference is how long each connection stays open.' },
          { text: 'To make it faster', right: false, why: 'Speed is not the reason. A long-lived connection is.' },
        ],
        answer: 'A stream is one request that never ends. A bare listener lets the code hold the connections open and write to them whenever a frame arrives.',
      },
      words: ['web-server', 'wifi-server'],
    },
    {
      file: 'src/main.cpp',
      lines: [43, 60],
      anchor: '// The page, in one string',
      title: 'The whole web page is one string',
      text: {
        beginner: "The page, with its styling, is written as one long piece of text right in the C++ file. The board sends exactly this text to your browser. There are no files and nothing is fetched from the internet.",
        explorer: "`R\"rawliteral( ... )rawliteral\"` is a **raw string**: line breaks and quotes are kept exactly as typed, so you can paste HTML in without escaping. The `<style>` block sets colours for light and dark mode. `__W__` and `__D__` are placeholders the firmware swaps for the room size before sending. There is a `<canvas>`, a drawing surface, plus a status line and a text area.",
        deep: "Inlining everything is the local-first rule at work: no CDN, no font download, so the page works with the router unplugged from the internet. The text sits in flash, not RAM, though `handleRoot` copies it into a `String` each time it is served, which is fine for one page view at a time. The CSS uses `CanvasText` and `prefers-color-scheme` so the page follows the phone's light or dark setting with no JavaScript.",
      },
      guess: {
        question: 'What are `__W__` and `__D__` in the page text?',
        options: [
          { text: 'Placeholders the firmware replaces with the room width and depth before sending', right: true },
          { text: 'Variables that the browser fills in', right: false, why: 'The browser never sees them: the board swaps them out first, in `handleRoot`.' },
          { text: 'Part of the HTML standard', right: false, why: 'They are made up for this lab. The double underscores make them easy to spot and unlikely to clash.' },
        ],
        answer: '`handleRoot` calls `replace` on them, so the page the browser receives already has real numbers in them.',
      },
      words: ['raw-string'],
    },
    {
      file: 'src/main.cpp',
      lines: [61, 67],
      anchor: '<script>',
      title: 'Millimetres in, pixels out',
      text: {
        beginner: "The page's JavaScript starts by working out how to turn the radar's millimetres into pixels on the screen. The radar sits at the bottom middle of the picture and y goes up the screen.",
        explorer: "`S` is the scale: pixels per millimetre, from the canvas width and the room width plus a margin `M`. `px(x)` and `py(y)` convert a position to a canvas spot. The y is `D + M - y` because the screen's y axis points down while the radar's y grows away from it. `COL` has one colour for each of the three target slots.",
        deep: "The origin is the radar at the bottom centre, x sideways, y straight out. The drawing is a fixed 960 pixels wide and the CSS shrinks it to fit the screen, so it stays sharp on a phone. The mounting height and rotation of the radar are not modelled: that is decided later, in the zones work.",
      },
      guess: {
        question: 'Why is it `D + M - y` and not just `y`?',
        options: [
          { text: 'Canvas y counts down from the top, but the radar\'s y grows away from the bottom', right: true },
          { text: 'To make the room look bigger', right: false, why: 'The maths only flips the direction and adds a margin. It does not scale anything.' },
          { text: 'The radar reports y upside down', right: false, why: 'The radar\'s y is straight out from the sensor. It is the screen that counts downward.' },
        ],
        answer: 'Flip the axis: a target far from the radar (large y) must land near the top of the picture, where the canvas y is small.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [68, 86],
      anchor: 'function draw(){',
      title: 'Drawing the room, the cone and the dots',
      text: {
        beginner: "Each time new data arrives, the page wipes the canvas and redraws: the room outline, two dashed lines for the radar's view, the radar dot, and one numbered dot for each target. A dot outside the room is drawn as an empty ring at the edge.",
        explorer: "`strokeRect` draws the room. The dashed lines go out at 60 degrees each side, the radar's field of view per its manual. Each target `t` is `[slot, x, y, speed, resolution]`. `inside` checks whether it is within the room, and the x and y are clamped so a far-off target still shows at the border. Inside means a filled dot, outside means a ring.",
        deep: "Redrawing everything at 10 Hz is trivial for a canvas. The 60 degrees comes from the manual's azimuth of plus or minus 60. The vertical limit, plus or minus 35, cannot be shown from above. The drawing deliberately shows targets beyond the room: the radar can see to about 6 m, farther than this room is deep, so you can see people in the next room, or through a doorway.",
      },
      guess: {
        question: 'What does a hollow ring on the page mean?',
        options: [
          { text: 'A target the radar sees that is outside the drawn room', right: true },
          { text: 'A target that stopped moving', right: false, why: 'The ring is only about position. Speed is not drawn at all.' },
          { text: 'A second radar', right: false, why: 'There is just one radar. It is the small solid dot at the bottom middle.' },
        ],
        answer: '`inside` is false, so the code strokes the circle instead of filling it and clamps it to the edge of the picture.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [87, 96],
      anchor: "const st=document.getElementById('s')",
      title: 'Listening to the stream',
      text: {
        beginner: "The page opens one long connection to port 81. Every time the board sends a message, the page reads the targets in it, redraws, and updates the text under the picture. The status line says `live` or `disconnected`.",
        explorer: "`new EventSource(url)` opens the connection. `location.hostname` is the address you typed in the browser, so it works with whatever IP the board got. `onmessage` runs for each message: `JSON.parse(e.data)` turns the text into a list, `draw()` redraws and the text area is rebuilt. `onerror` fires if the link drops, and the browser reconnects by itself.",
        deep: "This is **Server-Sent Events**: a normal HTTP request that the server never finishes. It is one-way (board to page), which is all this needs, and the browser handles retry and reconnect, so there is no code for that here. A WebSocket would allow messages the other way too, but needs a handshake the lab would have to implement by hand without a library.",
      },
      guess: {
        question: 'What makes the page update when a person walks?',
        options: [
          { text: 'The board pushes a message and `onmessage` redraws', right: true },
          { text: 'The page asks the board for data every second', right: false, why: 'That would be polling. The page asks once and the board keeps sending.' },
          { text: 'The browser reloads the page', right: false, why: 'The page never reloads. Only the canvas is redrawn.' },
        ],
        answer: 'The `EventSource` connection stays open and each message from the board triggers `onmessage`, which calls `draw()`.',
      },
      words: ['sse'],
    },
    {
      file: 'src/main.cpp',
      lines: [98, 115],
      anchor: 'int16_t decodeSigned(uint8_t lo, uint8_t hi)',
      title: 'The parser from S3, unchanged',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "These are the same `decodeSigned` and `parseFrame` functions as in S3.",
        explorer: "The sign rule is the radar's own: top bit set means positive, clear means negative, other 15 bits are the size. Empty target blocks (all zero) are marked not present.",
        deep: "Because the parser has been tested against the official frame in S3, this lab does not repeat the self-test. If the dots look wrong, check `FLIP_X` and the wiring before suspecting the decode.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [117, 125],
      anchor: 'bool haveCredentials() {',
      title: 'Are the Wi-Fi details still the placeholder?',
      text: {
        beginner: "`haveCredentials` says whether you have put real Wi-Fi details in. It compares the network name with the example text. `viewerCount` counts how many browsers are connected right now.",
        explorer: "`strcmp(a, b)` compares two C strings letter by letter and returns 0 if they are equal. `!= 0` therefore means they differ, which means you changed the name. `==` on C strings would compare addresses, not letters, so it is not used. `viewerCount` loops over the three slots and counts the connected ones.",
        deep: "If the check fails the board skips Wi-Fi entirely, so it never tries to join a network called `your-2.4GHz-network`, which would just spin. The radar parsing keeps working, and the `targets` command still prints, so the lab stays useful before Wi-Fi is set up.",
      },
      guess: {
        question: 'Why use `strcmp` and not `==` to compare the Wi-Fi name?',
        options: [
          { text: '`==` on C strings compares addresses, not the letters', right: true },
          { text: '`strcmp` is faster', right: false, why: 'Speed does not matter here. It is about getting the right answer.' },
          { text: '`==` is not allowed in C++', right: false, why: '`==` is fine on numbers, and on `String` objects. It just does not compare letters for plain C strings.' },
        ],
        answer: 'For a plain `const char *`, `==` asks "same place in memory?". `strcmp` asks "same letters?".',
      },
      words: ['strcmp'],
    },
    {
      file: 'src/main.cpp',
      lines: [127, 133],
      anchor: '// Send one chunk of text',
      title: 'Send to every viewer, drop the ones that left',
      text: {
        beginner: "This sends a piece of text to every connected browser. If a browser has gone away, its connection is closed and its slot is freed for the next one.",
        explorer: "The loop goes over the three slots. `connected()` is false for a closed or empty slot, so `stop()` tidies it, and `continue` moves on. Otherwise `print(text)` writes the message to that browser over Wi-Fi.",
        deep: "Noticing dead connections here, lazily, on the next send, is simpler than reacting to a disconnect event. A phone that goes to sleep never says goodbye, and the socket only fails once a write goes unanswered, which is also one reason for the periodic ping further down.",
      },
      guess: {
        question: 'Why is the `connected()` check inside the loop?',
        options: [
          { text: 'A browser may have left, and its slot needs freeing for the next viewer', right: true },
          { text: 'To check Wi-Fi is on', right: false, why: 'That is checked elsewhere. This is per viewer.' },
          { text: 'To slow the loop down', right: false, why: 'It does not wait. It only checks the socket state.' },
        ],
        answer: 'Closed viewers are dropped as soon as they are noticed, so a new browser can take their place.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [135, 148],
      anchor: '// One SSE message',
      title: 'Build one message: data, a line, a blank line',
      text: {
        beginner: "This turns the targets into one line of text like `data: {\"t\":[[1,-782,1713,-16,320]]}` and sends it. Only slots with a target are included. Each target is slot number, x, y, speed, resolution.",
        explorer: "`snprintf` fills a character buffer and never writes past its size. Its return value is how many characters it wrote, and `n +=` adds that so the next piece is appended after it. The `first ? \"\" : \",\"` puts commas between targets but not before the first. A message must end with a blank line, which is the `\\n\\n`. `FLIP_X` negates x here.",
        deep: "The format is JSON by hand, because a JSON library would be an extra dependency for a few numbers. The 200-byte buffer holds three targets with room to spare: each is at most about 30 characters. If it did overflow, `snprintf` would truncate rather than corrupt memory, and the page would fail to parse that one message and carry on with the next.",
      },
      guess: {
        question: 'What marks the end of one event in the stream?',
        options: [
          { text: 'A blank line, so the message ends with two newlines', right: true },
          { text: 'A closing bracket', right: false, why: 'The bracket ends the JSON, but the stream format itself needs the blank line.' },
          { text: 'The connection closing', right: false, why: 'The connection stays open for the whole session. Messages are separated by blank lines.' },
        ],
        answer: 'Server-Sent Events separate messages with an empty line. Without it, the browser keeps waiting for the rest.',
      },
      words: ['snprintf'],
    },
    {
      file: 'src/main.cpp',
      lines: [150, 161],
      anchor: 'void handleFrame() {',
      title: 'Each good frame: parse, then stream',
      text: {
        beginner: "When a frame is complete, it is parsed. If the servers are up and someone is watching, the targets are sent to them. If you turned on `targets`, they are also printed to the monitor.",
        explorer: "`serversUp && viewerCount() > 0` means do the network work only when there is a viewer, so an unwatched board does no formatting or sending. `showTargets` is the serial printout switch. The frame itself came from `feedByte`.",
        deep: "Sending from inside the frame handler ties the stream rate to the radar: ten frames a second, ten messages a second, no timers and no queue. If a viewer is slow, `broadcast` waits at most 100 ms for it, set by `setTimeout(100)` on the connection. How the loop copes with a badly stalled phone has not been tested.",
      },
      guess: {
        question: 'Why check `viewerCount() > 0` before sending?',
        options: [
          { text: 'No viewers means no need to build or send a message', right: true },
          { text: 'The send would crash with zero viewers', right: false, why: '`broadcast` handles empty slots fine. This is only to save work.' },
          { text: 'To limit the stream to one viewer', right: false, why: 'Up to three can watch. This only checks for at least one.' },
        ],
        answer: 'It saves the formatting and send work while nobody is watching.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [163, 184],
      anchor: 'void feedByte(uint8_t b) {',
      title: 'Finding frames, as in S2 and S3',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "The same frame finder as in the earlier labs: match the header, collect 30 bytes, check the tail.",
        explorer: "A good frame calls `handleFrame()`. A bad one is only counted, since printing it would not help the page.",
        deep: "This runs byte by byte from `loop()` and costs microseconds per frame, so the network work in `handleFrame` is by far the slowest step in the whole path.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [186, 191],
      anchor: 'void handleRoot() {',
      title: 'Serving the page',
      text: {
        beginner: "When a browser asks for the page, this copies the page text, puts the room size into the two placeholders, and sends it back.",
        explorer: "`String page(PAGE)` copies the text. `page.replace(\"__W__\", ...)` swaps every occurrence. `web.send(200, \"text/html\", page)` sends status 200 (OK), says it is HTML, and sends the text. `web.on(\"/\", handleRoot)` is what connects this function to the address `/`.",
        deep: "The copy lives on the heap only while the page is being sent. At a few kilobytes it is no problem on the ESP32, and doing it per request means a changed `ROOM_W_MM` takes effect with no other step.",
      },
      guess: {
        question: 'What does `web.send(200, "text/html", page)` tell the browser?',
        options: [
          { text: 'Success, and the body is an HTML page', right: true },
          { text: 'The page is missing', right: false, why: '200 means success. A missing page would be 404.' },
          { text: 'Open a second connection for the data', right: false, why: 'The page itself does that, using `EventSource`, after it loads.' },
        ],
        answer: '200 is "OK", and `text/html` tells the browser to render the body as a web page.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [193, 220],
      anchor: '// A browser connected to port 81',
      title: 'Accepting a viewer and starting the stream',
      text: {
        beginner: "When a browser connects to port 81, the board first reads and ignores what the browser asked, then sends back a short header that says \"event stream, I will keep sending\". The browser goes into a free slot. If all three slots are used, the fourth gets a polite refusal.",
        explorer: "`sse.accept()` returns a connection if one is waiting. The `while` loop reads and throws away the request lines until the blank one. Then the first free slot is filled, and the **HTTP header** is sent: status line, `Content-Type: text/event-stream`, no caching, and a blank line to end the header. `Access-Control-Allow-Origin: *` is there because the page came from port 80 and the stream from 81, which a browser treats as different origins. If every slot is taken, the code sends a 503 and closes.",
        deep: "The wildcard origin lets any web page open this stream, but only from a device that can reach the board's IP, so on a home network it is the same exposure as the page itself, which has no password either. The 200 ms cap on reading the request and `setTimeout(100)` stop one slow client from holding up the loop for long. `retry: 2000` tells the browser to wait two seconds before reconnecting after a drop.",
      },
      guess: {
        question: 'Why does the header include `Access-Control-Allow-Origin: *`?',
        options: [
          { text: 'The page is served from port 80 but opens the stream on port 81, which counts as another origin', right: true },
          { text: 'To let the radar talk to the browser', right: false, why: 'The radar is not involved in this. It only feeds the board.' },
          { text: 'To protect the stream with a password', right: false, why: 'It does the opposite: it allows any page to read the stream. There is no password.' },
        ],
        answer: 'Browsers block a page from reading a response from a different port unless that response says it is allowed. The header gives that permission.',
      },
      words: ['http-header'],
    },
    {
      file: 'src/main.cpp',
      lines: [222, 227],
      anchor: 'void keepAlive(uint32_t now) {',
      title: 'A ping every ten seconds',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "Every ten seconds the board sends a harmless line so a quiet connection does not look dead.",
        explorer: "A line starting with `:` is a comment in the event stream format. The browser ignores it, but writing it makes a dead connection fail, so `broadcast` can drop it. `static uint32_t last` remembers the last time between calls.",
        deep: "When the radar is running, messages go out ten times a second and the ping is redundant. It matters when the radar is silent: without any writes, a phone that left would never be noticed and would hold a slot forever.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [229, 240],
      anchor: 'void startWifi() {',
      title: 'Start joining Wi-Fi, or say what is missing',
      text: {
        beginner: "If you have not made `secrets.h` yet, this prints what to do and stops there. Otherwise it starts joining your network and returns straight away. The actual join takes a few seconds in the background.",
        explorer: "`WiFi.mode(WIFI_STA)` makes the board a client of your router. `setAutoReconnect(true)` makes it rejoin if the link drops. `WiFi.begin(ssid, pass)` starts the join and returns immediately, so the program does not freeze while it waits. The radar keeps working in either case.",
        deep: "Returning at once is what keeps the program responsive: the join is handled by the Wi-Fi task in the background, and `loop()` checks the result with `WiFi.status()`. The board will only join 2.4 GHz networks, because that is the only band this chip's radio has.",
      },
      guess: {
        question: 'You forgot to create `secrets.h`. What does the board do?',
        options: [
          { text: 'Prints how to fix it, skips Wi-Fi, and keeps reading the radar', right: true },
          { text: 'Restarts over and over', right: false, why: 'Nothing here crashes or restarts. It just skips the Wi-Fi part.' },
          { text: 'Joins a default network', right: false, why: 'There is no default network. The placeholder name is refused.' },
        ],
        answer: 'It prints the three message lines and returns. The radar parsing and the `targets` command still work.',
      },
      words: ['wifi-begin'],
    },
    {
      file: 'src/main.cpp',
      lines: [242, 251],
      anchor: '// Once the router has given us an address',
      title: 'Start the servers once the network is up',
      text: {
        beginner: "Every pass, this checks whether Wi-Fi is connected yet. The first time it is, the web server and the stream server start and the board prints the address to open in your browser.",
        explorer: "The first line is a list of reasons to do nothing: no credentials, servers already up, or not connected yet. After it, `web.on(\"/\", handleRoot)` links the page to the address `/`, then both servers start listening. `serversUp = true` makes sure that happens once only.",
        deep: "Starting servers only after an IP exists avoids binding a listener on an interface that is not up. If the router drops the board later, the servers stay running and the Wi-Fi stack reconnects, so viewers' streams resume without any code here.",
      },
      guess: {
        question: 'Why start the servers in `watchWifi()` and not in `setup()`?',
        options: [
          { text: 'The Wi-Fi join takes seconds, and the servers need the connection up first', right: true },
          { text: '`setup()` is not allowed to start servers', right: false, why: 'It could. The point is that Wi-Fi is not ready when `setup()` finishes.' },
          { text: 'To save memory', right: false, why: 'Memory use is the same either way.' },
        ],
        answer: '`WiFi.begin` returns before the join is done. `watchWifi()` waits for `WL_CONNECTED` and then starts the servers exactly once.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [253, 266],
      anchor: 'void printStatus() {',
      title: 'Status and help',
      levels: ['explorer', 'deep'],
      text: {
        beginner: "`status` shows the Wi-Fi state, how many viewers are connected, and frame counts. `printHelp` lists the commands.",
        explorer: "`WiFi.RSSI()` is the signal strength in dBm: a number closer to 0 is stronger, so -50 is better than -80. `localIP().toString()` turns the address into text.",
        deep: "Printing the IP in `status` as well as at boot means you do not have to reset the board just to read it again. A quick way to debug a page that will not load: check `status` for the IP and the viewer count.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [268, 287],
      anchor: 'void runCommand(String cmd) {',
      title: 'Commands and the line reader',
      levels: ['deep'],
      text: {
        beginner: "Two commands: `status` and `targets`.",
        explorer: "The same command and line-reader pattern as in the other labs.",
        deep: "Because the commands only flip flags or print, they never block the loop that serves the page.",
      },
    },
    {
      file: 'src/main.cpp',
      lines: [289, 299],
      anchor: 'void setup() {',
      title: 'setup: radar first, then Wi-Fi',
      text: {
        beginner: "Starts the serial ports, prints which radar pins and room size are in use, and starts joining Wi-Fi. It does not wait for the join to finish.",
        explorer: "The radar port is started first, with explicit pins as before. `startWifi()` only begins the join. The program carries on and the servers start later from `loop()`.",
        deep: "Radar bytes arriving during the Wi-Fi join are buffered in the 1024-byte receive buffer and parsed the first time `loop()` runs, so nothing is lost while the board is connecting.",
      },
      guess: {
        question: 'Does `setup()` wait until Wi-Fi is connected?',
        options: [
          { text: 'No, it starts the join and moves on', right: true },
          { text: 'Yes, nothing else runs until it is joined', right: false, why: '`WiFi.begin` returns immediately. Waiting would freeze the radar for several seconds.' },
          { text: 'Yes, but only for 500 ms', right: false, why: 'The 500 ms is just a pause for the monitor, not a wait for Wi-Fi.' },
        ],
        answer: '`startWifi()` returns at once and `watchWifi()` finishes the job later, so the radar is never frozen out.',
      },
    },
    {
      file: 'src/main.cpp',
      lines: [301, 311],
      anchor: 'void loop() {',
      title: 'loop: radar, Wi-Fi watch, servers',
      text: {
        beginner: "Each pass: read your typing, feed the radar bytes to the frame finder, check whether Wi-Fi came up, and, once the servers are running, serve the page, accept new viewers and send the keep-alive.",
        explorer: "`web.handleClient()` answers any browser waiting for the page. It has to be called often or pages would never load. `acceptViewer()` picks up new stream connections. `keepAlive(now)` sends the periodic ping. Everything is non-blocking, so the radar bytes keep being read.",
        deep: "This is cooperative multitasking on one loop: each function does a short piece of work and returns. Frames are sent from inside `feedByte`, so a heavy `handleClient` call can delay them, but at ten frames a second and a small page the slack is large.",
      },
      guess: {
        question: 'What would happen if `web.handleClient()` were never called?',
        options: [
          { text: 'The page would never load, because requests are only answered inside that call', right: true },
          { text: 'The stream would stop but the page would load', right: false, why: 'The page is served by `handleClient`. The stream is separate and would still work.' },
          { text: 'Nothing, it is optional', right: false, why: '`WebServer` does not run on its own thread. It only works when `handleClient` is called.' },
        ],
        answer: '`WebServer` does its work only inside `handleClient()`. Without it, browsers connect and wait forever.',
      },
    },
  ],
};

export default tour;
