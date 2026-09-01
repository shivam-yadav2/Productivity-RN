import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSecurity } from '../../context/SecurityContext';
import { Fingerprint, Delete, Lock } from 'lucide-react-native';
import { PressableScale } from '../ui/PressableScale';
import { spring, timing, useReducedMotion } from '../../utils/motion';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

/**
 * Colours are inline rather than Tailwind classes because this element carries a
 * Reanimated style, and the two can't share an element (src/utils/nativewindInterop.ts).
 */
const PinDot: React.FC<{ filled: boolean; error: boolean; reduced: boolean }> = ({ filled, error, reduced }) => {
  const scale = useSharedValue(filled ? 1 : 0.55);

  useEffect(() => {
    scale.value = reduced ? (filled ? 1 : 0.55) : withSpring(filled ? 1 : 0.55, spring.pop);
  }, [filled, reduced, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const fill = error ? '#f43f5e' : filled ? '#ffffff' : '#27272a';
  const border = error ? '#f43f5e' : filled ? '#ffffff' : '#52525b';

  return (
    <Animated.View
      style={[
        { width: 16, height: 16, borderRadius: 999, borderWidth: 1, backgroundColor: fill, borderColor: border },
        style,
      ]}
    />
  );
};

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, unlockWithBiometrics, isBiometricsAvailable } = useSecurity();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const reduced = useReducedMotion();

  const shakeX = useSharedValue(0);
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const triggerShake = () => {
    if (reduced) return;
    shakeX.value = withSequence(
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-7, { duration: 55 }),
      withTiming(7, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      audioService.playSoftClick();
      audioService.triggerHaptic('light');

      if (nextPin.length === 4) {
        setTimeout(async () => {
          const success = await unlockWithPin(nextPin);
          if (success) {
            audioService.playSuccessTone();
            audioService.triggerHaptic('success');
          } else {
            setError(true);
            triggerShake();
            audioService.triggerHaptic('medium');
            setTimeout(() => {
              setPin('');
              setError(false);
            }, 500);
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
    audioService.playSoftClick();
  };

  const handleBiometricPress = async () => {
    await unlockWithBiometrics();
  };

  const digitKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(timing.base.duration)}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 24, backgroundColor: '#18161D' }}
    >
      <View className="flex-1 items-center justify-center gap-4">
        <View className="w-16 h-16 rounded-2xl bg-ink-800 border border-ink-700 items-center justify-center">
          <Lock size={32} color="#CCC3B2" />
        </View>

        <View className="items-center">
          <Text className="text-lg font-bold text-ink-100">Private & Secured</Text>
          <Text className="text-xs text-ink-400 mt-1">Enter your 4-digit PIN to access your data</Text>
        </View>

        {/* PIN Dots */}
        <Animated.View style={rowStyle}>
          <View className="flex-row items-center gap-4 my-4">
            {[0, 1, 2, 3].map((i) => (
              <PinDot key={i} filled={pin.length > i} error={error} reduced={reduced} />
            ))}
          </View>
        </Animated.View>

        {error && <Text className="text-xs text-rose-400 font-semibold">Incorrect PIN</Text>}
      </View>

      {/* Number Keypad */}
      <View className="w-full max-w-xs pb-8">
        <View className="flex-row flex-wrap justify-between" style={{ rowGap: 12 }}>
          {digitKeys.map((d) => (
            <PressableScale
              key={d}
              onPress={() => handleDigit(d)}
              activeScale={0.92}
              haptic
              className="h-16 rounded-2xl bg-ink-800/80 items-center justify-center"
              style={{ width: '30%' }}
            >
              <Text className="text-2xl font-bold font-mono text-ink-100">{d}</Text>
            </PressableScale>
          ))}

          {isBiometricsAvailable ? (
            <PressableScale
              onPress={handleBiometricPress}
              activeScale={0.92}
              className="h-16 rounded-2xl bg-ink-800/40 items-center justify-center"
              style={{ width: '30%' }}
              accessibilityLabel="Unlock with biometrics"
            >
              <Fingerprint size={24} color="#A79D8C" />
            </PressableScale>
          ) : (
            <View style={{ width: '30%' }} />
          )}

          <PressableScale
            onPress={() => handleDigit('0')}
            activeScale={0.92}
            haptic
            className="h-16 rounded-2xl bg-ink-800/80 items-center justify-center"
            style={{ width: '30%' }}
          >
            <Text className="text-2xl font-bold font-mono text-ink-100">0</Text>
          </PressableScale>

          <PressableScale
            onPress={handleDelete}
            activeScale={0.92}
            className="h-16 rounded-2xl bg-ink-800/40 items-center justify-center"
            style={{ width: '30%' }}
            accessibilityLabel="Delete digit"
          >
            <Delete size={24} color="#A79D8C" />
          </PressableScale>
        </View>
      </View>
    </Animated.View>
  );
};
