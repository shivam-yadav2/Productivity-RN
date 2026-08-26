import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { financeService } from '../../services/financeService';
import { toMinorUnits, toMajorUnits } from '../../utils/currency';
import { getTodayDateString, getCurrentTimeString } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconHelper } from '../ui/IconHelper';
import { audioService } from '../../services/audioService';
import { ArrowDown, ArrowRight } from 'lucide-react';

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
  }, [isOpen, initialTransaction, db.accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Amount Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Transfer Amount ({db.settings.currency || 'INR'} ₹)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-blue-500">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0"
              autoFocus={!initialTransaction}
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setError('');
              }}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-3 text-2xl font-bold font-mono tracking-tight bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-blue-600 dark:text-blue-400 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Source & Destination Account Pickers */}
        <div className="flex flex-col gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
              From (Source Account)
            </label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
              To (Destination Account)
            </label>
            <select
              value={destAccountId}
              onChange={(e) => setDestAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <Input
          label="Note (Optional)"
          placeholder="e.g. ATM withdrawal, Card bill settlement"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <span className="text-xs text-rose-500 font-semibold">{error}</span>}

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {initialTransaction ? 'Update Transfer' : 'Execute Transfer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
