import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { cn } from '../../utils/cn';
import { audioService } from '../../services/audioService';

export interface ButtonProps extends Omit<PressableProps, 'onPress'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  sound?: boolean;
  className?: string;
  children?: React.ReactNode;
  onPress?: PressableProps['onPress'];
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  sound = true,
  onPress,
  disabled,
  ...props
}) => {
  const handlePress: PressableProps['onPress'] = (e) => {
    if (sound && !disabled) {
      audioService.playSoftClick();
    }
    onPress?.(e);
  };

  const baseStyles = 'flex-row items-center justify-center font-medium rounded-xl active:scale-[0.98]';

  const variants = {
    primary: 'bg-zinc-900 active:bg-zinc-800 dark:bg-zinc-100 dark:active:bg-white',
    secondary: 'bg-zinc-100 active:bg-zinc-200 dark:bg-zinc-800 dark:active:bg-zinc-700',
    outline: 'border border-zinc-300 dark:border-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-800',
    danger: 'bg-rose-600 active:bg-rose-700 dark:active:bg-rose-500',
    ghost: 'active:bg-zinc-100 dark:active:bg-zinc-800/80',
  };

  const sizes = {
    sm: 'px-3 py-1.5 gap-1.5 h-8',
    md: 'px-4 py-2 gap-2 h-10',
    lg: 'px-5 py-2.5 gap-2.5 h-12',
    icon: 'h-10 w-10 p-0',
  };

  return (
    <Pressable
      className={cn(baseStyles, variants[variant], sizes[size], disabled && 'opacity-50', className)}
      onPress={handlePress}
      disabled={disabled}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export const buttonTextColor: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white dark:text-zinc-900',
  secondary: 'text-zinc-900 dark:text-zinc-100',
  outline: 'text-zinc-800 dark:text-zinc-200',
  danger: 'text-white',
  ghost: 'text-zinc-700 dark:text-zinc-300',
};
