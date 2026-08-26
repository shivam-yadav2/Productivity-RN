import React from 'react';
import { View, Text } from 'react-native';
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
    default: {
      wrap: 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
      text: 'text-zinc-700 dark:text-zinc-300',
    },
    success: {
      wrap: 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    danger: {
      wrap: 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
    },
    warning: {
      wrap: 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
    },
    info: {
      wrap: 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
    },
    outline: {
      wrap: 'border border-zinc-300 dark:border-zinc-700',
      text: 'text-zinc-600 dark:text-zinc-400',
    },
  };

  const sizes = {
    sm: { wrap: 'px-2 py-0.5 rounded-md', text: 'text-[11px] font-medium' },
    md: { wrap: 'px-2.5 py-1 rounded-md', text: 'text-xs font-medium' },
  };

  return (
    <View className={cn('flex-row items-center self-start', variants[variant].wrap, sizes[size].wrap, className)}>
      <Text className={cn(variants[variant].text, sizes[size].text)}>{children}</Text>
    </View>
  );
};
