import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Debt } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { debtRepository } from '../../database/repositories/debtRepo';
import { formatCurrency, toMinorUnits, toMajorUnits } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { DateField } from '../ui/DateField';
import { IconHelper } from '../ui/IconHelper';
import { AnimatedBar } from '../ui/AnimatedBar';
import { Plus, Edit2, Check, Trash2, Landmark, X } from 'lucide-react-native';
import { audioService } from '../../services/audioService';

interface DebtsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEBT_ICONS = ['CreditCard', 'Landmark', 'GraduationCap', 'Car', 'Home', 'Receipt'];
const DEBT_COLORS = ['#2563eb', '#059669', '#4f46e5', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#475569'];

export const DebtsManagerModal: React.FC<DebtsManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
  const { resolvedTheme } = useTheme();
  const selectedAccentColor = resolvedTheme === 'dark' ? '#18181b' : '#ffffff';
  const [isCreating, setIsCreating] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentStr, setPaymentStr] = useState('');

  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [principalStr, setPrincipalStr] = useState('');
  const [interestRateStr, setInterestRateStr] = useState('');
  const [emiAmountStr, setEmiAmountStr] = useState('');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState('Landmark');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');

  const debts = debtRepository.getAll();

  const handleStartCreate = () => {
    setName('');
    setLender('');
    setPrincipalStr('');
    setInterestRateStr('');
    setEmiAmountStr('');
    setDueDate(undefined);
    setIcon('Landmark');
    setColor('#2563eb');
    setEditingDebtId(null);
    setIsCreating(true);
    setError('');
  };

  const handleStartEdit = (debt: Debt) => {
    setName(debt.name);
    setLender(debt.lender || '');
    setPrincipalStr(String(toMajorUnits(debt.principalMinor)));
    setInterestRateStr(debt.interestRatePercent != null ? String(debt.interestRatePercent) : '');
    setEmiAmountStr(debt.emiAmountMinor != null ? String(toMajorUnits(debt.emiAmountMinor)) : '');
    setDueDate(debt.dueDate);
    setIcon(debt.icon);
    setColor(debt.color);
    setEditingDebtId(debt.id);
    setIsCreating(true);
    setError('');
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Debt name is required');
      return;
    }

    const principalMinor = toMinorUnits(principalStr);
    if (principalMinor <= 0) {
      setError('Please enter a valid principal amount');
      return;
    }

    const interestRatePercent = interestRateStr.trim() ? parseFloat(interestRateStr) : undefined;
    const emiAmountMinor = emiAmountStr.trim() ? toMinorUnits(emiAmountStr) : undefined;

    try {
      if (editingDebtId) {
        debtRepository.update(editingDebtId, {
          name: name.trim(),
          lender: lender.trim() || undefined,
          principalMinor,
          interestRatePercent,
          emiAmountMinor,
          dueDate,
          icon,
          color,
        });
      } else {
        debtRepository.create({
          name: name.trim(),
          lender: lender.trim() || undefined,
          principalMinor,
          interestRatePercent,
          emiAmountMinor,
          dueDate,
          icon,
          color,
        });
      }

      audioService.playSuccessTone();
      setIsCreating(false);
      setEditingDebtId(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to save debt');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete debt?', 'This will permanently remove this debt and its payment progress.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          debtRepository.delete(id);
          audioService.triggerHaptic('light');
        },
      },
    ]);
  };

  const handleStartPay = (id: string) => {
    setPayingId(id);
    setPaymentStr('');
  };

  const handleConfirmPay = (id: string) => {
    const amountMinor = toMinorUnits(paymentStr);
    if (amountMinor <= 0) {
      setPayingId(null);
      return;
    }
    debtRepository.recordPayment(id, amountMinor);
    audioService.playSuccessTone();
    setPayingId(null);
    setPaymentStr('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? (editingDebtId ? 'Edit Debt' : 'New Debt') : 'Manage Debts'}
      maxWidth="md"
    >
      {isCreating ? (
        <View className="flex-col gap-4">
          <Input
            label="Debt Name"
            placeholder="e.g., Home Loan, Car EMI, Credit Card"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Input
            label="Lender (optional)"
            placeholder="e.g., HDFC Bank, Bajaj Finserv"
            value={lender}
            onChangeText={setLender}
          />

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                label="Principal Amount (₹)"
                keyboardType="decimal-pad"
                value={principalStr}
                onChangeText={setPrincipalStr}
                placeholder="0.00"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Interest Rate % (optional)"
                keyboardType="decimal-pad"
                value={interestRateStr}
                onChangeText={setInterestRateStr}
                placeholder="e.g. 9.5"
              />
            </View>
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                label="EMI Amount (optional)"
                keyboardType="decimal-pad"
                value={emiAmountStr}
                onChangeText={setEmiAmountStr}
                placeholder="0.00"
              />
            </View>
            <View className="flex-1">
              <DateField mode="date" label="Due Date (optional)" value={dueDate} onChange={setDueDate} />
            </View>
          </View>

          {/* Color & Icon Picker */}
          <View className="flex-col gap-1.5">
            <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Icon & Color</Text>
            <View className="flex-row items-center gap-2 flex-wrap mb-2">
              {DEBT_COLORS.map((c) => (
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
              {DEBT_ICONS.map((ic) => (
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
              <Text className={buttonTextColor.primary}>{editingDebtId ? 'Save Changes' : 'Create Debt'}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-col gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-zinc-500 font-medium">{debts.length} Tracked Debts</Text>
            <Button size="sm" onPress={handleStartCreate}>
              <Plus size={16} color="#ffffff" />
              <Text className={buttonTextColor.primary}>Add Debt</Text>
            </Button>
          </View>

          {debts.length === 0 ? (
            <View className="py-8 items-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
              <Landmark size={32} color="#a1a1aa" />
              <Text className="text-xs text-zinc-500 mt-2 text-center px-4">
                No debts tracked yet. Add a loan, EMI, or credit card balance to track payoff.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }}>
              <View className="flex-col gap-2">
                {debts.map((debt) => {
                  const payoffPercent =
                    debt.principalMinor > 0 ? (1 - debt.currentBalanceMinor / debt.principalMinor) * 100 : 0;
                  const isPaying = payingId === debt.id;
                  return (
                    <View
                      key={debt.id}
                      className="flex-col gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
                          <View
                            className="w-10 h-10 rounded-xl items-center justify-center shrink-0"
                            style={{ backgroundColor: debt.color }}
                          >
                            <IconHelper name={debt.icon} size={20} color="#ffffff" />
                          </View>
                          <View className="flex-col min-w-0 flex-1">
                            <Text numberOfLines={1} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {debt.name}
                            </Text>
                            <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {formatCurrency(debt.currentBalanceMinor, db.settings.currency)} remaining of{' '}
                              {formatCurrency(debt.principalMinor, db.settings.currency)}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-1 shrink-0">
                          <Pressable
                            onPress={() => handleStartPay(debt.id)}
                            className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg"
                          >
                            <Plus size={16} color="#16a34a" />
                          </Pressable>
                          <Pressable onPress={() => handleStartEdit(debt)} className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg">
                            <Edit2 size={16} color="#71717a" />
                          </Pressable>
                          <Pressable onPress={() => handleDelete(debt.id)} className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg">
                            <Trash2 size={16} color="#a1a1aa" />
                          </Pressable>
                        </View>
                      </View>

                      <AnimatedBar
                        percent={Math.min(100, Math.max(0, payoffPercent))}
                        trackClassName="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full"
                        fillColor={debt.color}
                      />

                      {isPaying && (
                        <View className="flex-row items-center gap-2">
                          <View className="flex-1">
                            <Input
                              placeholder="Payment amount (₹)"
                              keyboardType="decimal-pad"
                              value={paymentStr}
                              onChangeText={setPaymentStr}
                              autoFocus
                            />
                          </View>
                          <Pressable
                            onPress={() => handleConfirmPay(debt.id)}
                            className="p-2.5 rounded-xl bg-emerald-600 active:bg-emerald-700"
                          >
                            <Check size={18} color="#ffffff" />
                          </Pressable>
                          <Pressable
                            onPress={() => setPayingId(null)}
                            className="p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600"
                          >
                            <X size={18} color="#71717a" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </Modal>
  );
};
