import { useId } from 'react';
import type { HotspotId, PinUse } from '../content/types';
import './BoardSvg.css';

/* React port of boardSVG() from the original guide: same geometry, pin order and tag placement. */

type Kind = 'io' | 'in' | 'pwr' | 'gnd' | 'rst';
const LEFT: [string, Kind][] = [['EN', 'rst'], ['36', 'in'], ['39', 'in'], ['34', 'in'], ['35', 'in'], ['32', 'io'], ['33', 'io'], ['25', 'io'], ['26', 'io'], ['27', 'io'], ['14', 'io'], ['12', 'io'], ['13', 'io'], ['GND', 'gnd'], ['VIN', 'pwr']];
const RIGHT: [string, Kind][] = [['23', 'io'], ['22', 'io'], ['1', 'io'], ['3', 'io'], ['21', 'io'], ['19', 'io'], ['18', 'io'], ['5', 'io'], ['17', 'io'], ['16', 'io'], ['4', 'io'], ['2', 'io'], ['15', 'io'], ['GND', 'gnd'], ['3V3', 'pwr']];
const TOP = LEFT.slice().reverse();
const BOT = RIGHT.slice().reverse();
const X0 = 118, DX = 22.1, YT = 68, YB = 240;

/** GPIO 1, 3 = USB serial; 12 = strapping pin that can stop boot; EN = reset. */
const AVOID = new Set(['1', '3', '12', 'EN']);
/** Stay "safe GPIO" but get a tooltip. */
const STRAPPING = new Set(['2', '5', '15']);

function silk(id: string): string {
  const m: Record<string, string> = { '1': 'TX0', '3': 'RX0', '36': 'VP', '39': 'VN' };
  if (m[id]) return m[id];
  return /^\d+$/.test(id) ? 'D' + id : id;
}

function category(id: string, kind: Kind): string {
  if (kind === 'pwr') return 'power';
  if (kind === 'gnd') return 'gnd';
  if (kind === 'in') return 'input';
  if (AVOID.has(id)) return 'avoid';
  return 'safe';
}

function pinTitle(id: string, kind: Kind): string {
  const label = silk(id);
  const gpio = /^\d+$/.test(id) ? ` (GPIO ${id})` : '';
  let note = '';
  if (id === '1' || id === '3') note = ': USB serial, avoid';
  else if (id === '12') note = ': strapping pin that can stop boot, avoid';
  else if (id === 'EN') note = ': reset, avoid';
  else if (kind === 'in') note = ': input only';
  else if (STRAPPING.has(id)) note = ': strapping pin: read at reset';
  else if (kind === 'pwr') note = ': power';
  else if (kind === 'gnd') note = ': ground';
  return `${label}${gpio}${note}`;
}

const HOTSPOTS: Record<HotspotId, { x: number; y: number; w: number; h: number }[]> = {
  usb: [{ x: 16, y: 122, w: 64, h: 48 }],
  buttons: [{ x: 56, y: 84, w: 30, h: 36 }, { x: 56, y: 178, w: 30, h: 32 }],
  leds: [{ x: 204, y: 134, w: 34, h: 56 }],
  module: [{ x: 244, y: 94, w: 162, h: 126 }],
  antenna: [{ x: 404, y: 104, w: 44, h: 140 }],
  headers: [{ x: 108, y: 56, w: 330, h: 26 }, { x: 108, y: 226, w: 330, h: 26 }],
};

interface Props {
  pins: PinUse[];
  usb?: boolean;
  /** 0..1 blue D2 LED glow */
  ledLevel?: number;
  legend?: 'lesson' | 'pinout';
  highlightHotspot?: HotspotId;
  title?: string;
}

const LEGEND_ALL: { k: string; label: string }[] = [
  { k: 'used', label: 'used in this lesson' },
  { k: 'safe', label: 'safe GPIO' },
  { k: 'avoid', label: 'avoid' },
  { k: 'power', label: 'power' },
  { k: 'gnd', label: 'ground' },
  { k: 'input', label: 'input-only' },
];

