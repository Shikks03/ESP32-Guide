import type { Lesson } from '../types';

// Stub only: title, one-line goal, planned. No logic and no firmware; zone logic is designed separately.
const lesson: Lesson = {
  id: "z2",
  code: "Z2",
  track: "zones",
  name: "Zone → bulb",
  title: "Zone → bulb",
  status: "planned",
  pitch: "Connect a zone to the bulb.",
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
