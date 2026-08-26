import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { budgetRepository } from '../../database/repositories/budgetRepo';
import { toMinorUnits, toMajorUnits, formatCurrency } from '../../utils/currency';
import { getMonthYearKey, formatMonthYear } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconHelper } from '../ui/IconHelper';
import { Trash2, Plus } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface BudgetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetManagerModal: React.FC<BudgetManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
  const currentMonthKey = getMonthYearKey();

  const [selectedCategory, setSelectedCategory] = useState<string>('overall');
  const [limitStr, setLimitStr] = useState('');
  const [error, setError] = useState('');

  const expenseCategories = Object.values(db.categories).filter((c) => c.type === 'EXPENSE');
  const currentBudgets = Object.values(db.budgets).filter((b) => b.monthKey === currentMonthKey);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitMinor = toMinorUnits(limitStr);
    if (limitMinor <= 0) {
      setError('Please enter a budget limit greater than 0');
      return;
    }

    try {
      budgetRepository.setBudget({
        monthKey: currentMonthKey,
        categoryId: selectedCategory === 'overall' ? null : selectedCategory,
        limitMinor,
      });

      audioService.playSuccessTone();
      setLimitStr('');
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to save budget');
    }
  };

  const handleDeleteBudget = (id: string) => {
    budgetRepository.deleteBudget(id);
    audioService.triggerHaptic('light');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Budgets for ${formatMonthYear(currentMonthKey)}`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        {/* Set / Update Form */}
        <form
          onSubmit={handleSaveBudget}
          className="flex flex-col gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/70 dark:border-zinc-800"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Set Monthly Limit
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Target Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="overall">Total Overall Monthly</option>
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Limit Amount (₹)"
              type="number"
              placeholder="e.g. 5000"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
            />
          </div>

          {error && <span className="text-xs text-rose-500 font-semibold">{error}</span>}

          <Button type="submit" size="sm" className="self-end mt-1">
            <Plus className="w-4 h-4 mr-1" /> Save Budget
          </Button>
        </form>

        {/* Existing Budgets List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Configured Budgets ({currentBudgets.length})
          </span>

          {currentBudgets.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              No budgets configured for this month.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
              {currentBudgets.map((b) => {
                const cat = b.categoryId ? db.categories[b.categoryId] : undefined;
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                        <IconHelper name={cat?.icon || 'PiggyBank'} size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {cat?.name || 'Total Monthly Budget'}
                        </span>
                        <span className="text-xs font-mono font-medium text-zinc-500">
                          Limit: {formatCurrency(b.limitMinor, db.settings.currency)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
