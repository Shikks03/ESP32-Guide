#include <Arduino.h>
#include <WiFi.h>

// Your Wi-Fi name and password live in include/secrets.h, which is never shared.
// Until you create it, the placeholder file is used so the project still builds.
#if __has_include("secrets.h")
  #include "secrets.h"
#else
  #include "secrets.example.h"
#endif

const uint32_t JOIN_TIMEOUT_MS = 15000;   // give up joining after 15 s

bool joining = false;        // true while a join is in progress
uint32_t joinStarted = 0;    // millis() when the join began
uint32_t lastDot = 0;        // millis() of the last progress dot

// True once you have put a real network name in secrets.h.
bool credentialsAreReal() {
  return strcmp(WIFI_SSID, "your-2.4GHz-network") != 0;
}

void printSetupHint() {
  Serial.println("[W] secrets.h is missing or still has the placeholder name.");
  Serial.println("    Copy include/secrets.example.h to include/secrets.h, fill in your 2.4 GHz network, upload again.");
}

// The scan gives security as an enum (a list of named values), so turn it into text.
const char *encryptionName(wifi_auth_mode_t type) {
  switch (type) {
    case WIFI_AUTH_OPEN:         return "open";
    case WIFI_AUTH_WEP:          return "WEP";
    case WIFI_AUTH_WPA_PSK:      return "WPA";
    case WIFI_AUTH_WPA2_PSK:     return "WPA2";
    case WIFI_AUTH_WPA_WPA2_PSK: return "WPA/WPA2";
    case WIFI_AUTH_WPA3_PSK:     return "WPA3";
    case WIFI_AUTH_WPA2_WPA3_PSK: return "WPA2/WPA3";
    default:                     return "other";
  }
}

// RSSI is signal strength in dBm. Closer to 0 is stronger. These cut-offs are a rule of thumb.
const char *signalWord(int rssi) {
  if (rssi >= -60) return "strong";
  if (rssi >= -75) return "ok";
  return "weak";
}

const char *statusName(wl_status_t s) {
  switch (s) {
    case WL_CONNECTED:       return "connected";
    case WL_NO_SSID_AVAIL:   return "network not found";
    case WL_CONNECT_FAILED:  return "connect failed (wrong password?)";
    case WL_CONNECTION_LOST: return "connection lost";
    case WL_DISCONNECTED:    return "not connected";
    case WL_IDLE_STATUS:     return "idle";
    default:                 return "unknown";
  }
}

void scan() {
  if (joining) {
    Serial.println("[W] Busy joining. Try again in a moment.");
    return;
  }
  Serial.println("[I] Scanning... (2-3 seconds, the radio listens on each channel in turn)");
  int n = WiFi.scanNetworks();           // waits here until the scan is done
  if (n < 0) {
    Serial.println("[E] Scan failed.");
    return;
  }
  if (n == 0) {
    Serial.println("[W] No networks heard.");
    return;
  }
  Serial.printf("[I] Found %d network%s:\n", n, n == 1 ? "" : "s");
  Serial.println("  #  SSID                              RSSI  ch  band     security   signal");
  for (int i = 0; i < n; i++) {
    String ssid = WiFi.SSID(i);
    if (ssid.length() == 0) ssid = "(hidden)";
    int rssi = WiFi.RSSI(i);
    Serial.printf("%3d  %-32s  %4d  %2d  2.4 GHz  %-9s  %s\n", i + 1, ssid.c_str(), rssi,
                  (int)WiFi.channel(i), encryptionName(WiFi.encryptionType(i)), signalWord(rssi));
  }
  WiFi.scanDelete();                     // free the list the scan kept in memory
  Serial.println("[I] Only 2.4 GHz networks can show up: this chip has no 5 GHz radio.");
}

void startJoin() {
  if (!credentialsAreReal()) {
    printSetupHint();
    return;
  }
  Serial.printf("[I] Joining \"%s\"", WIFI_SSID);
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  joining = true;
  joinStarted = millis();
  lastDot = joinStarted;
}

// Called every pass of loop(): print dots while waiting, report the result once.
void updateJoin(uint32_t now) {
  if (!joining) return;
  if (WiFi.status() == WL_CONNECTED) {
    joining = false;
    Serial.println();
    Serial.printf("[I] Joined. IP %s, RSSI %d dBm, channel %d\n",
                  WiFi.localIP().toString().c_str(), (int)WiFi.RSSI(), (int)WiFi.channel());
  } else if (now - joinStarted >= JOIN_TIMEOUT_MS) {
    joining = false;
    Serial.println();
    Serial.printf("[E] Could not join in %lu s: %s\n", JOIN_TIMEOUT_MS / 1000, statusName(WiFi.status()));
    WiFi.disconnect();
  } else if (now - lastDot >= 500) {
    lastDot = now;
    Serial.print('.');
  }
}

void printStatus() {
  wl_status_t s = WiFi.status();
  Serial.printf("[I] Wi-Fi: %s\n", statusName(s));
  if (s == WL_CONNECTED) {
    Serial.printf("    network %s, channel %d\n", WiFi.SSID().c_str(), (int)WiFi.channel());
    Serial.printf("    IP %s, gateway %s\n", WiFi.localIP().toString().c_str(), WiFi.gatewayIP().toString().c_str());
    Serial.printf("    RSSI %d dBm (%s)\n", (int)WiFi.RSSI(), signalWord(WiFi.RSSI()));
  }
  Serial.printf("    board MAC %s\n", WiFi.macAddress().c_str());
}

void printHelp() {
  Serial.println("Commands: scan | join | status | help");
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  if (cmd == "scan") scan();
  else if (cmd == "join") startJoin();
  else if (cmd == "status") printStatus();
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
  WiFi.mode(WIFI_STA);        // station mode: the board joins a network, it does not make one
  delay(500);
  Serial.println("[I] W1 scan and join. Radio is in station mode.");
  if (credentialsAreReal()) {
    Serial.printf("[I] Network from secrets.h: \"%s\". Type join to connect.\n", WIFI_SSID);
  } else {
    printSetupHint();
  }
  printHelp();
}

void loop() {
  uint32_t now = millis();
  readSerial();
  updateJoin(now);
}
