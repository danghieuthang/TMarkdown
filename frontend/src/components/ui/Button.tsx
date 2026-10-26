import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    iconOnly = false,
    leftIcon,
    rightIcon,
    loading = false,
    disabled,
    className = '',
    children,
    ...props
  },
  ref
) {
  const classNames = [
    'ui-button',
    `ui-button--${variant}`,
    `ui-button--${size}`,
    iconOnly ? 'ui-button--icon-only' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {leftIcon && <span className="ui-button-icon-left">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ui-button-icon-right">{rightIcon}</span>}
    </button>
  );
});
