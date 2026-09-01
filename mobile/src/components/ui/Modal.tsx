import React, { useEffect, useState } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  Keyboard,
  Platform,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { cn } from '../../utils/cn';
import { AnimatedPressable } from '../../utils/nativewindInterop';
import { spring, timing, useReducedMotion } from '../../utils/motion';

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
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 900;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isDark = useColorScheme() === 'dark';
  const reduced = useReducedMotion();
  const isSmallScreen = screenWidth < BREAKPOINT_SM;
  const dialogWidth = isSmallScreen ? screenWidth : Math.min(screenWidth, MAX_WIDTH_PX[maxWidth]);

  // Keep the sheet mounted through its exit animation.
  const [mounted, setMounted] = useState(isOpen);
  // The sheet's measured height. The slide-up travels exactly this far, so the whole
  // movement happens on screen. Translating by the full screen height instead (the
  // obvious shortcut) parks a short sheet far below the fold, so most of the spring is
  // spent invisible and the sheet appears to pop in late rather than glide up.
  const sheetHeight = useSharedValue(0);

  // 0 = fully closed, 1 = fully open. Drives backdrop + the centered-dialog transform.
  const progress = useSharedValue(isOpen ? 1 : 0);
  // Extra downward offset contributed by the drag gesture (small screens only).
  const dragY = useSharedValue(0);

  // KeyboardAvoidingView is unreliable inside an Android RNModal — the modal's window isn't
  // resized by `adjustResize`. The keyboard *events* still fire with correct metrics, so we
  // track the height ourselves and lift the sheet above it.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    setKeyboardHeight(0);
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) return;

    if (isOpen) {
      dragY.value = 0;
      progress.value = reduced ? 1 : withSpring(1, spring.surface);
    } else {
      progress.value = reduced
        ? 0
        : withTiming(0, timing.base, (finished) => {
            if (finished) runOnJS(setMounted)(false);
          });
      if (reduced) runOnJS(setMounted)(false);
    }
  }, [isOpen, mounted, reduced, progress, dragY]);

  useEffect(() => {
    if (!isOpen) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates?.height ?? 0));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isOpen]);

  const availableHeight = Math.max(screenHeight - keyboardHeight, 240);
  const maxDialogHeight = availableHeight * (isSmallScreen ? 0.94 : 0.92);

  const requestClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const panGesture = Gesture.Pan()
    .enabled(isSmallScreen && !reduced)
    .activeOffsetY(8)
    .failOffsetY(-8)
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        runOnJS(requestClose)();
      } else {
        dragY.value = withSpring(0, spring.surface);
      }
    });

  const backdropStyle = useAnimatedStyle(() => {
    const dragFade = interpolate(dragY.value, [0, 320], [1, 0.2], Extrapolation.CLAMP);
    return { opacity: progress.value * dragFade };
  });

  const sheetStyle = useAnimatedStyle(() => {
    if (isSmallScreen) {
      // Fall back to the full height only until the first layout pass reports a real one.
      const hidden = sheetHeight.value > 0 ? sheetHeight.value : availableHeight;
      const translateY = interpolate(progress.value, [0, 1], [hidden, 0], Extrapolation.CLAMP) + dragY.value;
      return { transform: [{ translateY }] };
    }
    return {
      opacity: progress.value,
      transform: [{ scale: interpolate(progress.value, [0, 1], [0.94, 1], Extrapolation.CLAMP) }],
    };
  });

  if (!mounted) return null;

  const header = (
    <View className="px-5 pt-3 pb-3 border-b border-ink-100 dark:border-ink-800">
      {isSmallScreen && (
        <View className="items-center pb-2.5">
          <View className="h-1 w-9 rounded-full bg-ink-300 dark:bg-ink-700" />
        </View>
      )}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          {title && (
            <Text className="text-base font-semibold text-ink-900 dark:text-ink-100">{title}</Text>
          )}
          {description && (
            <Text className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{description}</Text>
          )}
        </View>
        <Pressable
          onPress={requestClose}
          className="p-1.5 active:bg-ink-100 dark:active:bg-ink-800 rounded-lg"
          accessibilityLabel="Close dialog"
        >
          <X size={20} color="#A79D8C" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <RNModal visible={mounted} transparent animationType="none" onRequestClose={requestClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1" style={{ justifyContent: isSmallScreen ? 'flex-end' : 'center', alignItems: 'center' }}>
        <AnimatedPressable style={[StyleSheet.absoluteFill, backdropStyle]} onPress={requestClose}>
          <BlurView intensity={18} tint="dark" style={{ flex: 1 }} />
        </AnimatedPressable>

        {/* Reanimated style and NativeWind className can't share an element, so the
            sheet's surface colours are inline (see src/utils/nativewindInterop.ts). */}
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) sheetHeight.value = h;
          }}
          style={[
            // Explicit off-screen start: the layout pass runs before the opening spring,
            // so without this the sheet would paint one frame at its resting position.
            isSmallScreen ? { transform: [{ translateY: availableHeight }] } : { opacity: 0 },
            {
              width: dialogWidth,
              maxHeight: maxDialogHeight,
              marginBottom: isSmallScreen ? keyboardHeight : 0,
              overflow: 'hidden',
              zIndex: 10,
              backgroundColor: isDark ? '#18161D' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              ...(isSmallScreen
                ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 24, borderTopRightRadius: 24 }
                : { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16 }),
            },
            sheetStyle,
          ]}
        >
          {(title || description || isSmallScreen) ? (
            <GestureDetector gesture={panGesture}>{header}</GestureDetector>
          ) : null}

          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </RNModal>
  );
};
