#include <Arduino.h>

const int PIN_RX2 = 16;                    // ESP32 receive pin (later: hears the radar's TX)
const int PIN_TX2 = 17;                    // ESP32 transmit pin (later: talks to the radar's RX)
const uint32_t RADAR_BAUD = 256000;        // the speed the LD2450 radar talks at
const size_t MAX_TEST = 256;               // longest message we send in one test
const uint32_t TIMEOUT_US = 200000;        // give the bytes 200 ms to come back

// One test in flight: what we sent, and what has come back so far.
struct Test {
  uint8_t sent[MAX_TEST];
  uint8_t back[MAX_TEST];
  size_t len;
  size_t got;
  size_t wrong;
  uint32_t startUs;
  bool active;
  bool isText;
};
Test test = {};

// Running totals for the "stats" command.
uint32_t totalSent = 0, totalGot = 0, totalWrong = 0;
uint32_t testsOk = 0, testsFailed = 0, strayBytes = 0;

void printHelp() {
  Serial.println("Commands: send <text> | burst | stats | help");
}

void startTest(const uint8_t *data, size_t len, bool isText) {
  while (Serial2.available()) Serial2.read();    // forget anything left over
  memcpy(test.sent, data, len);
  test.len = len;
  test.got = 0;
  test.wrong = 0;
  test.isText = isText;
  test.active = true;
  test.startUs = micros();
  Serial2.write(data, len);                      // out of GPIO 17...
  totalSent += len;
}

void finishTest(uint32_t elapsedUs) {
  test.active = false;
  totalWrong += test.wrong;
  bool ok = (test.got == test.len) && (test.wrong == 0);
  if (ok) testsOk++; else testsFailed++;

  if (test.isText && test.got > 0) {
    Serial.print("[I] back: \"");
    for (size_t i = 0; i < test.got; i++) {
      char c = (char)test.back[i];
      Serial.print((c >= 32 && c < 127) ? c : '.');
    }
    Serial.println("\"");
  }
  Serial.printf("[%s] %u of %u bytes came back, %u wrong, %lu us\n",
                ok ? "I" : "E", (unsigned)test.got, (unsigned)test.len,
                (unsigned)test.wrong, (unsigned long)elapsedUs);
  if (test.got == 0) {
    Serial.println("[E] Nothing came back. Is one jumper joining GPIO 16 and GPIO 17?");
  }
}

// Called every pass of loop(): collect the bytes that arrive on GPIO 16.
void pumpLoopback() {
  while (Serial2.available()) {                  // ...and back in through GPIO 16
    uint8_t b = Serial2.read();
    if (!test.active || test.got >= test.len) {
      strayBytes++;                              // arrived with no test waiting for it
      continue;
    }
    test.back[test.got] = b;
    if (b != test.sent[test.got]) test.wrong++;
    test.got++;
    totalGot++;
  }
  if (!test.active) return;
  uint32_t elapsed = micros() - test.startUs;
  if (test.got >= test.len || elapsed > TIMEOUT_US) finishTest(elapsed);
}

void printStats() {
  Serial.printf("[I] UART2 at %lu baud 8N1, RX GPIO %d, TX GPIO %d\n",
                (unsigned long)RADAR_BAUD, PIN_RX2, PIN_TX2);
  Serial.printf("[I] bytes sent %lu, back %lu, wrong %lu, stray %lu\n",
                (unsigned long)totalSent, (unsigned long)totalGot,
                (unsigned long)totalWrong, (unsigned long)strayBytes);
  Serial.printf("[I] tests ok %lu, failed %lu\n", (unsigned long)testsOk, (unsigned long)testsFailed);
  // Each byte is 10 bits on the wire: 1 start + 8 data + 1 stop.
  Serial.printf("[I] one byte takes about %lu us on the wire\n", (unsigned long)(10UL * 1000000UL / RADAR_BAUD));
}

void runCommand(String line) {
  line.trim();
  int sp = line.indexOf(' ');
  String name = sp < 0 ? line : line.substring(0, sp);
  String rest = sp < 0 ? "" : line.substring(sp + 1);
  name.toLowerCase();

  if (test.active) { Serial.println("[I] still waiting for the last test, try again"); return; }

  if (name == "send") {
    if (rest.length() == 0) { Serial.println("[I] send what? Try: send hello"); return; }
    size_t len = rest.length() > MAX_TEST ? MAX_TEST : rest.length();
    Serial.printf("[I] sent %u bytes: \"%s\"\n", (unsigned)len, rest.c_str());
    startTest((const uint8_t *)rest.c_str(), len, true);
  } else if (name == "burst") {
    uint8_t all[MAX_TEST];
    for (size_t i = 0; i < MAX_TEST; i++) all[i] = (uint8_t)i;   // 0x00, 0x01 ... 0xFF
    Serial.printf("[I] sent %u bytes (every value 0x00 to 0xFF)\n", (unsigned)MAX_TEST);
    startTest(all, MAX_TEST, false);
  } else if (name == "stats") {
    printStats();
  } else {
    printHelp();
  }
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
  Serial.begin(115200);                          // USB: talks to your PC (UART0)
  // Arduino-ESP32 3.x changed Serial2's default pins, so always pass them yourself.
  Serial2.setRxBufferSize(1024);                 // must come before begin()
  Serial2.begin(RADAR_BAUD, SERIAL_8N1, PIN_RX2, PIN_TX2);
  delay(500);
  Serial.printf("[I] UART2 ready: %lu baud, 8N1, RX GPIO %d, TX GPIO %d.\n",
                (unsigned long)RADAR_BAUD, PIN_RX2, PIN_TX2);
  Serial.printf("[I] Join GPIO %d to GPIO %d with one jumper wire, then type: send hello\n", PIN_RX2, PIN_TX2);
  printHelp();
  Serial.println("[I] self-test: sending \"ping\"");
  startTest((const uint8_t *)"ping", 4, true);
}

void loop() {
  readSerial();
  pumpLoopback();
}
