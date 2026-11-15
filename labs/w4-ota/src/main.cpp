#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoOTA.h>

// Your Wi-Fi name, password and OTA password live in include/secrets.h, which is never shared.
// Until you create it, the placeholder file is used so the project still builds.
#if __has_include("secrets.h")
  #include "secrets.h"
#else
  #include "secrets.example.h"
#endif

const int PIN_LED = 2;                    // on-board blue LED
const char *HOSTNAME = "bench";           // OTA shows up as bench.local
const uint32_t BLINK_MS = 1000;           // change this, upload over Wi-Fi, watch the LED change
const char *FW_VERSION = "v1";            // bump this too, so the monitor tells you which build runs

bool blinking = true;
bool otaBusy = false;                     // true while a new firmware is arriving
bool otaStarted = false;
bool wasConnected = false;

bool credentialsAreReal() {
  return strcmp(WIFI_SSID, "your-2.4GHz-network") != 0;
}

bool otaPasswordIsReal() {
  return strcmp(OTA_PASSWORD, "change-me") != 0;
}

void setupOta() {
  ArduinoOTA.setHostname(HOSTNAME);       // also announces HOSTNAME.local via mDNS
  ArduinoOTA.setPassword(OTA_PASSWORD);   // the uploader must send the same password

  ArduinoOTA.onStart([]() {
    otaBusy = true;
    digitalWrite(PIN_LED, LOW);
    Serial.println("[I] OTA: new firmware incoming. Do not unplug.");
  });
  ArduinoOTA.onProgress([](unsigned int done, unsigned int total) {
    static unsigned int lastTen = 99;
    unsigned int ten = (done * 10) / total;     // 0..10, one step per 10 percent
    if (ten != lastTen) {
      lastTen = ten;
      Serial.printf("[I] OTA: %u%%\n", ten * 10);
    }
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("[I] OTA: done. Restarting into the new firmware.");
  });
  ArduinoOTA.onError([](ota_error_t error) {
    otaBusy = false;
    const char *why = "unknown";
    if (error == OTA_AUTH_ERROR) why = "wrong password";
    else if (error == OTA_BEGIN_ERROR) why = "begin failed";
    else if (error == OTA_CONNECT_ERROR) why = "connect failed";
    else if (error == OTA_RECEIVE_ERROR) why = "receive failed";
    else if (error == OTA_END_ERROR) why = "end failed";
    Serial.printf("[E] OTA error: %s\n", why);
  });
  ArduinoOTA.begin();
}

void printStatus() {
  Serial.printf("[I] firmware %s, blink %lu ms (%s)\n", FW_VERSION, BLINK_MS, blinking ? "blinking" : "LED held");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("    %s.local  IP %s  RSSI %d dBm\n", HOSTNAME, WiFi.localIP().toString().c_str(), (int)WiFi.RSSI());
  } else {
    Serial.println("    Wi-Fi: not connected");
  }
}

void printHelp() {
  Serial.println("Commands: blink | on | off | status | help");
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  if (cmd == "blink") { blinking = true; Serial.println("[I] LED blinking"); }
  else if (cmd == "on") { blinking = false; digitalWrite(PIN_LED, HIGH); Serial.println("[I] LED on"); }
  else if (cmd == "off") { blinking = false; digitalWrite(PIN_LED, LOW); Serial.println("[I] LED off"); }
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

// Start OTA the first time we are online.
void watchWifi() {
  bool up = WiFi.status() == WL_CONNECTED;
  if (up && !wasConnected) {
    Serial.printf("[I] Joined \"%s\", IP %s, RSSI %d dBm\n", WIFI_SSID, WiFi.localIP().toString().c_str(), (int)WiFi.RSSI());
    if (!otaStarted && otaPasswordIsReal()) {
      setupOta();
      otaStarted = true;
      Serial.printf("[I] OTA ready at %s.local. Upload with: pio run -d labs/w4-ota -e ota -t upload\n", HOSTNAME);
    } else if (!otaPasswordIsReal()) {
      Serial.println("[W] OTA_PASSWORD is still \"change-me\". OTA stays off until you set your own in secrets.h.");
    }
  } else if (!up && wasConnected) {
    Serial.println("[W] Lost Wi-Fi. The core keeps trying to reconnect.");
  }
  wasConnected = up;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  delay(500);
  Serial.printf("[I] W4 flash over Wi-Fi. Firmware %s.\n", FW_VERSION);
  printHelp();
  if (!credentialsAreReal()) {
    Serial.println("[W] secrets.h is missing or still has the placeholder name.");
    Serial.println("    Copy include/secrets.example.h to include/secrets.h, fill it in, upload over USB once.");
    return;
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("[I] Joining \"%s\"...\n", WIFI_SSID);
}

void loop() {
  uint32_t now = millis();
  readSerial();
  if (!credentialsAreReal()) return;
  watchWifi();
  if (otaStarted) ArduinoOTA.handle();       // listens for an upload; must run often
  if (blinking && !otaBusy) digitalWrite(PIN_LED, (now / BLINK_MS) % 2);
}
