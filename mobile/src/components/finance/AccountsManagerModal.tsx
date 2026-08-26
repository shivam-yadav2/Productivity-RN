import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Account, AccountType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { accountRepository } from '../../database/repositories/accountRepo';
import { formatCurrency, toMinorUnits, toMajorUnits } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { IconHelper } from '../ui/IconHelper';
import { Plus, Edit2, Archive, Check } from 'lucide-react-native';
import { audioService } from '../../services/audioService';

interface AccountsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCOUNT_ICONS = ['Building2', 'Landmark', 'Banknote', 'Wallet', 'CreditCard', 'PiggyBank', 'TrendingUp', 'Coins'];
const ACCOUNT_COLORS = ['#2563eb', '#059669', '#4f46e5', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#475569'];

const ACCOUNT_TYPE_OPTIONS: { label: string; value: AccountType }[] = [
  { label: 'Bank Account', value: 'BANK' },
  { label: 'Physical Cash', value: 'CASH' },
  { label: 'Credit Card', value: 'CREDIT_CARD' },
  { label: 'Digital Wallet', value: 'WALLET' },
  { label: 'Savings & Deposit', value: 'SAVINGS' },
  { label: 'Investment / Stocks', value: 'INVESTMENT' },
  { label: 'Other', value: 'OTHER' },
];

export const AccountsManagerModal: React.FC<AccountsManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
  const { resolvedTheme } = useTheme();
  const selectedAccentColor = resolvedTheme === 'dark' ? '#18181b' : '#ffffff';
  const [isCreating, setIsCreating] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('0');
  const [icon, setIcon] = useState('Building2');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');

  const accounts = Object.values(db.accounts);

  const handleStartCreate = () => {
    setName('');
    setType('BANK');
    setOpeningBalanceStr('0');
    setIcon('Building2');
    setColor('#2563eb');
    setEditingAccountId(null);
    setIsCreating(true);
    setError('');
  };

  const handleStartEdit = (acc: Account) => {
    setName(acc.name);
    setType(acc.type);
    setOpeningBalanceStr(String(toMajorUnits(acc.openingBalanceMinor)));
    setIcon(acc.icon);
    setColor(acc.color);
    setEditingAccountId(acc.id);
    setIsCreating(true);
    setError('');
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    const openingMinor = toMinorUnits(openingBalanceStr);

    try {
      if (editingAccountId) {
        accountRepository.update(editingAccountId, {
          name: name.trim(),
          type,
          openingBalanceMinor: openingMinor,
          icon,
          color,
        });
      } else {
        accountRepository.create({
          name: name.trim(),
          type,
          openingBalanceMinor: openingMinor,
          icon,
          color,
        });
      }

      audioService.playSuccessTone();
      setIsCreating(false);
      setEditingAccountId(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to save account');
    }
  };

  const handleToggleActive = (acc: Account) => {
    accountRepository.update(acc.id, { isActive: !acc.isActive });
    audioService.triggerHaptic('light');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? (editingAccountId ? 'Edit Account' : 'New Account') : 'Manage Accounts'}
      maxWidth="md"
    >
      {isCreating ? (
        <View className="flex-col gap-4">
          <Input
            label="Account Name"
            placeholder="e.g., SBI Salary Account, IndusInd Savings, Cash"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Select label="Account Type" value={type} onChange={(v) => setType(v as AccountType)} options={ACCOUNT_TYPE_OPTIONS} />
            </View>
            <View className="flex-1">
              <Input
                label="Opening Balance (₹)"
                keyboardType="decimal-pad"
                value={openingBalanceStr}
                onChangeText={setOpeningBalanceStr}
              />
            </View>
          </View>

          {/* Color & Icon Picker */}
          <View className="flex-col gap-1.5">
            <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Icon & Color</Text>
            <View className="flex-row items-center gap-2 flex-wrap mb-2">
              {ACCOUNT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={14} color="#ffffff" />}
                </Pressable>
              ))}
            </View>

            <View className="flex-row items-center gap-2 flex-wrap">
              {ACCOUNT_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  className={
                    icon === ic
                      ? 'p-2 rounded-xl border border-transparent bg-zinc-900 dark:bg-zinc-100'
                      : 'p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800'
                  }
                >
                  <IconHelper name={ic} size={18} color={icon === ic ? selectedAccentColor : '#71717a'} />
                </Pressable>
              ))}
            </View>
          </View>

          {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

          <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="ghost" onPress={() => setIsCreating(false)}>
              <Text className={buttonTextColor.ghost}>Back</Text>
            </Button>
            <Button variant="primary" onPress={handleSave}>
              <Text className={buttonTextColor.primary}>{editingAccountId ? 'Save Changes' : 'Create Account'}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-col gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-zinc-500 font-medium">{accounts.length} Total Accounts</Text>
            <Button size="sm" onPress={handleStartCreate}>
              <Plus size={16} color="#ffffff" />
              <Text className={buttonTextColor.primary}>Add Account</Text>
            </Button>
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            <View className="flex-col gap-2">
              {accounts.map((acc) => (
                <View
                  key={acc.id}
                  className="flex-row items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800"
                >
                  <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center shrink-0"
                      style={{ backgroundColor: acc.color }}
                    >
                      <IconHelper name={acc.icon} size={20} color="#ffffff" />
                    </View>

                    <View className="flex-col min-w-0">
                      <View className="flex-row items-center gap-2">
                        <Text numberOfLines={1} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {acc.name}
                        </Text>
                        {!acc.isActive && (
                          <View className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">
                            <Text className="text-[10px] text-zinc-600 dark:text-zinc-400">Archived</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Balance: {formatCurrency(acc.currentBalanceMinor, acc.currency)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1 shrink-0">
                    <Pressable onPress={() => handleStartEdit(acc)} className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg">
                      <Edit2 size={16} color="#71717a" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleToggleActive(acc)}
                      className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg"
                    >
                      <Archive size={16} color={acc.isActive ? '#a1a1aa' : '#16a34a'} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
};
