#include <Arduino.h>

const int PIN_LED = 2;             // on-board LED
const int PIN_TOUCH = 4;           // touch pad T0: plug a jumper wire in here
const int TOUCH_THRESHOLD = 40;    // reading below this counts as "touched"

// PWM = switching the pin on and off very fast. The on-time share sets brightness.
// The LEDC calls changed between Arduino-ESP32 core 2.x and 3.x, so support both.
const int PWM_FREQ = 5000, PWM_BITS = 8, PWM_CH = 0;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  #define PWM_SETUP()  ledcAttach(PIN_LED, PWM_FREQ, PWM_BITS)
  #define PWM_WRITE(v) ledcWrite(PIN_LED, (v))
#else
  #define PWM_SETUP()  do { ledcSetup(PWM_CH, PWM_FREQ, PWM_BITS); ledcAttachPin(PIN_LED, PWM_CH); } while (0)
  #define PWM_WRITE(v) ledcWrite(PWM_CH, (v))
#endif

// A tiny state machine: one variable says what the LED is doing right now.
enum Mode { FADE, BLINK, ON, OFF, SOS };
const char *MODE_NAMES[] = { "fade", "blink", "on", "off", "sos" };
Mode mode = FADE;
int level = 255;        // max brightness, 0-255
int blinkMs = 500;
bool showTouch = false;

// SOS in Morse as alternating on/off durations (ms): ... --- ...
const uint16_t SOS_STEPS[] = { 200,200,200,200,200,600, 600,200,600,200,600,600, 200,200,200,200,200,1400 };
const int SOS_LEN = sizeof(SOS_STEPS) / sizeof(SOS_STEPS[0]);

bool sosOn(uint32_t now) {
  uint32_t total = 0;
  for (int i = 0; i < SOS_LEN; i++) total += SOS_STEPS[i];
  uint32_t t = now % total;
  for (int i = 0; i < SOS_LEN; i++) {
    if (t < SOS_STEPS[i]) return i % 2 == 0;
    t -= SOS_STEPS[i];
  }
  return false;
}

void printState() {
  Serial.printf("Now: mode=%s level=%d blink=%dms\n", MODE_NAMES[mode], level, blinkMs);
}

void printHelp() {
  Serial.println("Commands: on | off | blink [ms] | fade | sos | level <0-255> | touch | help");
}

void setMode(Mode m) {
  mode = m;
  Serial.printf("[I] mode -> %s\n", MODE_NAMES[m]);
}

void runCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  int sp = cmd.indexOf(' ');
  String name = sp < 0 ? cmd : cmd.substring(0, sp);
  int arg = sp < 0 ? -1 : cmd.substring(sp + 1).toInt();

  if (name == "on") setMode(ON);
  else if (name == "off") setMode(OFF);
  else if (name == "fade") setMode(FADE);
  else if (name == "sos") setMode(SOS);
  else if (name == "blink") { if (arg > 0) blinkMs = arg; setMode(BLINK); }
  else if (name == "level" && arg >= 0) level = constrain(arg, 0, 255);
  else if (name == "touch") { showTouch = !showTouch; Serial.printf("[I] touch printing %s\n", showTouch ? "on" : "off"); }
  else { printHelp(); }
  printState();
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

void updateLed(uint32_t now) {
  switch (mode) {
    case ON:    PWM_WRITE(level); break;
    case OFF:   PWM_WRITE(0); break;
    case BLINK: PWM_WRITE((now / blinkMs) % 2 == 0 ? level : 0); break;
    case SOS:   PWM_WRITE(sosOn(now) ? level : 0); break;
    case FADE: {                       // triangle wave, 2 s per breath
      uint32_t t = now % 2000;
      uint32_t tri = t < 1000 ? t : 2000 - t;
      PWM_WRITE(tri * level / 1000);
      break;
    }
  }
}

void setup() {
  Serial.begin(115200);
  PWM_SETUP();
  delay(500);
  Serial.printf("[I] LED on GPIO %d ready. Touch wire on GPIO %d.\n", PIN_LED, PIN_TOUCH);
  printHelp();
  printState();
}

void loop() {
  uint32_t now = millis();
  readSerial();

  int touch = touchRead(PIN_TOUCH);    // lower number = finger closer
  if (showTouch) {
    static uint32_t lastPrint = 0;
    if (now - lastPrint >= 250) { lastPrint = now; Serial.printf("touch: %d\n", touch); }
  }

  if (touch < TOUCH_THRESHOLD) PWM_WRITE(255);   // touching overrides the mode
  else updateLed(now);
}
