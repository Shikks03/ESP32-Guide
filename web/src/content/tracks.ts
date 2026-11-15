import type { Track } from './types';

export const TRACKS: Track[] = [
  {
    id: 'intro',
    title: 'Intro',
    short: 'Intro',
    blurb: 'Set up the tools, blink the LED and wire your first circuit.',
    lessonIds: ['00', '01', '02'],
  },
  {
    id: 'wifi',
    title: 'Wi-Fi & web server',
    short: 'Wi-Fi',
    blurb: 'Join your network, serve a page and update the board without a cable.',
    lessonIds: ['w1', 'w2', 'w3', 'w4'],
  },
  {
    id: 'radar',
    title: 'Serial & radar',
    short: 'Radar',
    blurb: 'Talk over UART, read the HLK-LD2450 and watch targets move.',
    lessonIds: ['s1', 's2', 's3', 's4'],
  },
  {
    id: 'bulb',
    title: 'Smart bulb',
    short: 'Bulb',
    blurb: 'Control the Shelly bulb over local HTTP, no cloud.',
    lessonIds: ['l1', 'l2', 'l3'],
  },
  {
    id: 'zones',
    title: 'Zones',
    short: 'Zones',
    blurb: 'The capstone: split the room into zones and drive the bulb from them.',
    lessonIds: ['z1', 'z2', 'z3', 'z4'],
  },
];

export const trackById = (id: string): Track | undefined => TRACKS.find((t) => t.id === id);
