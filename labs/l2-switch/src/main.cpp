#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

// Real values live in include/secrets.h (gitignored). Without it we fall back to the placeholders.
#if __has_include("secrets.h")
#include "secrets.h"
#else
#include "secrets.example.h"
#endif

const char *PLACEHOLDER_SSID = "your-2.4GHz-network";
const uint32_t WIFI_TIMEOUT_MS = 15000;   // give up joining after 15 s
const uint16_t CONNECT_TIMEOUT_MS = 2000; // bulb must answer the TCP connect within 2 s
const uint16_t REPLY_TIMEOUT_MS = 3000;   // and send its reply within 3 s

bool haveCredentials() {
  return strcmp(WIFI_SSID, PLACEHOLDER_SSID) != 0;
}

bool joinWifi() {
  if (!haveCredentials()) {
    Serial.println("[E] include/secrets.h is missing. Copy include/secrets.example.h to include/secrets.h,");
    Serial.println("    fill in WIFI_SSID, WIFI_PASS and BULB_IP, then upload again.");
    return false;
  }
  if (WiFi.status() == WL_CONNECTED) return true;
  Serial.printf("[I] joining \"%s\" ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_TIMEOUT_MS) delay(250);
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[E] could not join Wi-Fi (wrong password, or a 5 GHz-only network?)");
    return false;
  }
  Serial.printf("[I] joined, my IP %s, RSSI %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  return true;
}

// One call to the bulb: GET http://<bulb>/rpc/<method>?<query>. Prints the HTTP status and body.
bool callBulb(const String &method, const String &query) {
  if (!joinWifi()) return false;
  String url = String("http://") + BULB_IP + "/rpc/" + method;
  if (query.length()) url += "?" + query;
  Serial.printf("[I] GET %s\n", url.c_str());

  HTTPClient http;
  http.setConnectTimeout(CONNECT_TIMEOUT_MS);
  http.setTimeout(REPLY_TIMEOUT_MS);
  if (!http.begin(url)) {
    Serial.println("[E] bad URL");
    return false;
  }
  int code = http.GET();
  if (code <= 0) {   // negative = no HTTP exchange happened (timeout, refused, wrong IP)
    Serial.printf("[E] no answer: %s (check BULB_IP and that the bulb is on this network)\n", HTTPClient::errorToString(code).c_str());
    http.end();
    return false;
  }
  String body = http.getString();
  http.end();
  Serial.printf("[I] HTTP %d\n", code);
  Serial.printf("[I] reply: %s\n", body.c_str());
  return code == 200;
}

void printHelp() {
  Serial.println("Commands: on | off | toggle | status | help");
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  if (cmd == "on") callBulb("RGBCCT.Set", "id=0&on=true");
  else if (cmd == "off") callBulb("RGBCCT.Set", "id=0&on=false");
  else if (cmd == "toggle") callBulb("RGBCCT.Toggle", "id=0");
  else if (cmd == "status") callBulb("RGBCCT.GetStatus", "id=0");
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
  delay(500);
  Serial.printf("[I] L2 switch. Bulb at %s.\n", BULB_IP);
  joinWifi();
  printHelp();
}

void loop() {
  readSerial();
}