export function BoardSvg({ pins, usb, ledLevel = 0, legend = 'pinout', highlightHotspot, title = 'ESP32 DevKit pinout' }: Props) {
  const uid = useId().replace(/:/g, '');
  const use = new Map(pins.map((p) => [p.pin, p]));
  const v = Math.max(0, Math.min(1, ledLevel));
  const uses = pins.map((p) => `${p.tag} on ${silk(p.pin)}`);
  if (usb) uses.push('USB-C to the laptop');
  const desc = uses.length ? `This lesson uses: ${uses.join(', ')}.` : 'This lesson uses no header pins.';

  const row = (list: [string, Kind][], y: number, labelY: number, bottom: boolean) =>
    list.map(([id, kind], i) => {
      const x = X0 + DX * i;
      const hl = use.get(id);
      let rx = 0;
      let w = 0;
      if (hl && bottom) {
        w = hl.tag.length * 6.4 + 14;
        rx = id === '2' ? x + 8 - w : x - 8;
      }
      return (
        <g key={`${bottom ? 'b' : 't'}${i}`}>
          <circle cx={x} cy={y} r={4.2} className={`ui-board-pin ui-board-pin-${hl ? 'used' : category(id, kind)}`}>
            <title>{pinTitle(id, kind)}</title>
          </circle>
          <text className="ui-board-sil" x={x} y={labelY} textAnchor="middle">
            {silk(id)}
          </text>
          {hl && (
            <>
              <circle cx={x} cy={y} r={8} className="ui-board-ring" />
              {bottom && (
                <>
                  <line className="ui-board-leader" x1={x} y1={y + 8} x2={x} y2={266} />
                  <rect x={rx} y={266} width={w} height={18} rx={5} className={`ui-board-tag${hl.signal === false ? ' ui-board-tag-dark' : ''}`} />
                  <text className={`ui-board-tagtx${hl.signal === false ? ' ui-board-tagtx-dark' : ''}`} x={rx + w / 2} y={278.5} textAnchor="middle">
                    {hl.tag}
                  </text>
                </>
              )}
            </>
          )}
        </g>
      );
    });

  const legendItems = legend === 'lesson' ? LEGEND_ALL.filter((l) => l.k !== 'avoid' && (l.k !== 'used' || pins.length > 0)) : LEGEND_ALL;

  return (
    <div className="ui-board">
      <svg viewBox="0 0 460 300" className="ui-board-svg" role="img" aria-labelledby={`${uid}t ${uid}d`}>
        <title id={`${uid}t`}>{title}</title>
        <desc id={`${uid}d`}>{desc}</desc>
        <defs>
          <filter id={`${uid}blur`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <rect x={44} y={56} width={404} height={196} rx={8} className="ui-board-pcb" />
        <path className="ui-board-ant" fill="none" d="M410 112h28v10h-28v10h28v10h-28v10h28v10h-28v10h28v10h-28v10h28v10h-28" />
        <rect x={250} y={100} width={150} height={114} rx={3} className="ui-board-mod" />
        <text className="ui-board-modtxt" x={325} y={154} textAnchor="middle" style={{ fontSize: 13 }}>ESP-32</text>
        <text className="ui-board-modtxt" x={325} y={170} textAnchor="middle">WiFi + BT SoC</text>
        <rect className="ui-board-ic" x={156} y={94} width={36} height={24} rx={2} />
        <text className="ui-board-chiptx" x={174} y={109} textAnchor="middle">3V3</text>
        <rect className="ui-board-ic" x={130} y={150} width={72} height={32} rx={2} />
        <text className="ui-board-chiptx" x={166} y={170} textAnchor="middle">CH340C</text>
        <rect className="ui-board-btn" x={62} y={90} width={18} height={14} rx={2} />
        <text className="ui-board-sil" x={71} y={117} textAnchor="middle" style={{ fontSize: 8 }}>EN</text>
        <rect className="ui-board-btn" x={62} y={190} width={18} height={14} rx={2} />
        <text className="ui-board-sil" x={71} y={184} textAnchor="middle" style={{ fontSize: 8 }}>BOOT</text>
        <circle cx={226} cy={146} r={3.2} className="ui-board-pwr-led" />
        <text className="ui-board-sil" x={220} y={149} textAnchor="end" style={{ fontSize: 8 }}>PWR</text>
        <circle cx={226} cy={178} r={8} className="ui-board-led" filter={`url(#${uid}blur)`} opacity={(v * 0.9).toFixed(3)} />
        <circle cx={226} cy={178} r={3.4} className="ui-board-led" opacity={(0.15 + v * 0.85).toFixed(3)} />
        <text className="ui-board-sil" x={220} y={181} textAnchor="end" style={{ fontSize: 8 }}>D2</text>
        <rect className={`ui-board-usb${usb ? ' ui-board-usb-hl' : ''}`} x={22} y={128} width={52} height={36} rx={7} />
        <rect x={30} y={140} width={36} height={12} rx={3} className="ui-board-usbhole" />
        {row(TOP, YT, 86, false)}
        {row(BOT, YB, 229, true)}
        {usb && (
          <>
            <line className="ui-board-leader" x1={33} y1={164} x2={33} y2={266} />
            <rect className="ui-board-tag" x={8} y={266} width={112} height={18} rx={5} />
            <text className="ui-board-tagtx" x={64} y={278.5} textAnchor="middle">Type-C to laptop</text>
          </>
        )}
        {highlightHotspot &&
          HOTSPOTS[highlightHotspot].map((r, i) => (
            <rect key={i} className="ui-board-hotspot" x={r.x} y={r.y} width={r.w} height={r.h} rx={9} />
          ))}
      </svg>
      <ul className="ui-board-legend" aria-label="Legend">
        {legendItems.map((l) => (
          <li key={l.k}>
            <i className={`ui-board-dot ui-board-dot-${l.k}`} />
            {l.label}
          </li>
        ))}
      </ul>
      <p className="ui-board-note">Labels match the printing on your board. D34, D35, VP and VN can only read. Never wire 5V to a GPIO pin.</p>
    </div>
  );
}

export default BoardSvg;
