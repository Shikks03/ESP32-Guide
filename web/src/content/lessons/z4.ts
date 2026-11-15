import type { Lesson } from '../types';

// Stub only: title, one-line goal, planned. No logic and no firmware; zone logic is designed separately.
const lesson: Lesson = {
  id: "z4",
  code: "Z4",
  track: "zones",
  name: "Demo mode",
  title: "Demo mode",
  status: "planned",
  pitch: "A mode for showing the project off.",
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
