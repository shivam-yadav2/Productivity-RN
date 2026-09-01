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
    default: 'bg-surface dark:bg-surface-dark border border-ink-100/80 dark:border-ink-800/80 rounded-3xl p-4',
    flat: 'bg-ink-50 dark:bg-surface-dark/60 border border-ink-100/60 dark:border-ink-800/60 rounded-3xl p-4',
    outline: 'border border-ink-100 dark:border-ink-800 rounded-3xl p-4 bg-transparent',
    interactive:
      'bg-surface dark:bg-surface-dark border border-ink-100/80 dark:border-ink-800/80 rounded-3xl p-4',
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
