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
const uint32_t WIFI_TIMEOUT_MS = 15000;
const uint16_t CONNECT_TIMEOUT_MS = 2000;
const uint16_t REPLY_TIMEOUT_MS = 3000;

const int CT_MIN = 2700, CT_MAX = 6500;   // Kelvin range of this bulb

// A scene is one RGBCCT.Set call. mode picks "cct" (white) or "rgb" (colour); we always send it.
struct Scene {
  const char *name;
  const char *mode;   // "cct" or "rgb"
  int brightness;     // 0-100 %
  int ct;             // Kelvin, used when mode is "cct"
  int r, g, b;        // 0-255, used when mode is "rgb"
};

const Scene SCENES[] = {
  { "desk",   "cct", 100, 6000,   0,   0,   0 },   // bright, cool white
  { "bed",    "cct",  10, 2700,   0,   0,   0 },   // dim, warm white
  { "red",    "rgb",  60,    0, 255,   0,   0 },
  { "blue",   "rgb",  60,    0,   0,   0, 255 },
  { "purple", "rgb",  60,    0, 128,   0, 255 },
};
const int SCENE_COUNT = sizeof(SCENES) / sizeof(SCENES[0]);

int fadeSeconds = 2;   // transition_duration for every change; 0 = switch instantly

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

// Percent-encode everything except letters, digits and - _ . ~ so "[255,0,0]" travels safely in a URL.
String urlEncode(const String &s) {
  String out;
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if (isalnum((unsigned char)c) || c == '-' || c == '_' || c == '.' || c == '~') {
      out += c;
    } else {
      char hex[4];
      snprintf(hex, sizeof(hex), "%%%02X", (unsigned char)c);
      out += hex;
    }
  }
  return out;
}

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
  if (code <= 0) {
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

// "&transition_duration=N" in seconds, or nothing when fade is 0.
String fadePart() {
  return fadeSeconds > 0 ? String("&transition_duration=") + fadeSeconds : String("");
}

void applyScene(const Scene &s) {
  String q = String("id=0&on=true&mode=") + s.mode + "&brightness=" + s.brightness;
  if (strcmp(s.mode, "cct") == 0) {
    q += String("&ct=") + s.ct;
  } else {
    String rgb = String("[") + s.r + "," + s.g + "," + s.b + "]";
    q += "&rgb=" + urlEncode(rgb);
  }
  q += fadePart();
  Serial.printf("[I] scene %s\n", s.name);
  callBulb("RGBCCT.Set", q);
}

void printHelp() {
  Serial.println("Scenes:   desk | bed | red | blue | purple");
  Serial.println("Dials:    bright <0-100> | ct <2700-6500> | fade <seconds>");
  Serial.println("Basics:   on | off | toggle | status | help");
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  int sp = cmd.indexOf(' ');
  String name = sp < 0 ? cmd : cmd.substring(0, sp);
  int arg = sp < 0 ? -1 : cmd.substring(sp + 1).toInt();

  for (int i = 0; i < SCENE_COUNT; i++) {
    if (name == SCENES[i].name) { applyScene(SCENES[i]); return; }
  }
  if (name == "on") callBulb("RGBCCT.Set", "id=0&on=true" + fadePart());
  else if (name == "off") callBulb("RGBCCT.Set", "id=0&on=false" + fadePart());
  else if (name == "toggle") callBulb("RGBCCT.Toggle", "id=0");
  else if (name == "status") callBulb("RGBCCT.GetStatus", "id=0");
  else if (name == "bright" && arg >= 0) {
    arg = constrain(arg, 0, 100);
    callBulb("RGBCCT.Set", String("id=0&on=true&brightness=") + arg + fadePart());
  } else if (name == "ct" && arg >= 0) {
    arg = constrain(arg, CT_MIN, CT_MAX);
    callBulb("RGBCCT.Set", String("id=0&on=true&mode=cct&ct=") + arg + fadePart());
  } else if (name == "fade" && arg >= 0) {
    fadeSeconds = constrain(arg, 0, 30);
    Serial.printf("[I] fade is now %d s\n", fadeSeconds);
  } else printHelp();
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
  Serial.printf("[I] L3 scenes. Bulb at %s.\n", BULB_IP);
  joinWifi();
  printHelp();
}

void loop() {
  readSerial();
}
