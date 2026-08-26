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
import { Plus } from 'lucide-react';

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export const IncomeFormModal: React.FC<IncomeFormModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
}) => {
  const { db } = useDatabase();
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const incomeCategories = Object.values(db.categories)
    .filter((c) => c.type === 'INCOME' && (!c.isArchived || c.id === selectedCategoryId))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const activeAccounts = Object.values(db.accounts).filter(
    (a) => a.isActive || a.id === selectedAccountId
  );

  useEffect(() => {
    if (initialTransaction) {
      setAmountStr(String(toMajorUnits(initialTransaction.amountMinor)));
      setSelectedAccountId(initialTransaction.accountId);
      setSelectedCategoryId(initialTransaction.categoryId || '');
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || getCurrentTimeString());
      setNote(initialTransaction.note || '');
      setTags(initialTransaction.tags || []);
      setShowAdvanced(Boolean(initialTransaction.note || initialTransaction.tags?.length));
    } else {
      setAmountStr('');
      setSelectedAccountId(db.settings.defaultAccountId || activeAccounts[0]?.id || '');
      setSelectedCategoryId(incomeCategories[0]?.id || '');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNote('');
      setTags([]);
      setShowAdvanced(false);
    }
    setError('');
  }, [isOpen, initialTransaction, db.categories, db.accounts]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = toMinorUnits(amountStr);

    if (amountMinor <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!selectedAccountId) {
      setError('Please select an account');
      return;
    }

    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    try {
      if (initialTransaction) {
        financeService.updateTransaction(initialTransaction.id, {
          amountMinor,
          accountId: selectedAccountId,
          categoryId: selectedCategoryId,
          date,
          time,
          note: note.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      } else {
        financeService.createIncome({
          amountMinor,
          accountId: selectedAccountId,
          categoryId: selectedCategoryId,
          date,
          time,
          note: note.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      }

      audioService.playSuccessTone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save income');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Edit Income' : 'New Income'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Amount Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Amount ({db.settings.currency || 'INR'} ₹)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-500">
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
              className="w-full pl-9 pr-4 py-3 text-2xl font-bold font-mono tracking-tight bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-emerald-600 dark:text-emerald-400 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category Selector Grid */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Income Source
          </label>
          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
            {incomeCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                      : 'hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <IconHelper name={cat.icon} size={18} />
                  <span className="text-[11px] font-medium truncate w-full mt-1">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Deposit Into Account
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {activeAccounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 border transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  <IconHelper name={acc.icon} size={14} />
                  <span>{acc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Advanced Details */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 self-start mt-1"
        >
          {showAdvanced ? '− Hide Details' : '+ Add Note, Date & Tags'}
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Input
                label="Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <Input
              label="Note / Description"
              placeholder="e.g., August Salary Bonus, Freelance Milestone"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {/* Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Tags</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Salary, Client"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddTag}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && <span className="text-xs text-rose-500 font-semibold">{error}</span>}

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {initialTransaction ? 'Update Income' : 'Save Income'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
