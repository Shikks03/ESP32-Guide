/**
 * Line icons for the Wi-Fi & web server lessons: 32x32 viewBox, drawn as bare shapes.
 * LessonIcon wraps them in the shared <svg> (stroke 2, round caps) like the intro icons.
 */
export const ICONS_WIFI: Record<string, JSX.Element> = {
  // W1 scan & join: radio waves with a magnifier-like dot
  w1: (
    <>
      <path d="M5 13c6-6 16-6 22 0" />
      <path d="M9 17.5c4-4 10-4 14 0" />
      <path d="M13 22c2-2 4-2 6 0" />
      <circle cx="16" cy="26" r="1.6" />
    </>
  ),
  // W2 web switch: a toggle switch inside a browser window
  w2: (
    <>
      <rect x="4" y="6" width="24" height="20" rx="3" />
      <path d="M4 12h24" />
      <rect x="10" y="15.5" width="12" height="6" rx="3" />
      <circle cx="19" cy="18.5" r="1.6" />
    </>
  ),
  // W3 find it by name: a tag with an at-sign-like loop, pointing at the board
  w3: (
    <>
      <path d="M5 6h12l10 10-9 9L8 15 5 6z" transform="translate(0 1)" />
      <circle cx="11" cy="12" r="1.6" />
      <path d="M17 16.5c1-1 2.5-1 3.5 0s1 2.5 0 3.5" />
    </>
  ),
  // W4 flash over Wi-Fi: an up arrow leaving a chip, with a wave
  w4: (
    <>
      <rect x="9" y="17" width="14" height="10" rx="2" />
      <path d="M13 27v2M19 27v2" />
      <path d="M16 15V5M12 9l4-4 4 4" />
      <path d="M8 12c-2-1-2-4 0-5M24 12c2-1 2-4 0-5" />
    </>
  ),
};
