import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'accent' | 'success' | 'warning' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  children?: ReactNode;
}

export function Badge({
  variant = 'accent',
  dot = false,
  pulse = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${variant} ${className}`} {...props}>
      {dot && (
        <span
          className={`ui-badge-dot ${pulse ? 'ui-badge-dot--pulse' : ''}`}
        />
      )}
      {children}
    </span>
  );
}
