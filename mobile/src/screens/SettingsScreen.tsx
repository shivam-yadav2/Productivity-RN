import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SettingsView } from '../components/settings/SettingsView';

interface SettingsScreenProps {
  onOpenAccountsManager: () => void;
  onOpenCategoriesManager: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onOpenAccountsManager,
  onOpenCategoriesManager,
}) => {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 56, gap: 16 }}>
      <View className="flex flex-col pt-1">
        <Text className="text-xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">
          Settings & Privacy
        </Text>
        <Text className="text-xs text-ink-500">Local preferences, security, and full offline backups</Text>
      </View>

      <SettingsView onOpenAccountsManager={onOpenAccountsManager} onOpenCategoriesManager={onOpenCategoriesManager} />
    </ScrollView>
  );
};
