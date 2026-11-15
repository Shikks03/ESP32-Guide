import type { ElementType, ReactNode } from 'react';
import './MicroLabel.css';

export function MicroLabel({ children, as: Tag = 'span' }: { children: ReactNode; as?: ElementType }) {
  return <Tag className="ui-micro">{children}</Tag>;
}
