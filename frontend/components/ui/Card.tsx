import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ className, children, hover = false, glass = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border shadow-lg',
        glass ? 'glass' : 'bg-surface-elevated border-border',
        hover && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('p-6 border-b border-border', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3 className={cn('text-xl font-semibold text-foreground', className)} {...props}>
      {children}
    </h3>
  );
}
