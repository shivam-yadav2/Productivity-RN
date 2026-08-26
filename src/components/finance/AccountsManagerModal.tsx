import React, { useState } from 'react';
import { Account, AccountType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { accountRepository } from '../../database/repositories/accountRepo';
import { formatCurrency, toMinorUnits, toMajorUnits } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconHelper } from '../ui/IconHelper';
import { Plus, Edit2, Archive, Check, Building2, Wallet, Landmark, Banknote, CreditCard, PiggyBank, TrendingUp } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface AccountsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCOUNT_ICONS = ['Building2', 'Landmark', 'Banknote', 'Wallet', 'CreditCard', 'PiggyBank', 'TrendingUp', 'Coins'];
const ACCOUNT_COLORS = ['#2563eb', '#059669', '#4f46e5', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#475569'];

export const AccountsManagerModal: React.FC<AccountsManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
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
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Account Name"
            placeholder="e.g., SBI Salary Account, IndusInd Savings, Cash"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Account Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="BANK">Bank Account</option>
                <option value="CASH">Physical Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="WALLET">Digital Wallet</option>
                <option value="SAVINGS">Savings & Deposit</option>
                <option value="INVESTMENT">Investment / Stocks</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <Input
              label="Opening Balance (₹)"
              type="number"
              step="any"
              value={openingBalanceStr}
              onChange={(e) => setOpeningBalanceStr(e.target.value)}
            />
          </div>

          {/* Color & Icon Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Icon & Color
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {ACCOUNT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-zinc-900 dark:ring-zinc-100 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {ACCOUNT_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-xl border transition-all ${
                    icon === ic
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <IconHelper name={ic} size={18} />
                </button>
              ))}
            </div>
          </div>

          {error && <span className="text-xs text-rose-500 font-semibold">{error}</span>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
              Back
            </Button>
            <Button type="submit" variant="primary">
              {editingAccountId ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">
              {accounts.length} Total Accounts
            </span>
            <Button size="sm" onClick={handleStartCreate}>
              <Plus className="w-4 h-4 mr-1" /> Add Account
            </Button>
          </div>

          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: acc.color }}
                  >
                    <IconHelper name={acc.icon} size={20} />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {acc.name}
                      </span>
                      {!acc.isActive && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                          Archived
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400">
                      Balance: {formatCurrency(acc.currentBalanceMinor, acc.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(acc)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Edit account"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(acc)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      acc.isActive
                        ? 'text-zinc-400 hover:text-amber-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-700'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    title={acc.isActive ? 'Archive account' : 'Restore account'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
