#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

#if __has_include("secrets.h")
#include "secrets.h"
#else
#include "secrets.example.h"   // placeholders: copy it to secrets.h and fill in
#endif

const int PIN_RADAR_RX = 16;               // ESP32 RX2: hears the radar's TX pin
const int PIN_RADAR_TX = 17;               // ESP32 TX2: talks to the radar's RX pin
const uint32_t RADAR_BAUD = 256000;

const int ROOM_W_MM = 2220;                // room width, side to side
const int ROOM_D_MM = 2160;                // room depth, away from the radar
const bool FLIP_X = false;                 // set true if left and right look swapped on the page

const uint8_t HEADER[4] = { 0xAA, 0xFF, 0x03, 0x00 };
const uint8_t TAIL[2] = { 0x55, 0xCC };
const size_t FRAME_LEN = 30;
const int MAX_TARGETS = 3;

struct Target {
  bool present;
  int16_t x;                // mm, sideways from the radar
  int16_t y;                // mm, straight out from the radar
  int16_t speed;            // cm/s
  uint16_t resolution;      // mm
};

uint8_t frame[FRAME_LEN];
size_t have = 0;
uint32_t framesTotal = 0, badTails = 0;
bool showTargets = false;

WebServer web(80);                         // serves the page
WiFiServer sse(81);                        // streams the targets (Server-Sent Events)
const int MAX_VIEWERS = 3;
WiFiClient viewers[MAX_VIEWERS];
bool serversUp = false;

