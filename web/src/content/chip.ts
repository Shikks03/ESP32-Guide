import type { ChipBlock, Citation, Claim, Stat } from './types';

/**
 * Chip content for the Datasheet page. Every number and citation here comes from
 * scratchpad/facts/facts.md (checked 2026-11-14). Section numbers are for ESP32 datasheet v5.3.
 */

const DS = 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf';
const WR = 'https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf';
const IDF_ADC = 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/adc/adc_oneshot.html';
const IDF_GPIO = 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/gpio.html';
const ARDUINO_SERIAL = 'https://github.com/espressif/arduino-esp32/blob/3.3.12/cores/esp32/HardwareSerial.h';

const ds = (section: string): Citation => ({ doc: 'ESP32 datasheet v5.3', section, url: DS });
const wr = (section: string): Citation => ({ doc: 'WROOM-32 datasheet v3.8', section, url: WR });

/** GPIOs actually broken out on the 30-pin header (BoardSvg LEFT 12 + RIGHT 13). */
export const HEADER_GPIO_COUNT = 25;

export const STATS: Stat[] = [
  { value: 2, unit: 'cores', label: 'Xtensa LX6 cores' },
  { value: 240, unit: 'MHz', label: 'Top CPU clock' },
  { value: 520, unit: 'KB', label: 'On-chip SRAM' },
  { value: 448, unit: 'KB', label: 'Boot ROM' },
  { value: 34, unit: 'GPIOs', label: 'Programmable pins on the chip', note: `${HEADER_GPIO_COUNT} on this header` },
  { value: 18, unit: 'channels', label: '12-bit ADC inputs' },
  { value: 2, unit: 'DACs', label: '8-bit analog outputs' },
  { value: 10, unit: 'pins', label: 'Capacitive touch inputs' },
  { value: 150, unit: 'Mbps', label: 'Top Wi-Fi data rate' },
  { value: 10, unit: 'µA', label: 'Deep-sleep current', note: 'chip alone, not the board' },
];

export const CLAIMS: (Claim & { marker: 'key' | 'gotcha' })[] = [
  {
    marker: 'key',
    title: 'Two cores at up to 240 MHz',
    body: 'Two 32-bit Xtensa LX6 cores run at up to 240 MHz. Some ESP32 variants have only one core (and top out at 160 MHz), but the chip on your board has two.',
    cite: ds('§4.1.1 CPU'),
  },
  {
    marker: 'gotcha',
    title: '2.4 GHz Wi-Fi only',
    body: 'Wi-Fi is 802.11 b/g/n on 2.4 GHz, up to 150 Mbps, and Bluetooth is v4.2 BR/EDR plus Bluetooth LE. It cannot see or join a 5 GHz network.',
    cite: ds('Features (Wi-Fi, Bluetooth)'),
  },
  {
    marker: 'key',
    title: 'Memory on the chip and on the module',
    body: 'The chip has 520 KB of SRAM, 448 KB of ROM and 16 KB of RTC SRAM (8 KB fast, 8 KB slow) that can keep its contents in deep sleep. The WROOM-32 module adds a 4 MB external SPI flash; its datasheet lists no PSRAM.',
    cite: ds('§4.1.2 Internal Memory'),
  },
  {
    marker: 'gotcha',
    title: 'Pins are 3.3 V, and not 5 V tolerant',
    body: 'The datasheet gives the input-high limit as VDD + 0.3 V, about 3.6 V at a 3.3 V supply, so a 5 V signal is outside what it specifies. It never prints the words "not 5 V tolerant"; that limit is the reason. The module itself runs from 3.0 to 3.6 V.',
    cite: ds('Table 5-3 DC characteristics'),
  },
  {
    marker: 'key',
    title: '34 GPIOs on the chip, fewer on the module',
    body: `The chip has 34 programmable GPIOs, but the WROOM-32 module datasheet says "up to 32", and GPIO 6 to 11 are wired to the module's flash. This 30-pin header breaks out ${HEADER_GPIO_COUNT} of them (counted from the pinout drawing, not from a datasheet).`,
    cite: wr('§1.1 Features'),
  },
  {
    marker: 'gotcha',
    title: 'Wi-Fi bursts need a real supply',
    body: 'While transmitting, the radio can draw about 240 mA (802.11b at +19.5 dBm), and the datasheet recommends a supply that can give 500 mA or more.',
    cite: ds('§5.4 Table 5-4'),
  },
];

