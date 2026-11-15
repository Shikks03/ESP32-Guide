#include <Arduino.h>

// On most 30-pin DevKit boards the blue LED sits on GPIO 2.
#ifndef PIN_LED
#define PIN_LED 2
#endif

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  delay(500);  // give the monitor a moment to attach

  Serial.println();
  Serial.println("+---------- ESP32 identity card ----------+");
  Serial.printf("| chip  %s rev %d, %d cores @ %d MHz\n",
                ESP.getChipModel(), ESP.getChipRevision(),
                ESP.getChipCores(), ESP.getCpuFreqMHz());
  Serial.printf("| flash %u MB\n", (unsigned)(ESP.getFlashChipSize() / (1024 * 1024)));
  Serial.printf("| psram %u KB (0 is normal on a WROOM-32)\n", (unsigned)(ESP.getPsramSize() / 1024));
  Serial.printf("| heap  %u KB free\n", (unsigned)(ESP.getFreeHeap() / 1024));
  Serial.printf("| mac   %012llX\n", (unsigned long long)ESP.getEfuseMac());
  Serial.printf("| sdk   %s\n", ESP.getSdkVersion());
  Serial.println("+-----------------------------------------+");
  Serial.printf("LED on GPIO %d. It should blink twice a second.\n", PIN_LED);
}

void loop() {
  // millis() = time since boot. Compare it instead of using delay(),
  // so the loop stays free to do other work later.
  static uint32_t lastToggle = 0;
  static bool ledOn = false;
  if (millis() - lastToggle >= 500) {
    lastToggle = millis();
    ledOn = !ledOn;
    digitalWrite(PIN_LED, ledOn ? HIGH : LOW);
  }
}
