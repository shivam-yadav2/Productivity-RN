import React from 'react';
import { View, Pressable, ViewProps, PressableProps } from 'react-native';
import { cn } from '../../utils/cn';

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
      'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 active:border-zinc-300 dark:active:border-zinc-700 active:scale-[0.99]',
  };

  if (variant === 'interactive' || onPress) {
    return (
      <Pressable className={cn(variants[variant], className)} onPress={onPress} {...(props as any)}>
        {children}
      </Pressable>
    );
  }

  return (
    <View className={cn(variants[variant], className)} {...props}>
      {children}
    </View>
  );
};
