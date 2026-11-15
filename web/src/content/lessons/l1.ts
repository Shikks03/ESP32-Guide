import type { Lesson } from '../types';
import commands from '../../../../labs/l1-meet-bulb/commands.ps1?raw';

const lesson: Lesson = {
  id: 'l1',
  code: 'L1',
  track: 'bulb',
  name: 'Meet the bulb',
  title: 'Meet the bulb',
  status: 'built',
  pitch: 'Talk to the Shelly bulb from your laptop first: find its IP, ask it who it is with `curl.exe`, switch it, and turn its cloud connection off. No ESP32 yet.',
  runsOn: 'laptop',
  labDir: undefined,
  onBoard: [],
  learn: ['local HTTP API', 'RPC calls', 'curl.exe vs curl', 'cloud off'],
  command: 'curl.exe "http://192.168.1.50/rpc/Shelly.GetDeviceInfo"',
  wire: null,
  steps: [
    'Screw the bulb into a lamp with the power switched off, switch on, and join it to the same Wi-Fi the ESP32 will use (**2.4 GHz**, since the ESP32 cannot join 5 GHz) with the Shelly app. Follow the quick-start that came with it, and check there which Wi-Fi band the bulb supports.',
    'Find its IP address: your router\'s client list (look for a name like `shelly...`) or the Shelly app\'s device information. If your router can do a **DHCP reservation**, reserve that address for the bulb now, so it does not change later.',
    'Open `labs/l1-meet-bulb/commands.ps1` in VS Code, replace the placeholder in `$bulb` with your IP, and paste the commands into a PowerShell window one at a time. Replace the IP in the command above too if you run it directly. Use `curl.exe`, not `curl`.',
    'Run **step 1**, `Shelly.GetDeviceInfo`. Read `model`, `app`, `gen` and `auth_en`. If `auth_en` is `true`, a password is set and plain calls will be refused.',
    'Run **step 2**, `Shelly.ListMethods`. Look for names starting with `RGBCCT.` (`RGBCCT.Set`, `RGBCCT.Toggle`, `RGBCCT.GetStatus`). That confirms your bulb has the light component the next labs use. If it lists something else, use the names it lists.',
    'Run steps 3 to 7: read the status, set a warm white at 40 %, set red, toggle, and turn it off. After each one, run **step 3** again and see what changed.',
    'Turn the cloud off with **steps 9 to 9c**. Run the dry run first and check the printed address, send the real one, then confirm `Cloud.GetStatus` shows `connected` is `false`.',
    '**Do all of this in the first week.** If the bulb is dead or the local API does not answer the way this lab expects, you want to find out while your shop\'s return window is still open (30 days is a common one, so check yours).',
  ],
  tips: [
    '**Every command times out?** Your laptop and the bulb must be on the same network. Guest networks and some router settings keep devices apart (often called client or AP isolation). Check the IP, and try the Shelly app on the same Wi-Fi as a sanity check.',
    '**`curl` prints something strange or asks about parameters?** You are in Windows PowerShell 5.1 and typed the alias. Type `curl.exe`.',
    '**The shop calls it "Multicolor Bulb E27 Gen3", the API docs call it "RGBCCT Bulb Gen3".** That is why steps 1 and 2 matter: they show what your bulb actually calls itself.',
    '**Nothing happens on a colour command?** Run step 3 and check `mode`. The commands always send `mode` explicitly for that reason.',
  ],
  warnings: [
    'The bulb runs on mains voltage. Only screw it into a normal lamp with the power off at the switch, and never open it. This guide has no 220 V wiring.',
  ],
  preview: {
    title: 'PowerShell (try the commands)',
    baud: '',
    caption: 'Illustrative replies, not from a real bulb. The field names are the ones the Shelly docs list; the values (id, mac, model, versions) are placeholders and yours will differ. Click a command to see roughly what comes back.',
    boot: [
      { text: 'PS> $bulb = "192.168.1.50"', cls: 'in' },
      { text: 'Pick a command below.', cls: 'dim' },
    ],
    commands: [
      {
        cmd: 'curl.exe "http://$bulb/rpc/Shelly.GetDeviceInfo"',
        reply: [
          { text: '{"id":"shellyrgbcctbulbg3-AABBCCDDEEFF","mac":"AABBCCDDEEFF","model":"<your model code>","gen":3,"fw_id":"<firmware id>","ver":"<version>","app":"<app name>","auth_en":false,"auth_domain":"shellyrgbcctbulbg3-AABBCCDDEEFF"}' },
          { text: 'Read model, app, gen and auth_en on your own bulb.', cls: 'hi' },
        ],
      },
      {
        cmd: 'curl.exe "http://$bulb/rpc/Shelly.ListMethods"',
        reply: [
          { text: '{"methods":["...","Cloud.GetStatus","Cloud.SetConfig","...","RGBCCT.GetStatus","RGBCCT.Set","RGBCCT.Toggle","...","Shelly.GetDeviceInfo","Shelly.ListMethods","..."]}' },
          { text: 'Shortened. Look for the RGBCCT.* names.', cls: 'hi' },
        ],
      },
      {
        cmd: 'curl.exe "http://$bulb/rpc/RGBCCT.GetStatus?id=0"',
        reply: [
          { text: '{"id":0,"output":true,"mode":"cct","brightness":40,"ct":3000}' },
          { text: 'Shortened. The real reply has more fields (rgb, source, transition, ...).', cls: 'dim' },
        ],
      },
      {
        cmd: 'curl.exe "http://$bulb/rpc/RGBCCT.Set?id=0&on=true&brightness=40&mode=cct&ct=3000"',
        reply: [{ text: 'null' }, { text: 'The docs show null as the reply to a Set sent with GET.', cls: 'dim' }],
      },
      {
        cmd: 'curl.exe "http://$bulb/rpc/RGBCCT.Toggle?id=0"',
        reply: [{ text: '(a short JSON reply; the exact fields are not shown here)', cls: 'dim' }, { text: 'The light flips: on becomes off, off becomes on.', cls: 'hi' }],
      },
      {
        cmd: 'Write-Output "http://$bulb/rpc/Cloud.SetConfig?config=$cfg"',
        reply: [
          { text: 'http://192.168.1.50/rpc/Cloud.SetConfig?config=%7B%22enable%22%3Afalse%7D' },
          { text: 'Dry run: nothing was sent to the bulb.', cls: 'hi' },
        ],
      },
      {
        cmd: 'curl.exe "http://$bulb/rpc/Cloud.GetStatus"',
        reply: [{ text: '{"connected":false}' }, { text: 'After step 9b, connected should be false.', cls: 'dim' }],
      },
    ],
  },
  pins: [],
  parts: ['shelly', 'wifi', 'phone'],
  files: [{ path: 'commands.ps1', text: commands, lang: 'powershell' }],
  chipBlocks: [],
  hotspots: [],
  extra: [
    {
      title: 'Cloud off, and why',
      body: 'This guide is local-first: the bulb is controlled from your own network, and nothing needs the internet. `Cloud.SetConfig` with `{"enable":false}` stops the bulb holding a connection to the Shelly cloud. Anything that relies on the cloud, such as controlling the bulb from outside your home, stops working. Local control keeps working. The command is sent URL-encoded because typing raw JSON into a native command from PowerShell is a quoting trap: Windows PowerShell 5.1 can drop the quotes.',
    },
  ],
  unverified: [
    'The exact `model` string and the other values `Shelly.GetDeviceInfo` returns for this bulb. The docs show a sample for a different device, so the replies in the preview are placeholders.',
    'Whether a password (`auth_en`) is off by default on this bulb. The docs only say authentication is enabled with `Shelly.SetAuth`, so check `auth_en` on your own bulb.',
    'What the bulb answers to `Cloud.SetConfig` with `enable` set to false. The docs only show `enable: true`. Read the `restart_required` field in your reply.',
    'Whether sending only `rgb` or only `ct` switches the bulb between colour and white. The docs do not say, so every command here sends `mode` too.',
    'The `curl.exe --digest` line for a password-protected bulb was not run against a real bulb.',
    'That the shop name ("Multicolor Bulb E27 Gen3") and the API page ("RGBCCT Bulb Gen3") describe the same device. Steps 1 and 2 on your own bulb are the check.',
  ],
};

export default lesson;
