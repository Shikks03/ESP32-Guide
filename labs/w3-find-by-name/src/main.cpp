#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>

// Your Wi-Fi name and password live in include/secrets.h, which is never shared.
// Until you create it, the placeholder file is used so the project still builds.
#if __has_include("secrets.h")
  #include "secrets.h"
#else
  #include "secrets.example.h"
#endif

const int PIN_LED = 2;                      // on-board blue LED: shows the Wi-Fi state
const char *HOSTNAME = "bench";             // the board answers to bench.local
const uint32_t REPORT_MS = 10000;           // print IP and RSSI this often
const uint32_t GIVE_UP_MS = 15000;          // offline this long: start the join over

WebServer server(80);

// These are written by the Wi-Fi event handler, which runs on a different task
// from loop(), so they are volatile: always read fresh, never cached.
volatile bool gotIp = false;                // set when the router hands us an address
volatile bool lostLink = false;             // set when the link drops
volatile int lostReason = 0;

bool connected = false;
bool serverStarted = false;
uint32_t offlineSince = 0;
uint32_t reconnects = 0;

bool credentialsAreReal() {
  return strcmp(WIFI_SSID, "your-2.4GHz-network") != 0;
}

// Called by the Wi-Fi driver whenever something happens. Keep it tiny: just set flags.
void onWifiEvent(arduino_event_id_t event, arduino_event_info_t info) {
  if (event == ARDUINO_EVENT_WIFI_STA_GOT_IP) {
    gotIp = true;
  } else if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
    lostReason = info.wifi_sta_disconnected.reason;
    lostLink = true;
  }
}

void handleRoot() {
  server.send(200, "text/html",
    "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
    "<title>bench</title><body style='font:16px system-ui;background:#0e1411;color:#e6efe9;padding:24px'>"
    "<h1>bench is up</h1><p id=s>loading</p>"
    "<script>async function t(){try{const r=await(await fetch('/status')).json();"
    "s.textContent=r.host+'.local at '+r.ip+', signal '+r.rssi+' dBm, up '+r.uptime_s+' s';}"
    "catch(e){s.textContent='lost the board';}}t();setInterval(t,2000);</script>");
}

void handleStatus() {
  String json = String("{\"host\":\"") + HOSTNAME + "\",\"ip\":\"" + WiFi.localIP().toString() +
                "\",\"rssi\":" + WiFi.RSSI() + ",\"uptime_s\":" + (millis() / 1000) + "}";
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", json);
}

void printStatus() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[I] %s.local  IP %s  RSSI %d dBm  up %lu s  reconnects %lu\n", HOSTNAME,
                  WiFi.localIP().toString().c_str(), (int)WiFi.RSSI(), millis() / 1000, reconnects);
  } else {
    Serial.printf("[W] Offline for %lu s. Trying again.\n", (millis() - offlineSince) / 1000);
  }
}

// Join (or re-join) the network from scratch.
void startJoin() {
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  offlineSince = millis();
}

void printHelp() {
  Serial.println("Commands: status | drop | help");
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  if (cmd == "status") printStatus();
  else if (cmd == "drop") {
    Serial.println("[I] Dropping the connection on purpose. Watch it come back.");
    WiFi.disconnect();
  }
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

// Runs every pass of loop(): react to the flags, keep the watchdog, report, drive the LED.
void watchWifi(uint32_t now) {
  if (gotIp) {
    gotIp = false;
    connected = true;
    if (!serverStarted) {
      server.begin();
      serverStarted = true;
    } else {
      reconnects++;
    }
    MDNS.end();                              // (re)announce the name now that we have an address
    if (MDNS.begin(HOSTNAME)) MDNS.addService("http", "tcp", 80);
    Serial.printf("[I] Online. http://%s.local  (or http://%s)  RSSI %d dBm\n", HOSTNAME,
                  WiFi.localIP().toString().c_str(), (int)WiFi.RSSI());
  }
  if (lostLink) {
    lostLink = false;
    if (connected) offlineSince = now;
    connected = false;
    Serial.printf("[W] Link lost (reason %d).\n", lostReason);
  }

  // Watchdog: the core retries by itself, but if we stay offline too long, start over.
  if (!connected && now - offlineSince >= GIVE_UP_MS) {
    Serial.println("[W] Offline too long. Joining again from scratch.");
    startJoin();
  }

  static uint32_t lastReport = 0;
  if (connected && now - lastReport >= REPORT_MS) {
    lastReport = now;
    printStatus();
  }

  // LED: steady while online, fast blink while offline.
  digitalWrite(PIN_LED, connected ? HIGH : (now / 250) % 2);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  delay(500);
  Serial.println("[I] W3 find it by name. LED steady = online, fast blink = offline.");
  printHelp();
  if (!credentialsAreReal()) {
    Serial.println("[W] secrets.h is missing or still has the placeholder name.");
    Serial.println("    Copy include/secrets.example.h to include/secrets.h, fill in your 2.4 GHz network, upload again.");
    return;
  }
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  WiFi.onEvent(onWifiEvent);
  WiFi.setHostname(HOSTNAME);                // the name your router lists this device under
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);                    // do not write the password into flash
  Serial.printf("[I] Joining \"%s\"...\n", WIFI_SSID);
  startJoin();
}

void loop() {
  uint32_t now = millis();
  readSerial();
  if (!credentialsAreReal()) return;
  watchWifi(now);
  if (serverStarted) server.handleClient();
}
