import React from 'react';
import { Modal as RNModal, View, Text, Pressable, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const maxW = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end sm:justify-center items-center">
        <Pressable className="absolute inset-0" onPress={onClose}>
          <BlurView intensity={20} tint="dark" style={{ flex: 1 }} />
        </Pressable>

        <View
          className={cn(
            'relative w-full bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-2xl overflow-hidden z-10 self-stretch sm:self-center',
            maxW[maxWidth]
          )}
          style={{ maxHeight: '92%' }}
        >
          {(title || description) && (
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <View className="flex-1 pr-3">
                {title && (
                  <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</Text>
                )}
                {description && (
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</Text>
                )}
              </View>
              <Pressable
                onPress={onClose}
                className="p-1.5 active:bg-zinc-100 dark:active:bg-zinc-800 rounded-lg"
                accessibilityLabel="Close dialog"
              >
                <X size={20} color="#a1a1aa" />
              </Pressable>
            </View>
          )}

          <ScrollView contentContainerStyle={{ padding: 20 }}>{children}</ScrollView>
        </View>
      </View>
    </RNModal>
  );
};
