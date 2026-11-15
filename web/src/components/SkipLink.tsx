import type { MouseEvent } from 'react';

export function SkipLink() {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // keep the hash route intact
    const main = document.getElementById('main');
    if (main) {
      main.focus();
      main.scrollIntoView();
    }
  };
  return (
    <a className="ui-skip-link" href="#main" onClick={onClick}>
      Skip to content
    </a>
  );
}
