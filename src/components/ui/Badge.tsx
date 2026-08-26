import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  size = 'sm',
}) => {
  const variants = {
    default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
    success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    danger: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    outline: 'border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-md whitespace-nowrap',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md whitespace-nowrap',
  };

  return (
    <span className={cn('inline-flex items-center gap-1', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};
