import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { cn } from '../../utils/cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <View className="w-full flex flex-col gap-1.5">
        {label && (
          <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">{label}</Text>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor="#A79D8C"
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl text-sm bg-surface dark:bg-surface-dark border border-ink-300 dark:border-ink-700/80 text-ink-900 dark:text-ink-100',
            error && 'border-rose-500',
            className
          )}
          {...props}
        />
        {error ? (
          <Text className="text-xs text-rose-500 font-medium">{error}</Text>
        ) : helperText ? (
          <Text className="text-xs text-ink-500 dark:text-ink-400">{helperText}</Text>
        ) : null}
      </View>
    );
  }
);
Input.displayName = 'Input';
