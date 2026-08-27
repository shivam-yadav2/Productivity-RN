import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
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

const MAX_WIDTH_PX: Record<NonNullable<ModalProps['maxWidth']>, number> = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
};

// Matches the Tailwind `sm:` breakpoint the web version keyed its bottom-sheet vs. centered-dialog behavior on.
const BREAKPOINT_SM = 640;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < BREAKPOINT_SM;
  // Computed explicitly rather than via `w-full`+`max-w-*`+`self-stretch` classes: on a flex
  // cross-axis, a stretched item clamped by max-width doesn't get re-centered by most engines —
  // it stays anchored to the start edge, leaving empty space on the other side. An explicit
  // width + alignSelf sidesteps that ambiguity entirely.
  const dialogWidth = isSmallScreen ? screenWidth : Math.min(screenWidth, MAX_WIDTH_PX[maxWidth]);

  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 items-center" style={{ justifyContent: isSmallScreen ? 'flex-end' : 'center' }}>
          <Pressable className="absolute inset-0" onPress={onClose}>
            <BlurView intensity={20} tint="dark" style={{ flex: 1 }} />
          </Pressable>

          <View
            className={cn(
              'relative bg-white dark:bg-zinc-900 overflow-hidden z-10',
              isSmallScreen
                ? 'border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl'
                : 'border border-zinc-200 dark:border-zinc-800 rounded-2xl'
            )}
            style={{ width: dialogWidth, maxHeight: screenHeight * 0.92, alignSelf: 'center' }}
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

            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};