const b = (
  id: string,
  name: string,
  family: ChipBlock['family'],
  blurb: string,
  cite?: Citation,
): ChipBlock => ({ id, name, family, blurb, cite });

export const CHIP_BLOCKS: ChipBlock[] = [
  b('cpu', 'CPU', 'System', 'Two Xtensa LX6 cores at up to 240 MHz.', ds('§4.1.1 CPU')),
  b('ulp', 'ULP coprocessor', 'System', 'A tiny coprocessor that can keep working while the main cores sleep.', ds('§4.3.2 ULP coprocessor')),
  b('pmu', 'Power modes', 'System', 'Active, light-sleep, deep-sleep and more. The datasheet lists about 10 µA in deep sleep for the chip alone, for the chip alone and not the whole board.', ds('Features (Deep-sleep)')),
  b('sram', 'SRAM', 'Memory', '520 KB of on-chip RAM for data and instructions.', ds('§4.1.2 Internal Memory')),
  b('rom', 'ROM', 'Memory', '448 KB of read-only memory for booting and core functions.', ds('§4.1.2 Internal Memory')),
  b('flash', 'Flash', 'Memory', 'The 4 MB external SPI flash on the module that holds your program. GPIO 6 to 11 talk to it.', wr('§1.1 Features')),
  b('rtc-mem', 'RTC memory', 'Memory', '8 KB fast plus 8 KB slow SRAM in the RTC domain, for data that has to survive deep sleep.', ds('§4.1.2 Internal Memory')),
  b('crypto', 'Crypto accelerators', 'Security', 'Hardware AES, SHA-2 and RSA.', ds('§4.5')),
  b('rng', 'Random number generator', 'Security', 'A hardware random number generator.', ds('Features (Security)')),
  b('efuse', 'eFuse', 'Security', 'One-time-programmable bits: 1 Kbit in total, 256 for the system and 768 for customers.', ds('§4.1.2 Internal Memory')),
  b('secure-boot', 'Secure boot', 'Security', 'Secure boot and flash encryption, which are set once in the eFuses.'),
  b('gpio', 'GPIO and matrix', 'Connectivity', '34 programmable pins on the chip. Five are strapping pins, six are input-only.', ds('§4.8.1 GPIO')),
  b('uart', 'UART', 'Connectivity', 'Three UART interfaces. UART0 is the one your USB-serial chip uses.', ds('§4.8.3 UART')),
  b('i2c', 'I2C', 'Connectivity', 'Two I2C bus interfaces.', ds('§4.8.4 I2C')),
  b('i2s', 'I2S', 'Connectivity', 'Two I2S interfaces for audio and other streams.', ds('§4.8.5 I2S')),
  b('spi', 'SPI', 'Connectivity', 'Four SPI controllers. SPI0 and SPI1 serve the flash, so two (SPI2 and SPI3) are left for your own devices.', ds('§4.8.2 SPI')),
  b('sdmmc', 'SD/MMC host', 'Connectivity', 'A host controller for up to two external cards.', ds('§4.8.10')),
  b('emac', 'Ethernet MAC', 'Connectivity', '10/100 Mbps Ethernet. It needs an external PHY chip, which this board does not have.', ds('§4.8.13')),
  b('twai', 'TWAI (CAN)', 'Connectivity', 'A CAN bus controller compatible with ISO 11898-1. It needs an external transceiver.', ds('§4.8.12')),
  b('timers', 'Timers', 'Timing', 'Four general-purpose 64-bit timers in two groups, plus an RTC timer.', ds('§4.4.1 General-purpose timers')),
  b('wdt', 'Watchdogs', 'Timing', 'Main watchdog timers in each timer group, plus an RTC watchdog.', ds('§4.4.2 Watchdog timers')),
  b('ledc', 'LED PWM', 'Timing', 'Sixteen PWM channels with up to 20-bit duty resolution.', ds('§4.8.8')),
  b('mcpwm', 'Motor control PWM', 'Timing', 'Three PWM timers, three operators and six outputs, for motors and power conversion.', ds('§4.8.9')),
  b('rmt', 'RMT', 'Timing', 'Eight channels for sending and receiving infrared remote-control style signals.', ds('§4.8.6')),
  b('pcnt', 'Pulse counter', 'Timing', 'Eight pulse counter units, each with a 16-bit signed counter.', ds('§4.8.7')),
  b('adc1', 'ADC1', 'Analog', 'Eight 12-bit channels. On the WROOM-32 they are GPIO 32, 33, 34, 35, 36 and 39, and they keep working with Wi-Fi on.', ds('§4.9.1 ADC')),
  b('adc2', 'ADC2', 'Analog', 'Ten 12-bit channels on GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26 and 27. Wi-Fi shares this ADC, so reads can fail while it runs.', ds('§4.9.1 ADC')),
  b('dac', 'DAC', 'Analog', 'Two 8-bit analog outputs on GPIO 25 and GPIO 26.', ds('§4.9.2 DAC')),
  b('touch', 'Touch sensor', 'Analog', 'Ten capacitive touch inputs. The datasheet notes it has not passed the conducted susceptibility test, so it suits limited uses.', ds('§4.9.3 Touch sensor')),
  b('wifi', 'Wi-Fi', 'Radio', '802.11 b/g/n on 2.4 GHz, up to 150 Mbps.', ds('Features (Wi-Fi)')),
  b('bt', 'Bluetooth', 'Radio', 'Bluetooth v4.2 BR/EDR and Bluetooth LE.', ds('Features (Bluetooth)')),
];

