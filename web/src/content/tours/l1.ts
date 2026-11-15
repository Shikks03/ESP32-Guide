import type { Tour } from '../types';

/**
 * Guided tour of labs/l1-meet-bulb/commands.ps1 (laptop only, no firmware).
 * Anchors are copied from the first line of each range; the reader checks them at runtime.
 */
const tour: Tour = {
  lessonId: 'l1',
  stops: [
    {
      file: 'commands.ps1',
      lines: [1, 15],
      anchor: '# L1 Meet the bulb',
      title: 'curl.exe and the bulb\'s address',
      text: {
        beginner:
          "This script is a list of commands to run one at a time, not a program to run top to bottom. The top explains one trap, then stores your bulb's IP address in a variable called `$bulb` so you only type it once. Change the placeholder to your own address.",
        explorer:
          "In Windows PowerShell 5.1, `curl` is secretly an alias for `Invoke-WebRequest`, a different command, so the script always types `curl.exe` to get the real tool. `$bulb` is a PowerShell variable. The `arp -a` line is commented out: it only prints your laptop's own list of recently seen devices, a handy way to spot the bulb's IP, and it sends nothing to the network.",
        deep:
          "`arp -a` reads the ARP cache, the table of IP to MAC address pairs your laptop has learned recently, so the bulb only shows up if your laptop has talked to it. A Shelly MAC is also in the bulb's `id` (the part after the last dash), which helps you spot it in a router's client list. PowerShell 7 does not alias `curl` on Windows, but typing `.exe` works in both versions, so the script does not have to care which one you use.",
      },
      guess: {
        question: 'Why does every command in this file say `curl.exe` instead of `curl`?',
        answer:
          "In Windows PowerShell 5.1 `curl` is an alias for `Invoke-WebRequest`, which prints a different thing and takes different options. The `.exe` makes PowerShell run the real curl that ships with Windows.",
      },
      words: ['curl-exe', 'ps-variable'],
    },
    {
      file: 'commands.ps1',
      lines: [17, 23],
      anchor: '# 1. Who are you?',
      title: 'Shelly.GetDeviceInfo: who are you?',
      text: {
        beginner:
          "The first real call. It asks the bulb to describe itself: its id, model and firmware. The URL ends in the name of the method to run. `--max-time 5` makes curl give up after five seconds, so a wrong IP does not freeze the window.",
        explorer:
          "`/rpc/Shelly.GetDeviceInfo` is an **RPC** call: the part after `/rpc/` is `Component.Method`. The reply is JSON with fields such as `id`, `mac`, `model`, `gen`, `ver`, `app` and `auth_en`. Read `model` and `app` on your own bulb: the shop calls it \"Multicolor Bulb E27 Gen3\", the API docs call it \"RGBCCT Bulb Gen3\", and this reply is how you confirm they are the same thing. `auth_en` tells you whether a password is on. Step 1b pipes the reply through `ConvertFrom-Json | Format-List` to print one field per line.",
        deep:
          "There is no JSON parser in curl, so the first line prints raw text. The commented 1b line shows the PowerShell way: `ConvertFrom-Json` builds an object, `Format-List` prints it. `gen` should read 3 on this bulb. The docs do not show this bulb's own sample reply, so the exact `model` string and the default for `auth_en` are not confirmed; your reply is the source of truth. Keep `--max-time`: curl has no default overall timeout, so an unreachable address can otherwise sit for a long time.",
      },
      guess: {
        question: 'In `http://$bulb/rpc/Shelly.GetDeviceInfo`, what does the `Shelly.GetDeviceInfo` part mean?',
        options: [
          { text: 'The component (`Shelly`) and the method (`GetDeviceInfo`) to run on the bulb', right: true },
          {
            text: 'A file called Shelly.GetDeviceInfo on the bulb',
            right: false,
            why: 'Nothing is read from a file. The bulb runs the named method and builds the reply on the spot.',
          },
          {
            text: 'The name of the app that must be installed on your laptop',
            right: false,
            why: 'Nothing is installed. The bulb answers plain HTTP, so curl alone is enough.',
          },
        ],
        answer: "Everything after `/rpc/` is `Component.Method`. Here the component is `Shelly` (the device itself) and the method is `GetDeviceInfo`.",
      },
      words: ['rpc', 'ps-pipeline'],
    },
    {
      file: 'commands.ps1',
      lines: [25, 29],
      anchor: '# 2. What can you do?',
      title: 'Shelly.ListMethods: what can you do?',
      text: {
        beginner:
          "This asks the bulb for the list of everything it understands. You are looking for names that start with `RGBCCT.`, because that is the light. If you find them, the names used in the rest of the track are right for your bulb.",
        explorer:
          "The reply is `{\"methods\": [ ... ]}`, a list of names like `Cloud.GetStatus` and `Shelly.GetDeviceInfo`. The light's methods start with `RGBCCT.`. This is the check that matters before lab L2: the docs page and the shop disagree on the bulb's name, but the method list on your own bulb is the truth.",
        deep:
          "The docs example for this method comes from a different Shelly model, so the full list on your bulb will differ. The point is to look for `RGBCCT.Set`, `RGBCCT.Toggle` and `RGBCCT.GetStatus` in it. If your bulb exposes something else, such as a differently named light component, stop here and use the names it lists instead of the ones in the next steps.",
      },
      guess: {
        question: 'What are you hunting for in the reply to `Shelly.ListMethods`?',
        options: [
          { text: 'Method names that start with `RGBCCT.`', right: true },
          {
            text: 'The Wi-Fi password',
            right: false,
            why: 'The method list contains method names only. No credentials are in it.',
          },
          {
            text: 'The exact brightness the bulb is set to',
            right: false,
            why: 'That is the job of `RGBCCT.GetStatus`, in the next step. The list only says what you can call.',
          },
        ],
        answer: "The `RGBCCT.*` names. They prove this bulb has the light component the rest of the track uses.",
      },
    },
    {
      file: 'commands.ps1',
      lines: [31, 33],
      anchor: '# 3. What is the light doing',
      title: 'RGBCCT.GetStatus: the current state',
      text: {
        beginner:
          "Asks the light what it is doing right now: on or off, how bright, and what colour or white tone. `id=0` picks the first light, and this bulb has only one.",
        explorer:
          "The reply carries `output` (true when on), `brightness` (0 to 100), `mode` (`rgb` or `cct`), `rgb` (a list of three numbers) and `ct` (colour temperature in Kelvin). The `rgb` values mean something in `rgb` mode, and `ct` in `cct` mode. Run this one before and after each change to see what actually happened.",
        deep:
          "The status also has a `transition` object while a fade is running, and `source` and `tag` fields that say who made the last change. `id` is a required argument for every `RGBCCT` call. Reading state back is the habit to build: later, firmware that only sends commands is guessing, while firmware that reads status can check.",
      },
      guess: {
        question: 'Which field in the reply says whether the bulb is lit?',
        options: [
          { text: '`output`', right: true },
          {
            text: '`ct`',
            right: false,
            why: '`ct` is the colour temperature in Kelvin. A bulb that is off still has a `ct` value.',
          },
          {
            text: '`id`',
            right: false,
            why: '`id` is just the number of the light, 0.',
          },
        ],
        answer: "`output` is true when the light is on and false when it is off.",
      },
    },
    {
      file: 'commands.ps1',
      lines: [35, 40],
      anchor: '# 4. Turn it on as a warm white',
      title: 'RGBCCT.Set: warm white at 40 %',
      text: {
        beginner:
          "This turns the bulb on as a warm white at 40 % brightness. The part after the `?` is a list of settings joined with `&`. The whole URL is in quotes so PowerShell does not treat `&` as its own command.",
        explorer:
          "`on=true` switches it on, `brightness=40` is a percent, `ct=3000` is a colour temperature in Kelvin (low is warm, high is cool; this bulb covers 2700 to 6500), and `mode=cct` says \"use the white setting\" rather than a colour. We send `mode` every time on purpose: the docs do not say whether sending `ct` alone flips the bulb out of colour mode, so we do not rely on it. The reply to this GET is just `null`, which means it worked.",
        deep:
          "The arguments are a **query string**. RPC over GET and RPC over POST run the same method; the POST form wraps the same names in a JSON body. Two other documented arguments are worth knowing: `transition_duration` (seconds) for a smooth fade, which lab L3 uses, and `toggle_after` for a flip-back timer. There is no `white` or `temp` argument in this RPC; `temp` belongs to the older HTTP endpoint and is not available here.",
      },
      guess: {
        question: 'Why does the command include `mode=cct` even though `ct=3000` is already there?',
        options: [
          { text: 'The docs do not promise that `ct` alone switches the bulb out of colour mode, so we say it explicitly', right: true },
          {
            text: 'Without `mode`, the bulb ignores the whole request',
            right: false,
            why: 'The docs list `mode` as one of several optional arguments. The request would be accepted without it.',
          },
          {
            text: '`mode=cct` is what makes the bulb turn on',
            right: false,
            why: '`on=true` does that. `mode` only chooses white versus colour.',
          },
        ],
        answer: "`mode` is cheap to send and removes a guess. If the bulb happened to be in colour mode, `ct` on its own might do nothing visible.",
      },
      words: ['query-string'],
    },
    {
      file: 'commands.ps1',
      lines: [42, 45],
      anchor: '# 5. A colour instead',
      title: 'A colour, with the list encoded',
      text: {
        beginner:
          "For colour the bulb wants three numbers, red, green and blue, each from 0 to 255. Inside a web address, brackets and commas can be misread, so they are written as `%5B`, `%2C` and `%5D`. This one makes pure red.",
        explorer:
          "`mode=rgb` picks colour, and `rgb=[255,0,0]` is the colour. The docs show the raw brackets in the URL, but encoding them is the safe way, and the ESP32 firmware does the same thing in code. `%5B` is `[`, `%2C` is `,`, `%5D` is `]`. Curl would also treat raw `[` and `]` as a range pattern unless you add `-g`, which is another reason to encode.",
        deep:
          "Percent-encoding turns each special byte into `%` plus two hex digits of its ASCII code: `[` is 0x5B, `,` is 0x2C, `]` is 0x5D. Servers decode it before looking at the value, so the bulb sees `[255,0,0]`. Brightness is sent separately (`brightness=60`) instead of being baked into the colour numbers, so you can change one without the other.",
      },
      guess: {
        question: 'What does `%2C` stand for in the URL?',
        options: [
          { text: 'A comma', right: true },
          {
            text: 'The number 2 followed by the letter C',
            right: false,
            why: 'After a `%`, the two characters are a hex code for one character, not literal text.',
          },
          {
            text: 'A closing bracket',
            right: false,
            why: 'The closing bracket is `%5D`. `%2C` is the comma between the three numbers.',
          },
        ],
        answer: "`%2C` is hex 2C, the character code for a comma.",
      },
      words: ['url-encode'],
    },
    {
      file: 'commands.ps1',
      lines: [47, 51],
      anchor: '# 6. Flip it',
      title: 'Toggle and off',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Two small commands: one flips the light to the opposite state, the other turns it off.",
        explorer:
          "`RGBCCT.Toggle` needs only `id`. On becomes off and off becomes on, without you knowing the current state, which is handy for a button. `RGBCCT.Set` with `on=false` turns it off for sure. Use Toggle when you want a flip and Set when you want a particular result.",
        deep:
          "Toggle is not idempotent: sending it twice undoes the first. Set with `on=false` is: sending it ten times still leaves the light off. That difference matters once something retries a request after a timeout, because a retried Toggle can flip the light the wrong way.",
      },
      guess: {
        question: 'A request times out and your code sends it again. Which command is safe to retry?',
        options: [
          { text: '`RGBCCT.Set` with `on=false`, because the result is the same however often it runs', right: true },
          {
            text: '`RGBCCT.Toggle`, because it always works',
            right: false,
            why: 'If the first request did arrive, a second Toggle flips the light back, which is not what you wanted.',
          },
          {
            text: 'Neither, requests can never be repeated',
            right: false,
            why: 'Repeating a request is fine when the command has the same result each time, like Set.',
          },
        ],
        answer: "Set with a fixed target. It ends in the same state however many times it runs, which Toggle does not.",
      },
    },
    {
      file: 'commands.ps1',
      lines: [53, 54],
      anchor: '# 8. Is the bulb connected',
      title: 'Cloud.GetStatus',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Asks whether the bulb is currently connected to Shelly's cloud service. Look for `connected` in the reply.",
        explorer:
          "`Cloud.GetStatus` returns `connected`, true or false. The bulb can hold a connection to the cloud, which is how a phone app reaches it when you are away from home. Our lab rule is local-first: everything should keep working with the internet unplugged, so the next step switches that connection off.",
        deep:
          "The `Cloud` component has a config (`enable`) and a status (`connected`). Disabling it stops the bulb dialling out but does not stop the local HTTP server, which is what we use. What you lose is anything that relies on the cloud, such as controlling the bulb from outside your home through the Shelly app.",
      },
    },
    {
      file: 'commands.ps1',
      lines: [56, 68],
      anchor: '# 9. Turn the cloud connection off',
      title: 'Cloud.SetConfig: cloud off, quoted safely',
      text: {
        beginner:
          "This turns the cloud connection off so the bulb only talks on your network. The setting is a bit of JSON, which is awkward to type into PowerShell, so it is first converted into safe characters. A dry-run line prints the exact address so you can check it before sending anything.",
        explorer:
          "`[uri]::EscapeDataString('{\"enable\":false}')` turns the JSON into `%7B%22enable%22%3Afalse%7D`, text that no PowerShell version can mangle. The single quotes keep PowerShell from touching the inside. Step 9a just prints the URL it will send: read it first. Step 9b sends it. The reply has a `restart_required` field; the docs show `false` for their example, and your bulb's answer for `enable:false` may differ, so read it.",
        deep:
          "The quoting trap is real: Windows PowerShell 5.1 strips the double quotes out of a JSON string when it hands it to a native program like curl, so `'{\"enable\":false}'` arrives as `{enable:false}`. PowerShell 7 changed that behaviour, so hand-written backslash escapes that work in one version break in the other. Percent-encoding avoids the whole question. The docs only show `Cloud.SetConfig` with `enable` set to true; the disable form here is the same call with false, and 9c confirms it.",
      },
      guess: {
        question: 'Why is the JSON converted with `EscapeDataString` instead of typed straight into the command?',
        options: [
          { text: 'Typed JSON can lose its quotes on the way to curl, so it is turned into plain characters first', right: true },
          {
            text: 'The bulb refuses JSON that has not been compressed',
            right: false,
            why: 'The bulb takes normal JSON. The problem is on your laptop, between PowerShell and curl.',
          },
          {
            text: 'To keep the setting secret',
            right: false,
            why: 'Percent-encoding is not encryption. Anyone can read it back, and the request goes over plain HTTP.',
          },
        ],
        answer: "PowerShell 5.1 and 7 pass quotes to native programs differently. Percent-encoded text has no quotes in it, so it arrives exactly as written.",
      },
      words: ['ps-escape'],
    },
    {
      file: 'commands.ps1',
      lines: [70, 71],
      anchor: '# 9c. Check it took effect',
      title: 'Check that it stuck',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "Asks the cloud status again. After step 9b, `connected` should now be false.",
        explorer:
          "Never trust a setting you did not read back. This is the same call as step 8, and the only change should be the answer. If it still says true, give the bulb a few seconds and run it again.",
        deep:
          "A reply that came back fine only proves the bulb accepted the request, not that the connection closed. Reading `Cloud.GetStatus` afterwards is the check that matters. The same habit shows up later in the firmware: do something, then ask for the state.",
      },
    },
    {
      file: 'commands.ps1',
      lines: [73, 77],
      anchor: '# Alternative to 9b',
      title: 'The POST form, with the JSON in a file',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "A second way to send the same cloud-off command. It is commented out; you only need it if the first way does not work for you. The JSON goes into a file, so there is no quoting trouble.",
        explorer:
          "Everything on the bulb is reachable two ways. GET puts the arguments in the URL. POST to `/rpc` sends a JSON body of the form `{\"id\":1,\"method\":\"...\",\"params\":{...}}`. Here the body is saved to `body.json` and curl sends it with `--data \"@body.json\"`. The `@` means \"read this from a file\".",
        deep:
          "The file is written with `UTF8Encoding $false` because Windows PowerShell 5.1's `Set-Content -Encoding UTF8` adds a byte-order mark, and some JSON parsers choke on it. A POST reply also echoes your `id` and adds a `src` field with the bulb's id. A GET reply is just the result. Prefer POST when the arguments are nested or long.",
      },
    },
    {
      file: 'commands.ps1',
      lines: [79, 82],
      anchor: '# Only if step 1 showed',
      title: 'If a password is on',
      levels: ['explorer', 'deep'],
      text: {
        beginner:
          "If step 1 showed `\"auth_en\": true`, the bulb wants a password and plain calls get refused. This commented line shows the form that sends one. Skip it if `auth_en` is false.",
        explorer:
          "The docs describe authentication as something you turn on with `Shelly.SetAuth`, so it is probably off until you set it. Whether it is off by default on this bulb is not confirmed, which is why step 1 checks `auth_en`. The user name is always `admin`. Curl's `--digest` flag handles the challenge-and-response.",
        deep:
          "Shelly uses HTTP digest authentication with SHA-256. A request without credentials gets a `401` with a `WWW-Authenticate` header carrying a realm and a nonce. Recent curl builds support SHA-256 digest, but this exact line was not run against a real bulb. If you turn auth on, the ESP32 firmware in L2 and L3 would need to do the digest handshake as well, which these labs do not implement.",
      },
    },
  ],
};

export default tour;
