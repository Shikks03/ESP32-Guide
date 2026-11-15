#include <Arduino.h>

const int PIN_RADAR_RX = 16;               // ESP32 RX2: hears the radar's TX pin
const int PIN_RADAR_TX = 17;               // ESP32 TX2: talks to the radar's RX pin
const uint32_t RADAR_BAUD = 256000;

// A radar frame: header, three 8-byte target blocks, tail. 4 + 24 + 2 = 30 bytes.
const uint8_t HEADER[4] = { 0xAA, 0xFF, 0x03, 0x00 };
const uint8_t TAIL[2] = { 0x55, 0xCC };
const size_t FRAME_LEN = 30;

uint8_t frame[FRAME_LEN];
size_t have = 0;                           // bytes of the current frame collected so far

uint32_t bytesTotal = 0, framesTotal = 0, badTails = 0;
uint32_t windowFrames = 0, windowBytes = 0, windowStart = 0;
uint32_t lastByteMs = 0;
bool showFrames = true;
bool showRaw = false;

void printHelp() {
  Serial.println("Commands: frames | raw | stats | reset | help");
}

void printFrame() {
  Serial.printf("[%lu ms] frame #%lu:", (unsigned long)millis(), (unsigned long)framesTotal);
  for (size_t i = 0; i < FRAME_LEN; i++) Serial.printf(" %02X", frame[i]);
  Serial.println();
}

// Feed the bytes in one at a time. Hunt for the header, then collect 30 bytes in total.
void feedByte(uint8_t b) {
  if (have < sizeof(HEADER)) {                    // still looking for AA FF 03 00
    if (b == HEADER[have]) {
      frame[have++] = b;
    } else if (b == HEADER[0]) {
      frame[0] = b;                               // a fresh AA: start over from here
      have = 1;
    } else {
      have = 0;
    }
    return;
  }

  frame[have++] = b;
  if (have < FRAME_LEN) return;
  have = 0;                                       // a whole frame: check its tail

  if (frame[FRAME_LEN - 2] == TAIL[0] && frame[FRAME_LEN - 1] == TAIL[1]) {
    framesTotal++;
    windowFrames++;
    if (showFrames) printFrame();
  } else {
    badTails++;
    Serial.printf("[E] bad tail: %02X %02X (wanted 55 CC)\n", frame[FRAME_LEN - 2], frame[FRAME_LEN - 1]);
  }
}

void readRadar() {
  static int rawColumn = 0;
  while (Serial2.available()) {
    uint8_t b = Serial2.read();
    bytesTotal++;
    windowBytes++;
    lastByteMs = millis();
    if (showRaw) {
      Serial.printf("%02X ", b);
      if (++rawColumn == 16) { Serial.println(); rawColumn = 0; }
    }
    feedByte(b);
  }
}

// Every 2 seconds: how many frames arrived, or what to check if nothing did.
void reportRate(uint32_t now) {
  if (now - windowStart < 2000) return;
  float secs = (now - windowStart) / 1000.0f;
  if (windowBytes == 0) {
    Serial.println("[E] No bytes from the radar. Check: radar TX -> GPIO 16, radar RX -> GPIO 17, 5V -> VIN, GND -> GND.");
  } else {
    Serial.printf("[I] %lu frames in %.0f s (%.1f per second), %lu bad tails, %lu bytes\n",
                  (unsigned long)windowFrames, secs, windowFrames / secs,
                  (unsigned long)badTails, (unsigned long)windowBytes);
  }
  windowFrames = 0;
  windowBytes = 0;
  windowStart = now;
}

void printStats() {
  Serial.printf("[I] bytes %lu, frames %lu, bad tails %lu, last byte %lu ms ago\n",
                (unsigned long)bytesTotal, (unsigned long)framesTotal, (unsigned long)badTails,
                (unsigned long)(lastByteMs ? millis() - lastByteMs : 0));
  Serial.printf("[I] frame printing %s, raw bytes %s\n", showFrames ? "on" : "off", showRaw ? "on" : "off");
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  if (cmd == "frames") { showFrames = !showFrames; Serial.printf("[I] frame printing %s\n", showFrames ? "on" : "off"); }
  else if (cmd == "raw") { showRaw = !showRaw; Serial.printf("\n[I] raw bytes %s\n", showRaw ? "on" : "off"); }
  else if (cmd == "stats") printStats();
  else if (cmd == "reset") { bytesTotal = framesTotal = badTails = 0; Serial.println("[I] counters cleared"); }
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
  Serial.begin(115200);                           // USB, to your PC
  // Pins passed on purpose: Arduino-ESP32 3.x no longer defaults Serial2 to 16/17.
  Serial2.setRxBufferSize(1024);
  Serial2.begin(RADAR_BAUD, SERIAL_8N1, PIN_RADAR_RX, PIN_RADAR_TX);
  delay(500);
  Serial.printf("[I] Radar on UART2: RX GPIO %d, TX GPIO %d, %lu baud 8N1.\n",
                PIN_RADAR_RX, PIN_RADAR_TX, (unsigned long)RADAR_BAUD);
  Serial.println("[I] Looking for frames: header AA FF 03 00, 30 bytes, tail 55 CC.");
  printHelp();
  windowStart = millis();
}

void loop() {
  readSerial();
  readRadar();
  reportRate(millis());
}
