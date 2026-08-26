import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSecurity } from '../../context/SecurityContext';
import { Fingerprint, Delete, Lock } from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, unlockWithBiometrics, isBiometricsAvailable } = useSecurity();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

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
    <View className="flex-1 items-center justify-between p-6 bg-zinc-900">
      <View className="flex-1 items-center justify-center gap-4">
        <View className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 items-center justify-center">
          <Lock size={32} color="#d4d4d8" />
        </View>

        <View className="items-center">
          <Text className="text-lg font-bold text-zinc-100">Private & Secured</Text>
          <Text className="text-xs text-zinc-400 mt-1">Enter your 4-digit PIN to access your data</Text>
        </View>

        {/* PIN Dots */}
        <View className="flex-row items-center gap-4 my-4">
          {[0, 1, 2, 3].map((i) => {
            const filled = pin.length > i;
            return (
              <View
                key={i}
                className={cn(
                  'w-4 h-4 rounded-full border',
                  error
                    ? 'bg-rose-500 border-rose-500'
                    : filled
                    ? 'bg-white border-white'
                    : 'border-zinc-600 bg-zinc-800'
                )}
              />
            );
          })}
        </View>

        {error && <Text className="text-xs text-rose-400 font-semibold">Incorrect PIN</Text>}
      </View>

      {/* Number Keypad */}
      <View className="w-full max-w-xs pb-8">
        <View className="flex-row flex-wrap justify-between" style={{ rowGap: 12 }}>
          {digitKeys.map((d) => (
            <Pressable
              key={d}
              onPress={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-zinc-800/80 active:bg-zinc-600 items-center justify-center"
              style={{ width: '30%' }}
            >
              <Text className="text-2xl font-bold font-mono text-zinc-100">{d}</Text>
            </Pressable>
          ))}

          {isBiometricsAvailable ? (
            <Pressable
              onPress={handleBiometricPress}
              className="h-16 rounded-2xl bg-zinc-800/40 active:bg-zinc-800 items-center justify-center"
              style={{ width: '30%' }}
              accessibilityLabel="Unlock with biometrics"
            >
              <Fingerprint size={24} color="#a1a1aa" />
            </Pressable>
          ) : (
            <View style={{ width: '30%' }} />
          )}

          <Pressable
            onPress={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-zinc-800/80 active:bg-zinc-600 items-center justify-center"
            style={{ width: '30%' }}
          >
            <Text className="text-2xl font-bold font-mono text-zinc-100">0</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            className="h-16 rounded-2xl bg-zinc-800/40 active:bg-zinc-800 items-center justify-center"
            style={{ width: '30%' }}
            accessibilityLabel="Delete digit"
          >
            <Delete size={24} color="#a1a1aa" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
