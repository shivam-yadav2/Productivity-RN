import React, { useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { useSecurity } from '../../context/SecurityContext';
import { settingsRepository } from '../../database/repositories/settingsRepo';
import { backupService } from '../../services/backupService';
import { Card } from '../ui/Card';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import {
  Moon,
  Sun,
  Lock,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Volume2,
  Vibrate,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

interface SettingsViewProps {
  onOpenAccountsManager: () => void;
  onOpenCategoriesManager: () => void;
}

const CURRENCY_OPTIONS = [
  { label: 'INR (₹ Indian Rupee)', value: 'INR' },
  { label: 'USD ($ US Dollar)', value: 'USD' },
  { label: 'EUR (€ Euro)', value: 'EUR' },
  { label: 'GBP (£ British Pound)', value: 'GBP' },
  { label: 'AED (د.إ UAE Dirham)', value: 'AED' },
  { label: 'CAD ($ Canadian Dollar)', value: 'CAD' },
  { label: 'AUD ($ Australian Dollar)', value: 'AUD' },
  { label: 'JPY (¥ Japanese Yen)', value: 'JPY' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenAccountsManager,
  onOpenCategoriesManager,
}) => {
  const { db } = useDatabase();
  const { theme, toggleTheme } = useTheme();
  const { hasPin, setPin, removePin, isBiometricsAvailable } = useSecurity();

  const [newPinInput, setNewPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const accountOptions = Object.values(db.accounts).map((acc) => ({ label: acc.name, value: acc.id }));

  const handleUpdateSetting = (key: any, value: any) => {
    settingsRepository.update({ [key]: value });
    audioService.triggerHaptic('light');
  };

  const handleSetPinSubmit = () => {
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    setPin(newPinInput);
    setShowPinSetup(false);
    setNewPinInput('');
    setPinError('');
    audioService.playSuccessTone();
  };

  const handleRemovePin = () => {
    removePin();
    audioService.triggerHaptic('medium');
  };

  const handleExportJSON = async () => {
    await backupService.exportJSON();
    audioService.triggerHaptic('medium');
  };

  const handleExportCSV = async () => {
    await backupService.exportTransactionsCSV();
    audioService.triggerHaptic('medium');
  };

  const handleImport = async () => {
    const result = await backupService.pickAndImportBackup();
    if (result.success) {
      audioService.playSuccessTone();
    }
    Alert.alert(result.success ? 'Success' : 'Import Failed', result.message);
  };

  const handleFactoryReset = () => {
    backupService.resetDatabase();
    setShowResetConfirm(false);
    audioService.triggerHaptic('medium');
  };

  return (
    <View className="flex-col gap-5 pb-8">
      {/* Visual & Audio Preferences */}
      <Card>
        <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
          Appearance & Feedback
        </Text>

        <View className="flex-row items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <View className="flex-row items-center gap-2">
            {theme === 'dark' ? <Moon size={16} color="#818cf8" /> : <Sun size={16} color="#f59e0b" />}
            <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Theme</Text>
          </View>
          <Button variant="secondary" size="sm" onPress={toggleTheme}>
            <Text className={cn('text-xs font-semibold', buttonTextColor.secondary)}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </Button>
        </View>

        <View className="flex-row items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <View className="flex-row items-center gap-2">
            <Volume2 size={16} color="#71717a" />
            <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Sound Effects</Text>
          </View>
          <Switch
            value={db.settings.soundEnabled}
            onValueChange={(v) => handleUpdateSetting('soundEnabled', v)}
          />
        </View>

        <View className="flex-row items-center justify-between py-1.5">
          <View className="flex-row items-center gap-2">
            <Vibrate size={16} color="#71717a" />
            <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Haptic Feedback</Text>
          </View>
          <Switch
            value={db.settings.hapticEnabled ?? db.settings.hapticsEnabled ?? true}
            onValueChange={(v) => {
              handleUpdateSetting('hapticEnabled', v);
              handleUpdateSetting('hapticsEnabled', v);
            }}
          />
        </View>
      </Card>

      {/* Currency & Financial Configuration */}
      <Card>
        <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
          Finance Configuration
        </Text>

        <View className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <Select
            label="Primary Currency"
            value={db.settings.currency || 'INR'}
            onChange={(v) => handleUpdateSetting('currency', v)}
            options={CURRENCY_OPTIONS}
          />
        </View>

        <View className="py-3 border-b border-zinc-100 dark:border-zinc-800">
          <Select
            label="Default Account"
            value={db.settings.defaultAccountId || ''}
            onChange={(v) => handleUpdateSetting('defaultAccountId', v)}
            options={accountOptions}
          />
        </View>

        <View className="flex-row gap-2 pt-1">
          <View className="flex-1">
            <Button variant="outline" size="sm" onPress={onOpenAccountsManager}>
              <Text className={cn('text-xs font-semibold', buttonTextColor.outline)}>Manage Accounts</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="outline" size="sm" onPress={onOpenCategoriesManager}>
              <Text className={cn('text-xs font-semibold', buttonTextColor.outline)}>Manage Categories</Text>
            </Button>
          </View>
        </View>
      </Card>

      {/* Security & App Lock */}
      <Card>
        <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
          Security & Privacy
        </Text>

        <View className="flex-row items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <Lock size={16} color="#71717a" />
            <View>
              <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">App PIN Lock</Text>
              <Text className="text-[10px] text-zinc-400">
                {hasPin ? 'PIN protection active' : 'No PIN configured'}
              </Text>
            </View>
          </View>

          {hasPin ? (
            <Button variant="ghost" size="sm" onPress={handleRemovePin}>
              <Text className="text-xs text-rose-600 font-semibold">Remove PIN</Text>
            </Button>
          ) : (
            <Button size="sm" onPress={() => setShowPinSetup(!showPinSetup)}>
              <Text className={cn('text-xs font-semibold', buttonTextColor.primary)}>Set PIN</Text>
            </Button>
          )}
        </View>

        {showPinSetup && (
          <View className="p-3 mt-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex-col gap-2">
            <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Enter a 4-digit PIN:</Text>
            <View className="flex-row items-center gap-2">
              <View className="w-24">
                <Input
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  value={newPinInput}
                  onChangeText={(v) => {
                    setNewPinInput(v.replace(/[^0-9]/g, ''));
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="text-center tracking-widest font-mono"
                  autoFocus
                />
              </View>
              <Button size="sm" onPress={handleSetPinSubmit}>
                <Text className={cn('text-xs font-semibold', buttonTextColor.primary)}>Save</Text>
              </Button>
              <Button variant="ghost" size="sm" onPress={() => setShowPinSetup(false)}>
                <Text className={cn('text-xs font-semibold', buttonTextColor.ghost)}>Cancel</Text>
              </Button>
            </View>
            {pinError ? <Text className="text-xs text-rose-500 font-medium">{pinError}</Text> : null}
          </View>
        )}

        <View className="flex-row items-center justify-between py-1.5 mt-1">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <Fingerprint size={16} color="#71717a" />
            <View>
              <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Biometric Unlock</Text>
              <Text className="text-[10px] text-zinc-400">
                {isBiometricsAvailable ? 'Fingerprint / Face ID available' : 'No biometric hardware enrolled'}
              </Text>
            </View>
          </View>
          <Switch
            value={Boolean(db.settings.biometricsEnabled)}
            onValueChange={(v) => handleUpdateSetting('biometricsEnabled', v)}
            disabled={!isBiometricsAvailable}
          />
        </View>
      </Card>

      {/* Backup, Export & Restore */}
      <Card>
        <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
          Data Ownership & Backup
        </Text>

        <Text className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
          Your data never leaves your device. Export regular backups to retain full offline ownership.
        </Text>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button variant="outline" size="sm" onPress={handleExportJSON}>
              <Download size={16} color="#2563eb" />
              <Text className={cn('text-xs font-semibold ml-1', buttonTextColor.outline)}>Export JSON</Text>
            </Button>
          </View>
          <View className="flex-1">
            <Button variant="outline" size="sm" onPress={handleExportCSV}>
              <FileSpreadsheet size={16} color="#059669" />
              <Text className={cn('text-xs font-semibold ml-1', buttonTextColor.outline)}>Export CSV</Text>
            </Button>
          </View>
        </View>

        <View className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex-row items-center justify-between">
          <View className="flex-col flex-1 pr-2">
            <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Restore Database</Text>
            <Text className="text-[10px] text-zinc-400">Import a previously exported JSON backup</Text>
          </View>

          <Button variant="secondary" size="sm" onPress={handleImport}>
            <Upload size={14} color="#3f3f46" />
            <Text className={cn('text-xs font-semibold ml-1', buttonTextColor.secondary)}>Select File</Text>
          </Button>
        </View>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-200 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10">
        <Text className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-3">
          Danger Zone
        </Text>

        {showResetConfirm ? (
          <View className="flex-col gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-rose-300 dark:border-rose-800">
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={16} color="#be123c" />
              <Text className="text-rose-700 dark:text-rose-400 text-xs font-bold flex-1">
                Are you sure you want to reset all data?
              </Text>
            </View>
            <Text className="text-[11px] text-zinc-600 dark:text-zinc-400">
              This will erase all accounts, transactions, tasks, and habits, and reload fresh initial data.
            </Text>
            <View className="flex-row items-center gap-2 justify-end mt-1">
              <Button size="sm" variant="ghost" onPress={() => setShowResetConfirm(false)}>
                <Text className={cn('text-xs font-semibold', buttonTextColor.ghost)}>Cancel</Text>
              </Button>
              <Button size="sm" variant="danger" onPress={handleFactoryReset}>
                <Text className={cn('text-xs font-semibold', buttonTextColor.danger)}>Confirm Reset</Text>
              </Button>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <View className="flex-col flex-1 pr-2">
              <Text className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Factory Reset Database
              </Text>
              <Text className="text-[10px] text-zinc-500">Restore factory defaults and clean state</Text>
            </View>
            <Button size="sm" variant="danger" onPress={() => setShowResetConfirm(true)}>
              <Trash2 size={14} color="#ffffff" />
              <Text className={cn('text-xs font-semibold ml-1', buttonTextColor.danger)}>Reset Data</Text>
            </Button>
          </View>
        )}
      </Card>
    </View>
  );
};
