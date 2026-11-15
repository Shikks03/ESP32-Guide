#include <Arduino.h>

const int PIN_RADAR_RX = 16;               // ESP32 RX2: hears the radar's TX pin
const int PIN_RADAR_TX = 17;               // ESP32 TX2: talks to the radar's RX pin
const uint32_t RADAR_BAUD = 256000;

const uint8_t HEADER[4] = { 0xAA, 0xFF, 0x03, 0x00 };
const uint8_t TAIL[2] = { 0x55, 0xCC };
const size_t FRAME_LEN = 30;
const int MAX_TARGETS = 3;

// The official example frame from the LD2450 protocol document (one target, 2 and 3 empty).
const uint8_t OFFICIAL[FRAME_LEN] = {
  0xAA, 0xFF, 0x03, 0x00,
  0x0E, 0x03, 0xB1, 0x86, 0x10, 0x00, 0x40, 0x01,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x55, 0xCC
};

struct Target {
  bool present;
  int16_t x;                // mm, sideways from the radar
  int16_t y;                // mm, straight out from the radar
  int16_t speed;            // cm/s
  uint16_t resolution;      // mm, size of one distance gate
};

uint8_t frame[FRAME_LEN];
size_t have = 0;
uint32_t framesTotal = 0, badTails = 0, framesWithTarget = 0;
int maxSeen = 0;
int lastCount = -1;                        // how many targets the last frame had
int every = 2;                             // print every Nth frame (10 frames/s / 2 = 5 lines/s)

// The sign rule, exactly as the protocol document writes it: the top bit set means
// positive, clear means negative, and the other 15 bits are the size. This is NOT
// two's complement.
int16_t decodeSigned(uint8_t lo, uint8_t hi) {
  uint16_t raw = lo | (hi << 8);                  // little-endian: low byte first
  int16_t mag = raw & 0x7FFF;
  return (raw & 0x8000) ? mag : -mag;
}

// Turn one good 30-byte frame into three Target structs.
void parseFrame(const uint8_t *f, Target out[MAX_TARGETS]) {
  for (int i = 0; i < MAX_TARGETS; i++) {
    const uint8_t *p = f + 4 + i * 8;             // each target block is 8 bytes
    bool empty = true;
    for (int k = 0; k < 8; k++) if (p[k] != 0) empty = false;

    out[i].present = !empty;
    out[i].x = empty ? 0 : decodeSigned(p[0], p[1]);
    out[i].y = empty ? 0 : decodeSigned(p[2], p[3]);
    out[i].speed = empty ? 0 : decodeSigned(p[4], p[5]);
    out[i].resolution = empty ? 0 : (uint16_t)(p[6] | (p[7] << 8));
  }
}

void printHelp() {
  Serial.println("Commands: every <n> | test | stats | help");
}

void printTargets(const Target t[MAX_TARGETS]) {
  Serial.printf("[%lu ms]", (unsigned long)millis());
  for (int i = 0; i < MAX_TARGETS; i++) {
    if (t[i].present) {
      Serial.printf(" T%d x=%d mm y=%d mm v=%d cm/s res=%u mm |", i + 1, t[i].x, t[i].y, t[i].speed, t[i].resolution);
    } else {
      Serial.printf(" T%d none |", i + 1);
    }
  }
  Serial.println();
}

// Parse the official frame and check the answer we know it must give.
bool selfTest() {
  Target t[MAX_TARGETS];
  parseFrame(OFFICIAL, t);
  Serial.printf("[I] self-test on the official example frame: x=%d y=%d v=%d res=%u, T2 %s, T3 %s\n",
                t[0].x, t[0].y, t[0].speed, t[0].resolution,
                t[1].present ? "present" : "none", t[2].present ? "present" : "none");
  bool ok = t[0].present && t[0].x == -782 && t[0].y == 1713 && t[0].speed == -16 &&
            t[0].resolution == 320 && !t[1].present && !t[2].present;
  Serial.println(ok ? "[I] parser OK (expected x=-782 y=1713 v=-16 res=320)" : "[E] parser WRONG (expected x=-782 y=1713 v=-16 res=320)");
  return ok;
}

void handleFrame() {
  Target t[MAX_TARGETS];
  parseFrame(frame, t);

  int count = 0;
  for (int i = 0; i < MAX_TARGETS; i++) if (t[i].present) count++;
  if (count > maxSeen) maxSeen = count;
  if (count > 0) framesWithTarget++;

  if (count == 0) {
    if (lastCount != 0) printTargets(t);          // say "none" once, not ten times a second
  } else if (framesTotal % every == 0) {
    printTargets(t);
  }
  lastCount = count;
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

void printStats() {
  Serial.printf("[I] frames %lu, with a target %lu, bad tails %lu, most targets at once %d\n",
                (unsigned long)framesTotal, (unsigned long)framesWithTarget, (unsigned long)badTails, maxSeen);
  Serial.printf("[I] printing every %d frame(s)\n", every);
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  int sp = cmd.indexOf(' ');
  String name = sp < 0 ? cmd : cmd.substring(0, sp);
  int arg = sp < 0 ? -1 : cmd.substring(sp + 1).toInt();

  if (name == "every" && arg > 0) { every = constrain(arg, 1, 100); Serial.printf("[I] printing every %d frame(s)\n", every); }
  else if (name == "test") selfTest();
  else if (name == "stats") printStats();
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
  selfTest();
  printHelp();
}

void loop() {
  readSerial();
  while (Serial2.available()) feedByte(Serial2.read());
}
