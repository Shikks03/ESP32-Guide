import type { Lesson } from '../types';

// Stub only: title, one-line goal, planned. No logic and no firmware; zone logic is designed separately.
const lesson: Lesson = {
  id: "z3",
  code: "Z3",
  track: "zones",
  name: "Room empty",
  title: "Room empty",
  status: "planned",
  pitch: "Decide what the room does when nobody is in it.",
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
