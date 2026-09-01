import React, { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { Modal } from './Modal';
import { cn } from '../../utils/cn';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

/** RN has no native <select>; this is a bottom-sheet picker used everywhere the web app used one. */
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="w-full flex flex-col gap-1.5">
      {label && <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">{label}</Text>}

      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          'w-full flex-row items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-ink-300 dark:border-ink-700/80',
          className
        )}
      >
        <Text
          className={cn(
            'text-sm',
            selected ? 'text-ink-900 dark:text-ink-100' : 'text-ink-400 dark:text-ink-500'
          )}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color="#A79D8C" />
      </Pressable>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={label || placeholder}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onChange(item.value);
                setOpen(false);
              }}
              className="flex-row items-center justify-between py-3 px-1 active:bg-ink-50 dark:active:bg-ink-800/60 rounded-lg"
            >
              <Text className="text-sm text-ink-900 dark:text-ink-100">{item.label}</Text>
              {item.value === value && <Check size={16} color="#18161D" />}
            </Pressable>
          )}
        />
      </Modal>
    </View>
  );
};
