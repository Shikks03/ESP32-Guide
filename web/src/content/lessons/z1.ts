import type { Lesson } from '../types';

// Stub only: title, one-line goal, planned. No logic and no firmware; zone logic is designed separately.
const lesson: Lesson = {
  id: "z1",
  code: "Z1",
  track: "zones",
  name: "Draw the zones",
  title: "Draw the zones",
  status: "planned",
  pitch: "Mark out the desk and bed zones on the room view.",
  runsOn: "board",
  labDir: undefined,
  onBoard: [],
  learn: [],
  command: null,
  wire: null,
  steps: [],
  tips: [],
  preview: { title: '', baud: '', caption: '', boot: [] },
  pins: [],
  parts: [],
  files: [],
  chipBlocks: [],
  hotspots: [],
};

export default lesson;
