import React, { useState } from 'react';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { recurringRepository } from '../../database/repositories/recurringRepo';
import { financeService } from '../../services/financeService';
import { formatCurrency, toMinorUnits, toMajorUnits } from '../../utils/currency';
import { getTodayDateString } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconHelper } from '../ui/IconHelper';
import { Plus, Repeat, Play, Trash2, CheckCircle2 } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface RecurringManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecurringManagerModal: React.FC<RecurringManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
  const [isCreating, setIsCreating] = useState(false);

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [note, setNote] = useState('');
  const [nextDueDate, setNextDueDate] = useState(getTodayDateString());
  const [error, setError] = useState('');

  const recurringList = Object.values(db.recurringTransactions);
  const categories = Object.values(db.categories).filter((c) => c.type === type);
  const activeAccounts = Object.values(db.accounts).filter((a) => a.isActive);

  const handleStartCreate = () => {
    setType('EXPENSE');
    setAmountStr('');
    setAccountId(activeAccounts[0]?.id || '');
    setCategoryId(categories[0]?.id || '');
    setFrequency('MONTHLY');
    setNote('');
    setNextDueDate(getTodayDateString());
    setIsCreating(true);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = toMinorUnits(amountStr);
    if (amountMinor <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }

    try {
      recurringRepository.create({
        type,
        amountMinor,
        accountId,
        categoryId: categoryId || undefined,
        frequency,
        note: note.trim() || undefined,
        startDate: getTodayDateString(),
        nextDueDate,
      });

      audioService.playSuccessTone();
      setIsCreating(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create recurring transaction');
    }
  };

  // Convert recurring rule into immediate ledger transaction
  const handleExecuteNow = (r: RecurringTransaction) => {
    try {
      if (r.type === 'EXPENSE') {
        financeService.createExpense({
          amountMinor: r.amountMinor,
          accountId: r.accountId,
          categoryId: r.categoryId || '',
          date: getTodayDateString(),
          note: `[Recurring] ${r.note || ''}`.trim(),
        });
      } else if (r.type === 'INCOME') {
        financeService.createIncome({
          amountMinor: r.amountMinor,
          accountId: r.accountId,
          categoryId: r.categoryId || '',
          date: getTodayDateString(),
          note: `[Recurring] ${r.note || ''}`.trim(),
        });
      }

      // Advance next due date based on frequency
      const d = new Date(r.nextDueDate);
      if (r.frequency === 'DAILY') d.setDate(d.getDate() + 1);
      else if (r.frequency === 'WEEKLY') d.setDate(d.getDate() + 7);
      else if (r.frequency === 'MONTHLY') d.setMonth(d.getMonth() + 1);
      else if (r.frequency === 'YEARLY') d.setFullYear(d.getFullYear() + 1);

      const nextStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      recurringRepository.update(r.id, { nextDueDate: nextStr });

      audioService.playSuccessTone();
    } catch (err: any) {
      alert(err?.message || 'Failed to record transaction');
    }
  };

  const handleDelete = (id: string) => {
    recurringRepository.delete(id);
    audioService.triggerHaptic('light');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? 'New Recurring Rule' : 'Scheduled & Subscriptions'}
      maxWidth="md"
    >
      {isCreating ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {(['EXPENSE', 'INCOME'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => {
                  setType(t);
                  const firstCat = Object.values(db.categories).find((c) => c.type === t);
                  setCategoryId(firstCat?.id || '');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  type === t
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Recurring {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Amount (₹)"
              type="number"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              autoFocus
            />

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="DAILY">Daily</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Rule Label / Note"
            placeholder="e.g. Netflix Premium, House Rent, SIP Investment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Input
            label="First / Next Due Date"
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
          />

          {error && <span className="text-xs text-rose-500 font-semibold">{error}</span>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
              Back
            </Button>
            <Button type="submit" variant="primary">
              Save Recurring Rule
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">
              {recurringList.length} Scheduled Rules
            </span>
            <Button size="sm" onClick={handleStartCreate}>
              <Plus className="w-4 h-4 mr-1" /> Add Rule
            </Button>
          </div>

          {recurringList.length === 0 ? (
            <div className="py-8 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
              <Repeat className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">
                No recurring rules yet. Track Netflix, Rent, EMI, and Subscriptions.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
              {recurringList.map((r) => {
                const cat = r.categoryId ? db.categories[r.categoryId] : undefined;
                const acc = db.accounts[r.accountId];
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                        <IconHelper name={cat?.icon || 'Repeat'} size={18} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {r.note || cat?.name || 'Recurring Payment'}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                          <span>{r.frequency}</span>
                          <span>• {acc?.name || 'Account'}</span>
                          <span>• Due: {r.nextDueDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(r.amountMinor, db.settings.currency)}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => handleExecuteNow(r)}
                        title="Record this transaction into ledger now"
                      >
                        <Play className="w-3 h-3 mr-1 text-emerald-600" /> Log
                      </Button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