// The page, in one string. Everything is inline: no files, no internet.
// __W__ and __D__ are swapped for the room size before it is sent.
const char PAGE[] PROGMEM = R"rawliteral(<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Room view</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--room:#f1f1f1;--line:#8a8a8a}
@media(prefers-color-scheme:dark){:root{--bg:#111;--room:#1c1c1c;--line:#666}}
body{margin:0;padding:12px;background:var(--bg);color:CanvasText;font:15px system-ui,sans-serif}
canvas{width:100%;max-width:640px;display:block;background:var(--room);border:1px solid var(--line);border-radius:8px}
#s{font-size:13px;opacity:.75;margin:8px 0}
pre{font:13px ui-monospace,monospace;margin:8px 0}
</style></head><body>
<h1 style="font-size:18px;margin:0 0 8px">Room view</h1>
<canvas id="c" width="960"></canvas>
<div id="s">connecting...</div>
<pre id="t">no targets</pre>
<script>
const W=__W__,D=__D__,M=250,B=200,S=960/(W+2*M);
const cv=document.getElementById('c'),g=cv.getContext('2d');
cv.height=Math.round((D+M+B)*S);
const px=x=>(x+W/2+M)*S,py=y=>(D+M-y)*S;
const COL=['#e8590c','#1c7ed6','#2f9e44'];
let T=[];
function draw(){
  const fg=getComputedStyle(document.body).color;
  g.clearRect(0,0,cv.width,cv.height);
  g.strokeStyle=fg;g.fillStyle=fg;g.lineWidth=2;g.globalAlpha=.5;
  g.strokeRect(px(-W/2),py(D),W*S,D*S);
  g.setLineDash([8,8]);
  for(const a of[-1,1]){g.beginPath();g.moveTo(px(0),py(0));g.lineTo(px(a*6000*Math.sin(Math.PI/3)),py(6000*Math.cos(Math.PI/3)));g.stroke();}
  g.setLineDash([]);g.globalAlpha=1;
  g.beginPath();g.arc(px(0),py(0),9,0,7);g.fill();
  g.font='20px system-ui';g.textAlign='center';g.fillText('radar',px(0),py(0)+34);
  for(const t of T){
    const inside=Math.abs(t[1])<=W/2&&t[2]>=0&&t[2]<=D;
    const x=Math.max(-W/2-M+25,Math.min(W/2+M-25,t[1])),y=Math.max(-B+25,Math.min(D+M-25,t[2]));
    g.beginPath();g.arc(px(x),py(y),15,0,7);
    g.fillStyle=g.strokeStyle=COL[t[0]-1];g.lineWidth=3;
    if(inside)g.fill();else g.stroke();
    g.fillStyle=inside?'#fff':COL[t[0]-1];g.font='bold 18px system-ui';g.fillText(t[0],px(x),py(y)+6);
  }
}
const st=document.getElementById('s'),tx=document.getElementById('t');
const es=new EventSource('http://'+location.hostname+':81/');
es.onopen=()=>st.textContent='live';
es.onerror=()=>st.textContent='disconnected, retrying...';
es.onmessage=e=>{
  T=JSON.parse(e.data).t;draw();
  tx.textContent=T.length?T.map(t=>'target '+t[0]+'  x '+t[1]+' mm  y '+t[2]+' mm  '+t[3]+' cm/s').join('\n'):'no targets';
};
draw();
</script></body></html>)rawliteral";

int16_t decodeSigned(uint8_t lo, uint8_t hi) {
  uint16_t raw = lo | (hi << 8);                  // little-endian: low byte first
  int16_t mag = raw & 0x7FFF;
  return (raw & 0x8000) ? mag : -mag;             // top bit set = positive (not two's complement)
}

void parseFrame(const uint8_t *f, Target out[MAX_TARGETS]) {
  for (int i = 0; i < MAX_TARGETS; i++) {
    const uint8_t *p = f + 4 + i * 8;
    bool empty = true;
    for (int k = 0; k < 8; k++) if (p[k] != 0) empty = false;
    out[i].present = !empty;
    out[i].x = empty ? 0 : decodeSigned(p[0], p[1]);
    out[i].y = empty ? 0 : decodeSigned(p[2], p[3]);
    out[i].speed = empty ? 0 : decodeSigned(p[4], p[5]);
    out[i].resolution = empty ? 0 : (uint16_t)(p[6] | (p[7] << 8));
  }
}

bool haveCredentials() {
  return strcmp(WIFI_SSID, "your-2.4GHz-network") != 0;
}

int viewerCount() {
  int n = 0;
  for (int i = 0; i < MAX_VIEWERS; i++) if (viewers[i].connected()) n++;
  return n;
}

// Send one chunk of text to every viewer still connected, and drop the ones that left.
void broadcast(const char *text) {
  for (int i = 0; i < MAX_VIEWERS; i++) {
    if (!viewers[i].connected()) { viewers[i].stop(); continue; }
    viewers[i].print(text);
  }
}

// One SSE message: a line starting "data: ", then a blank line.
void sendTargets(const Target t[MAX_TARGETS]) {
  char buf[200];
  int n = snprintf(buf, sizeof(buf), "data: {\"t\":[");
  bool first = true;
  for (int i = 0; i < MAX_TARGETS; i++) {
    if (!t[i].present) continue;
    int x = FLIP_X ? -t[i].x : t[i].x;
    n += snprintf(buf + n, sizeof(buf) - n, "%s[%d,%d,%d,%d,%u]", first ? "" : ",", i + 1, x, t[i].y, t[i].speed, t[i].resolution);
    first = false;
  }
  snprintf(buf + n, sizeof(buf) - n, "]}\n\n");
  broadcast(buf);
}

void handleFrame() {
  Target t[MAX_TARGETS];
  parseFrame(frame, t);
  if (serversUp && viewerCount() > 0) sendTargets(t);
  if (showTargets) {
    Serial.printf("[%lu ms]", (unsigned long)millis());
    for (int i = 0; i < MAX_TARGETS; i++) {
      if (t[i].present) Serial.printf(" T%d x=%d y=%d v=%d |", i + 1, t[i].x, t[i].y, t[i].speed);
    }
    Serial.println();
  }
}

void feedByte(uint8_t b) {
  if (have < sizeof(HEADER)) {
    if (b == HEADER[have]) {
      frame[have++] = b;
    } else if (b == HEADER[0]) {
      frame[0] = b;
      have = 1;
    } else {
      have = 0;
    }
    return;
  }
  frame[have++] = b;
  if (have < FRAME_LEN) return;
  have = 0;
  if (frame[FRAME_LEN - 2] == TAIL[0] && frame[FRAME_LEN - 1] == TAIL[1]) {
    framesTotal++;
    handleFrame();
  } else {
    badTails++;
  }
}

void handleRoot() {
  String page(PAGE);
  page.replace("__W__", String(ROOM_W_MM));
  page.replace("__D__", String(ROOM_D_MM));
  web.send(200, "text/html", page);
}

// A browser connected to port 81: answer with an event stream and keep the socket open.
void acceptViewer() {
  WiFiClient c = sse.accept();
  if (!c) return;
  c.setTimeout(100);                              // never wait long on a slow phone
  uint32_t t0 = millis();
  while (c.connected() && millis() - t0 < 200) {  // skip the browser's request lines
    if (!c.available()) { delay(1); continue; }
    String l = c.readStringUntil('\n');
    if (l.length() <= 1) break;                   // blank line = end of the request
  }
  for (int i = 0; i < MAX_VIEWERS; i++) {
    if (viewers[i].connected()) continue;
    viewers[i].stop();
    viewers[i] = c;
    viewers[i].print("HTTP/1.1 200 OK\r\n"
                     "Content-Type: text/event-stream\r\n"
                     "Cache-Control: no-cache\r\n"
                     "Access-Control-Allow-Origin: *\r\n"   // the page comes from port 80, the stream from 81
                     "Connection: keep-alive\r\n\r\n"
                     "retry: 2000\n\n");
    Serial.printf("[I] viewer connected (%d of %d)\n", viewerCount(), MAX_VIEWERS);
    return;
  }
  c.print("HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\nAll 3 viewer slots are taken.\n");
  c.stop();
  Serial.println("[I] a fourth viewer was turned away");
}

void keepAlive(uint32_t now) {
  static uint32_t last = 0;
  if (now - last < 10000) return;
  last = now;
  broadcast(": ping\n\n");                        // a comment line: browsers ignore it, dead sockets fail on it
}

void startWifi() {
  if (!haveCredentials()) {
    Serial.println("[E] No Wi-Fi details yet. Copy include/secrets.example.h to include/secrets.h,");
    Serial.println("[E] put your 2.4 GHz network name and password in it, then upload again.");
    Serial.println("[I] The radar still works: use the targets command to see it over serial.");
    return;
  }
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("[I] Joining \"%s\"...\n", WIFI_SSID);
}

// Once the router has given us an address, start the two servers (only once).
void watchWifi() {
  if (!haveCredentials() || serversUp || WiFi.status() != WL_CONNECTED) return;
  web.on("/", handleRoot);
  web.begin();
  sse.begin();
  serversUp = true;
  Serial.printf("[I] Wi-Fi joined. IP %s, signal %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  Serial.printf("[I] Open http://%s/ on a phone or laptop on the same network.\n", WiFi.localIP().toString().c_str());
}

void printStatus() {
  if (!haveCredentials()) { Serial.println("[I] Wi-Fi: no secrets.h yet"); }
  else if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[I] Wi-Fi: \"%s\", IP %s, signal %d dBm\n", WIFI_SSID, WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("[I] Wi-Fi: not connected (still trying)");
  }
  Serial.printf("[I] viewers %d of %d, frames %lu, bad tails %lu, serial targets %s\n",
                viewerCount(), MAX_VIEWERS, (unsigned long)framesTotal, (unsigned long)badTails, showTargets ? "on" : "off");
}

void printHelp() {
  Serial.println("Commands: status | targets | help");
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  if (cmd == "status") printStatus();
  else if (cmd == "targets") { showTargets = !showTargets; Serial.printf("[I] serial targets %s\n", showTargets ? "on" : "off"); }
  else printHelp();
}

void readSerial() {
  static String line;
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (line.length()) runCommand(line);
      line = "";
    } else {
      line += c;
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial2.setRxBufferSize(1024);
  Serial2.begin(RADAR_BAUD, SERIAL_8N1, PIN_RADAR_RX, PIN_RADAR_TX);
  delay(500);
  Serial.printf("[I] Radar on UART2: RX GPIO %d, TX GPIO %d, %lu baud 8N1.\n",
                PIN_RADAR_RX, PIN_RADAR_TX, (unsigned long)RADAR_BAUD);
  Serial.printf("[I] Room %d x %d mm, radar at the bottom centre.\n", ROOM_W_MM, ROOM_D_MM);
  startWifi();
  printHelp();
}

void loop() {
  uint32_t now = millis();
  readSerial();
  while (Serial2.available()) feedByte(Serial2.read());
  watchWifi();
  if (serversUp) {
    web.handleClient();
    acceptViewer();
    keepAlive(now);
  }
}
