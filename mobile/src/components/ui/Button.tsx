import React from 'react';
import { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { cn } from '../../utils/cn';
import { audioService } from '../../services/audioService';
import { PressableScale } from './PressableScale';

export interface ButtonProps extends Omit<PressableProps, 'onPress' | 'style'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  sound?: boolean;
  className?: string;
  /** Layout style — lands on the animated wrapper, so use this (not `flex-1`) for sizing. */
  style?: StyleProp<ViewStyle>;
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

  const baseStyles = 'flex-row items-center justify-center font-medium rounded-xl';

  const variants = {
    primary: 'bg-zinc-900 dark:bg-zinc-100',
    secondary: 'bg-zinc-100 dark:bg-zinc-800',
    outline: 'border border-zinc-300 dark:border-zinc-700',
    danger: 'bg-rose-600',
    ghost: '',
  };

  const sizes = {
    sm: 'px-3 py-1.5 gap-1.5 h-8',
    md: 'px-4 py-2 gap-2 h-10',
    lg: 'px-5 py-2.5 gap-2.5 h-12',
    icon: 'h-10 w-10 p-0',
  };

  return (
    <PressableScale
      className={cn(baseStyles, variants[variant], sizes[size], disabled && 'opacity-50', className)}
      onPress={handlePress}
      disabled={disabled}
      activeScale={0.97}
      {...props}
    >
      {children}
    </PressableScale>
  );
};

export const buttonTextColor: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white dark:text-zinc-900',
  secondary: 'text-zinc-900 dark:text-zinc-100',
  outline: 'text-zinc-800 dark:text-zinc-200',
  danger: 'text-white',
  ghost: 'text-zinc-700 dark:text-zinc-300',
};
