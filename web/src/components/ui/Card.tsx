import type { ReactNode } from 'react';
import './Card.css';

export function Card({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`ui-card${className ? ` ${className}` : ''}`}>
      {title && <h3 className="ui-card-title">{title}</h3>}
      {children}
    </section>
  );
}
