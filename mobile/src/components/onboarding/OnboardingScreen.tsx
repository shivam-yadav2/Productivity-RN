import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, WifiOff, Wallet, ArrowRight } from 'lucide-react-native';
import { settingsRepository } from '../../database/repositories/settingsRepo';
import { Logo } from '../ui/Logo';
import { audioService } from '../../services/audioService';
import { ink, accent } from '../../utils/theme';
import { cn } from '../../utils/cn';

interface OnboardingScreenProps {
  onDone: () => void;
}

const CURRENCIES = [
  { code: 'INR', label: '₹ Rupee' },
  { code: 'USD', label: '$ Dollar' },
  { code: 'EUR', label: '€ Euro' },
  { code: 'GBP', label: '£ Pound' },
  { code: 'AED', label: 'AED' },
  { code: 'JPY', label: '¥ Yen' },
];

/**
 * First-run setup. `hasCompletedOnboarding` existed in settings from the beginning but
 * nothing ever read or wrote it, so every install dropped straight into a seeded ledger
 * with no explanation and the wrong currency until the user found Settings.
 *
 * Deliberately one screen, not a carousel: the only thing the app genuinely needs up
 * front is the currency, since it is baked into every amount displayed afterwards.
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const isDark = useColorScheme() === 'dark';
  const [currency, setCurrency] = useState('INR');

  const handleStart = () => {
    settingsRepository.update({ currency, hasCompletedOnboarding: true });
    audioService.playSuccessTone();
    onDone();
  };

  const Point: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
    icon,
    title,
    body,
  }) => (
    <View className="flex-row items-start gap-3">
      <View
        className="w-9 h-9 rounded-2xl items-center justify-center"
        style={{ backgroundColor: isDark ? accent.purple.deep : accent.purple.bg }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink-900 dark:text-ink-50">{title}</Text>
        <Text className="text-xs text-ink-500 mt-0.5">{body}</Text>
      </View>
    </View>
  );

  const accentText = isDark ? accent.purple.bg : accent.purple.deep;

  return (
    <SafeAreaView className="flex-1 bg-ink-50 dark:bg-ink-950">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 12, flexGrow: 1 }}>
        <View className="items-center mt-6 mb-8">
          <View className="w-16 h-16 rounded-3xl bg-ink-900 dark:bg-ink-100 items-center justify-center">
            <Logo
              size={30}
              color={isDark ? ink[950] : ink[50]}
              backdropColor={isDark ? ink[100] : ink[900]}
            />
          </View>
          <Text className="font-jakarta-extrabold text-2xl text-ink-900 dark:text-ink-50 mt-4 tracking-tight">
            Personal
          </Text>
          <Text className="text-sm text-ink-500 mt-1 text-center">
            Your money and your day, in one place.
          </Text>
        </View>

        <View className="gap-5 mb-8">
          <Point
            icon={<WifiOff size={17} color={accentText} />}
            title="Works completely offline"
            body="No account, no sync, no servers. Nothing you enter leaves this phone."
          />
          <Point
            icon={<ShieldCheck size={17} color={accentText} />}
            title="Private by default"
            body="Add a PIN or fingerprint lock later in Settings if you want one."
          />
          <Point
            icon={<Wallet size={17} color={accentText} />}
            title="Starts with sample data"
            body="A few example entries so nothing looks empty. Clear them any time from Settings."
          />
        </View>

        <View className="mb-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2.5">
            Your currency
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => setCurrency(c.code)}
                className={cn(
                  'px-4 py-2.5 rounded-2xl border',
                  currency === c.code
                    ? 'bg-ink-900 dark:bg-ink-100 border-ink-900 dark:border-ink-100'
                    : 'bg-surface dark:bg-surface-dark border-ink-200 dark:border-ink-700'
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-bold',
                    currency === c.code
                      ? 'text-white dark:text-ink-900'
                      : 'text-ink-700 dark:text-ink-300'
                  )}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-[11px] text-ink-400 mt-2">
            You can change this later in Settings.
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-4">
        <Pressable
          onPress={handleStart}
          className="flex-row items-center justify-center gap-2 py-4 rounded-3xl bg-ink-900 dark:bg-ink-100 active:opacity-90"
        >
          <Text className="text-base font-bold text-white dark:text-ink-900">Get started</Text>
          <ArrowRight size={18} color={isDark ? ink[900] : '#FFFFFF'} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