export interface FiveThing {
  title: string;
  text: string;
  cite: Citation;
  /** GPIO numbers to point at on the board drawing. */
  pins?: string[];
}

export const FIVE_THINGS: FiveThing[] = [
  {
    title: 'Five pins are read at reset, and GPIO 12 can stop boot',
    text: 'GPIO 0, 2, 5, 12 and 15 are strapping pins, sampled as the chip comes out of reset. GPIO 0 low at reset means flash mode. GPIO 12 is the nasty one: it selects the flash voltage, and if something holds it high at power-up the chip picks 1.8 V, which does not suit a 3.3 V flash, so it will not boot. Keep anything off GPIO 12.',
    cite: ds('§3 Boot Configurations, Table 3-1 and §3.2'),
    pins: ['0', '2', '5', '12', '15'],
  },
  {
    title: 'GPIO 6 to 11 belong to the flash',
    text: 'These six pins connect to the SPI flash inside the module and are "not recommended for other uses". Most 30-pin boards do not break them out, and this one does not.',
    cite: wr('Table 2, note 2'),
  },
  {
    title: 'GPIO 34, 35, 36 and 39 are input-only',
    text: 'They cannot drive an output and have no internal pull-up or pull-down, so a button on one of them needs an external resistor. The chip has two more input-only pins (37 and 38); the module does not bring them out.',
    cite: ds('§2.3.1'),
    pins: ['34', '35', '36', '39'],
  },
  {
    title: 'ADC2 can fail while Wi-Fi is on',
    text: 'The Wi-Fi driver shares ADC2, so a read can time out and return an invalid value once Wi-Fi is running. ADC2 is GPIO 0, 2, 4, 12 to 15 and 25 to 27. For analog readings with Wi-Fi on, use ADC1: GPIO 32, 33, 34, 35, 36 and 39 on this module.',
    cite: { doc: 'ESP-IDF docs: ADC', section: 'Hardware limitations', url: IDF_ADC },
    pins: ['0', '2', '4', '12', '13', '14', '15', '25', '26', '27'],
  },
  {
    title: 'GPIO 1 and 3 are the USB serial line',
    text: 'GPIO 1 and 3 are UART0 (TX0 and RX0), which a dev board wires to its USB-serial chip; that wiring is a board design, not something the chip datasheet says. Wiring to them breaks flashing and the serial monitor. The radar goes on UART2, GPIO 16 and 17, and the code passes the pins to begin() because Arduino core 3.x defaults Serial2 to GPIO 4 and 25.',
    cite: ds('Table 2-1 pin descriptions (U0TXD, U0RXD)'),
    pins: ['1', '3', '16', '17'],
  },
];

/** Extra source links used by the page. */
export const SOURCE_LINKS = { gpio: IDF_GPIO, serial: ARDUINO_SERIAL };
