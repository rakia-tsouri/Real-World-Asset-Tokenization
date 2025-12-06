import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  glow = false,
  children,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20',
    secondary: 'bg-surface-elevated text-foreground hover:bg-surface-hover border border-border',
    outline: 'border border-primary text-primary bg-transparent hover:bg-primary-muted',
    danger: 'bg-danger text-white hover:bg-danger/90 shadow-lg shadow-danger/20',
    success: 'bg-success text-white hover:bg-success/90 shadow-lg shadow-success/20',
    ghost: 'bg-transparent text-foreground-muted hover:bg-surface-hover hover:text-foreground',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        glow && variant === 'primary' && 'glow-primary',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
