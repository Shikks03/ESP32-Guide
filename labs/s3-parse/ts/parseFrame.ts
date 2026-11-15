// LD2450 frame parser in TypeScript. Same rule as src/main.cpp, so you can compare them.
// Try it in a .ts file, the TypeScript playground, or with `npx tsx parseFrame.ts`.

export interface Target {
  x: number;           // mm, sideways from the radar
  y: number;           // mm, straight out from the radar
  speed: number;       // cm/s
  resolution: number;  // mm, size of one distance gate
}

const HEADER = [0xaa, 0xff, 0x03, 0x00];
const TAIL = [0x55, 0xcc];
const FRAME_LEN = 30;

// The sign rule from the protocol document: top bit set = positive, clear = negative,
// the other 15 bits are the size. This is NOT two's complement.
export function decodeSigned(lo: number, hi: number): number {
  const raw = lo | (hi << 8); // little-endian: low byte first
  const mag = raw & 0x7fff;
  return raw & 0x8000 ? mag : 0 - mag; // "0 - mag", not "-mag", so a zero never becomes -0
}

/** Returns 3 slots (a Target, or null for "no target"), or null if this is not a good frame. */
export function parseFrame(bytes: Uint8Array): (Target | null)[] | null {
  if (bytes.length !== FRAME_LEN) return null;
  if (HEADER.some((b, i) => bytes[i] !== b)) return null;
  if (bytes[28] !== TAIL[0] || bytes[29] !== TAIL[1]) return null;

  const targets: (Target | null)[] = [];
  for (let i = 0; i < 3; i++) {
    const p = 4 + i * 8; // each target block is 8 bytes
    const block = bytes.subarray(p, p + 8);
    if (block.every((b) => b === 0)) {
      targets.push(null); // all zero = no target
      continue;
    }
    targets.push({
      x: decodeSigned(block[0], block[1]),
      y: decodeSigned(block[2], block[3]),
      speed: decodeSigned(block[4], block[5]),
      resolution: block[6] | (block[7] << 8),
    });
  }
  return targets;
}

// The official example frame from the protocol document.
const official = Uint8Array.from([
  0xaa, 0xff, 0x03, 0x00,
  0x0e, 0x03, 0xb1, 0x86, 0x10, 0x00, 0x40, 0x01,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x55, 0xcc,
]);

console.log(parseFrame(official));
// [ { x: -782, y: 1713, speed: -16, resolution: 320 }, null, null ]
