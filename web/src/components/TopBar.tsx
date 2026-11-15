import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ON_THE_BOARD_NOW } from '../content/bench';
import { lessonById } from '../content/lessons';
import './TopBar.css';

const icon = (children: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const TABS: { to: string; label: string; icon: ReactNode; active: (p: string) => boolean }[] = [
  {
    to: '/',
    label: 'Labs',
    icon: icon(<><path d="M9 3v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L15 9V3" /><path d="M8 3h8M7.5 14h9" /></>),
    active: (p) => p === '/' || p.startsWith('/lessons'),
  },
  {
    to: '/datasheet',
    label: 'Datasheet',
    icon: icon(<><rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>),
    active: (p) => p.startsWith('/datasheet'),
  },
  {
    to: '/log',
    label: 'Bench',
    icon: icon(<><path d="M5 4h11l3 3v13H5z" /><path d="M8 11h8M8 15h8M8 8h4" /></>),
    active: (p) => p.startsWith('/log'),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: icon(<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>),
    active: (p) => p.startsWith('/settings'),
  },
];

export function TopBar() {
  const { pathname } = useLocation();
  const labDir = lessonById(ON_THE_BOARD_NOW)?.labDir;
  const lab = labDir ? labDir.replace(/^labs\//, '') : ON_THE_BOARD_NOW;
  return (
    <header className="top-bar">
      <Link to="/" className="top-brand">
        <span className="top-mark" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" />
            <rect x="9.5" y="9.5" width="5" height="5" rx=".8" fill="var(--pcb)" />
            <path d="M9 2.5v3.5M12 2.5v3.5M15 2.5v3.5M9 18v3.5M12 18v3.5M15 18v3.5M2.5 9h3.5M2.5 12h3.5M2.5 15h3.5M18 9h3.5M18 12h3.5M18 15h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <span>
          <span className="top-eyebrow">ESP-LABS</span>
          <span className="top-name">
            ESP32 <span className="top-part">bench guide</span>
          </span>
        </span>
      </Link>
      <Link to="/log" className="top-pill">
        <span className="top-led" aria-hidden="true" />
        <span className="top-pill-label">On the board now</span>
        <b>{lab}</b>
      </Link>
      <nav className="top-sections" aria-label="Sections">
        {TABS.map((t) => (
          <Link key={t.to} to={t.to} aria-current={t.active(pathname) ? 'page' : undefined}>
            {t.icon}
            <span className="top-nav-label">{t.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
