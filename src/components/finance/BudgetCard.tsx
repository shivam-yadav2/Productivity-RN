import React from 'react';
import { budgetService, BudgetStatus } from '../../services/budgetService';
import { useDatabase } from '../../context/DatabaseContext';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../ui/Card';
import { IconHelper } from '../ui/IconHelper';
import { PiggyBank, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BudgetCardProps {
  onOpenBudgetManager: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ onOpenBudgetManager }) => {
  const { db } = useDatabase();
  const { overall, categories } = budgetService.getMonthlyBudgetStatuses();

  if (!overall && categories.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#F0F0EE] dark:bg-[#252523] text-[#1A1A1A] dark:text-[#EDEDEB] flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#1A1A1A] dark:text-[#F3F3F1]">
              Monthly Budgets
            </h4>
            <p className="text-[11px] text-[#71716E]">Track and limit monthly expenses</p>
          </div>
        </div>
        <button
          onClick={onOpenBudgetManager}
          className="text-xs font-semibold text-[#1A1A1A] dark:text-[#EDEDEB] hover:underline cursor-pointer"
        >
          Set Budget
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-lg shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-[#71716E]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#71716E] dark:text-[#999996]">
            Monthly Budgets
          </span>
        </div>
        <button
          onClick={onOpenBudgetManager}
          className="text-xs text-[#71716E] hover:text-[#1A1A1A] dark:hover:text-[#EDEDEB] flex items-center gap-1 font-medium cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          Manage
        </button>
      </div>

      {/* Overall Budget Progress */}
      {overall && (
        <div className="flex flex-col gap-1.5 p-3.5 rounded-md bg-[#F9F9F8] dark:bg-[#252523] border border-[#E5E5E2] dark:border-[#333330]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1A1A1A] dark:text-[#EDEDEB]">Total Monthly</span>
            <span className="font-mono font-medium text-[#71716E]">
              {formatCurrency(overall.spentMinor, db.settings.currency)} /{' '}
              {formatCurrency(overall.limitMinor, db.settings.currency)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#E5E5E2] dark:bg-[#333330] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-full',
                overall.isOverBudget
                  ? 'bg-rose-500'
                  : overall.percentage > 85
                  ? 'bg-amber-500'
                  : 'bg-[#1A1A1A] dark:bg-[#EDEDEB]'
              )}
              style={{ width: `${Math.min(100, overall.percentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#71716E]">
            <span>{overall.percentage}% spent</span>
            <span>
              {overall.remainingMinor >= 0
                ? `${formatCurrency(overall.remainingMinor, db.settings.currency)} left`
                : `${formatCurrency(Math.abs(overall.remainingMinor), db.settings.currency)} over`}
            </span>
          </div>
        </div>
      )}

      {/* Category Budgets Sub-list */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1">
          {categories.slice(0, 3).map((catBudget) => (
            <div key={catBudget.id} className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconHelper name={catBudget.categoryIcon} size={14} className="text-[#71716E]" />
                  <span className="font-medium text-[#1A1A1A] dark:text-[#EDEDEB] truncate">
                    {catBudget.categoryName}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#71716E] shrink-0">
                  {formatCurrency(catBudget.spentMinor, db.settings.currency)} /{' '}
                  {formatCurrency(catBudget.limitMinor, db.settings.currency)}
                </span>
              </div>

              <div className="w-full h-1 bg-[#F0F0EE] dark:bg-[#333330] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    catBudget.isOverBudget
                      ? 'bg-rose-500'
                      : catBudget.percentage > 85
                      ? 'bg-amber-500'
                      : 'bg-[#71716E] dark:bg-[#999996]'
                  )}
                  style={{ width: `${Math.min(100, catBudget.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
