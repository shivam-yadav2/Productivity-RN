import React from 'react';
import { View, ViewProps, PressableProps } from 'react-native';
import { cn } from '../../utils/cn';
import { PressableScale } from './PressableScale';

interface CardProps extends ViewProps {
  variant?: 'default' | 'flat' | 'outline' | 'interactive';
  onPress?: PressableProps['onPress'];
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  onPress,
  ...props
}) => {
  const variants = {
    default: 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4',
    flat: 'bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-4',
    outline: 'border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-transparent',
    interactive:
      'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4',
  };

  if (variant === 'interactive' || onPress) {
    return (
      <PressableScale
        className={cn(variants[variant === 'interactive' ? 'interactive' : 'default'], className)}
        onPress={onPress}
        activeScale={0.985}
        {...(props as any)}
      >
        {children}
      </PressableScale>
    );
  }

  return (
    <View className={cn(variants[variant], className)} {...props}>
      {children}
    </View>
  );
};
