import React, { useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Transaction } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { financeService } from '../../services/financeService';
import { toMinorUnits, toMajorUnits } from '../../utils/currency';
import { getTodayDateString, getCurrentTimeString } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DateField } from '../ui/DateField';
import { audioService } from '../../services/audioService';
import { ArrowDown } from 'lucide-react-native';

interface TransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export const TransferFormModal: React.FC<TransferFormModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
}) => {
  const { db } = useDatabase();
  const [amountStr, setAmountStr] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const activeAccounts = Object.values(db.accounts).filter((a) => a.isActive);
  const accountOptions = activeAccounts.map((acc) => ({ label: acc.name, value: acc.id }));

  useEffect(() => {
    if (initialTransaction) {
      setAmountStr(String(toMajorUnits(initialTransaction.amountMinor)));
      setSourceAccountId(initialTransaction.accountId);
      setDestAccountId(initialTransaction.destinationAccountId || '');
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || getCurrentTimeString());
      setNote(initialTransaction.note || '');
    } else {
      setAmountStr('');
      setSourceAccountId(activeAccounts[0]?.id || '');
      setDestAccountId(activeAccounts[1]?.id || '');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNote('');
    }
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTransaction, db.accounts]);

  const handleSubmit = () => {
    const amountMinor = toMinorUnits(amountStr);

    if (amountMinor <= 0) {
      setError('Please enter a valid transfer amount greater than 0');
      return;
    }

    if (!sourceAccountId || !destAccountId) {
      setError('Please select both source and destination accounts');
      return;
    }

    if (sourceAccountId === destAccountId) {
      setError('Source and destination accounts must be different');
      return;
    }

    try {
      if (initialTransaction) {
        financeService.updateTransaction(initialTransaction.id, {
          amountMinor,
          accountId: sourceAccountId,
          destinationAccountId: destAccountId,
          date,
          time,
          note: note.trim() || undefined,
        });
      } else {
        financeService.createTransfer({
          amountMinor,
          sourceAccountId,
          destinationAccountId: destAccountId,
          date,
          time,
          note: note.trim() || undefined,
        });
      }

      audioService.playSuccessTone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to execute transfer');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Edit Transfer' : 'Account Transfer'}
      description="Moves funds between two accounts without altering total assets."
      maxWidth="sm"
    >
      <View className="flex-col gap-4">
        {/* Amount Input */}
        <View className="flex-col gap-1">
          <Text className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Transfer Amount ({db.settings.currency || 'INR'} ₹)
          </Text>
          <View className="relative justify-center">
            <Text className="absolute left-3.5 z-10 text-2xl font-bold text-blue-500">₹</Text>
            <TextInput
              keyboardType="decimal-pad"
              autoFocus={!initialTransaction}
              value={amountStr}
              onChangeText={(v) => {
                setAmountStr(v);
                setError('');
              }}
              placeholder="0.00"
              placeholderTextColor="#a1a1aa"
              className="w-full pl-9 pr-4 py-3 text-2xl font-bold tracking-tight bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-blue-600 dark:text-blue-400"
            />
          </View>
        </View>

        {/* Source & Destination Account Pickers */}
        <View className="flex-col gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
          <Select
            label="From (Source Account)"
            value={sourceAccountId}
            onChange={setSourceAccountId}
            options={accountOptions}
          />

          <View className="items-center justify-center">
            <View className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center border border-blue-200 dark:border-blue-800">
              <ArrowDown size={14} color="#2563eb" />
            </View>
          </View>

          <Select
            label="To (Destination Account)"
            value={destAccountId}
            onChange={setDestAccountId}
            options={accountOptions}
          />
        </View>

        {/* Date & Note */}
        <View className="flex-row gap-2">
          <View className="flex-1">
            <DateField mode="date" label="Date" value={date} onChange={setDate} />
          </View>
          <View className="flex-1">
            <DateField mode="time" label="Time" value={time} onChange={setTime} />
          </View>
        </View>

        <Input
          label="Note (Optional)"
          placeholder="e.g. ATM withdrawal, Card bill settlement"
          value={note}
          onChangeText={setNote}
        />

        {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

        {/* Submit */}
        <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="ghost" onPress={onClose}>
            <Text className={buttonTextColor.ghost}>Cancel</Text>
          </Button>
          <Button variant="primary" onPress={handleSubmit}>
            <Text className={buttonTextColor.primary}>{initialTransaction ? 'Update Transfer' : 'Execute Transfer'}</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
};
