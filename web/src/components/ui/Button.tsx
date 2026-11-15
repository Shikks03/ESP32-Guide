import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface Props {
  variant?: 'primary' | 'outline' | 'ghost';
  href?: string;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = 'outline',
  href,
  children,
  className,
  ...rest
}: Props & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Props>) {
  const cls = `ui-btn ui-btn-${variant}${className ? ` ${className}` : ''}`;
  if (href) {
    return (
      <a className={cls} href={href}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
