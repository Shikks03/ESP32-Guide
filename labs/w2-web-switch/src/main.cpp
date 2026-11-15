#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

// Your Wi-Fi name and password live in include/secrets.h, which is never shared.
// Until you create it, the placeholder file is used so the project still builds.
#if __has_include("secrets.h")
  #include "secrets.h"
#else
  #include "secrets.example.h"
#endif

const int PIN_LED = 2;            // on-board blue LED

WebServer server(80);             // a web server on port 80, the normal web port
bool ledOn = false;
bool serverStarted = false;
bool wasConnected = false;

// The whole web page lives inside the firmware. No internet needed to show it.
const char PAGE[] = R"HTML(<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bench switch</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e1411;color:#e6efe9;font:16px system-ui,sans-serif}
main{text-align:center;padding:24px}
button{width:min(70vw,260px);aspect-ratio:1;border-radius:50%;border:6px solid #2b3a31;background:#18221c;color:#8fa497;font:700 28px system-ui;cursor:pointer}
button.on{background:#1f6f43;border-color:#3ddc84;color:#fff}
p{color:#8fa497}
</style></head><body><main>
<h1>Bench switch</h1>
<button id="b">...</button>
<p id="m">connecting</p>
</main>
<script>
const b=document.getElementById('b'),m=document.getElementById('m');
let on=false;
function show(s){on=s.on;b.className=on?'on':'';b.textContent=on?'ON':'OFF';m.textContent='LED on GPIO 2 is '+(on?'on':'off');}
async function call(url){try{const r=await fetch(url);show(await r.json());}catch(e){m.textContent='lost the board, retrying';}}
b.onclick=()=>call('/led?on='+(on?0:1));
call('/state');setInterval(()=>call('/state'),2000);
</script></body></html>
)HTML";

bool credentialsAreReal() {
  return strcmp(WIFI_SSID, "your-2.4GHz-network") != 0;
}

void setLed(bool on) {
  ledOn = on;
  digitalWrite(PIN_LED, on ? HIGH : LOW);
  Serial.printf("[I] LED %s\n", on ? "on" : "off");
}

void sendState() {
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", ledOn ? "{\"on\":true}" : "{\"on\":false}");
}

void handleRoot() {
  server.send(200, "text/html", PAGE);
}

// GET /led?on=1 turns the LED on, /led?on=0 turns it off. The reply is the new state.
void handleLed() {
  if (!server.hasArg("on")) {
    server.send(400, "text/plain", "use /led?on=1 or /led?on=0");
    return;
  }
  setLed(server.arg("on") == "1");
  sendState();
}

void handleNotFound() {
  server.send(404, "text/plain", "not found");
}

void printAddress() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[I] Open http://%s/ on a phone on the same Wi-Fi. RSSI %d dBm\n",
                  WiFi.localIP().toString().c_str(), (int)WiFi.RSSI());
  } else {
    Serial.println("[W] Not on Wi-Fi yet.");
  }
}

void printHelp() {
  Serial.println("Commands: on | off | ip | help");
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  if (cmd == "on") setLed(true);
  else if (cmd == "off") setLed(false);
  else if (cmd == "ip") printAddress();
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

// Watch the connection: announce when we get on or drop off, start the server the first time.
void watchWifi(uint32_t now) {
  bool up = WiFi.status() == WL_CONNECTED;
  if (up && !wasConnected) {
    Serial.printf("[I] Joined \"%s\".\n", WIFI_SSID);
    if (!serverStarted) {
      server.begin();
      serverStarted = true;
      Serial.println("[I] Web server started on port 80.");
    }
    printAddress();
  } else if (!up && wasConnected) {
    Serial.println("[W] Lost Wi-Fi. The core keeps trying to reconnect.");
  } else if (!up && credentialsAreReal()) {
    static uint32_t lastNote = 0;
    if (now - lastNote >= 5000) {
      lastNote = now;
      Serial.println("[I] Still trying to join...");
    }
  }
  wasConnected = up;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);
  delay(500);
  Serial.println("[I] W2 web switch. LED on GPIO 2 is off.");
  server.on("/", handleRoot);
  server.on("/led", handleLed);
  server.on("/state", sendState);
  server.onNotFound(handleNotFound);
  printHelp();
  if (!credentialsAreReal()) {
    Serial.println("[W] secrets.h is missing or still has the placeholder name.");
    Serial.println("    Copy include/secrets.example.h to include/secrets.h, fill in your 2.4 GHz network, upload again.");
    return;
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("[I] Joining \"%s\"...\n", WIFI_SSID);
}

void loop() {
  uint32_t now = millis();
  readSerial();
  if (credentialsAreReal()) watchWifi(now);
  if (serverStarted) server.handleClient();   // answer any browser that is waiting
}
