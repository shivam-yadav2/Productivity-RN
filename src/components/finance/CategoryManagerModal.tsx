import React, { useState } from 'react';
import { Category, CategoryType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { categoryRepository } from '../../database/repositories/categoryRepo';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconHelper } from '../ui/IconHelper';
import { Plus, Edit2, Archive, Check, Tag } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS = [
  'Utensils', 'ShoppingCart', 'Car', 'ShoppingBag', 'Receipt', 'Home',
  'HeartPulse', 'GraduationCap', 'Film', 'Fuel', 'Tv', 'Sparkles',
  'Gift', 'Briefcase', 'Laptop', 'Trophy', 'TrendingUp', 'PiggyBank',
  'RotateCcw', 'Coins', 'Dumbbell', 'Coffee', 'Plane', 'Smartphone',
];

const CATEGORY_COLORS = [
  '#f97316', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#6366f1',
  '#ef4444', '#14b8a6', '#a855f7', '#eab308', '#06b6d4', '#f43f5e',
  '#059669', '#2563eb', '#64748b',
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { db } = useDatabase();
  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const [isCreating, setIsCreating] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#f97316');
  const [error, setError] = useState('');

  const categories = Object.values(db.categories).filter((c) => c.type === activeTab);

  const handleStartCreate = () => {
    setName('');
    setIcon(activeTab === 'EXPENSE' ? 'Utensils' : 'Briefcase');
    setColor(activeTab === 'EXPENSE' ? '#f97316' : '#059669');
    setEditingCatId(null);
    setIsCreating(true);
    setError('');
  };

  const handleStartEdit = (cat: Category) => {
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setEditingCatId(cat.id);
    setIsCreating(true);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      if (editingCatId) {
        categoryRepository.update(editingCatId, {
          name: name.trim(),
          icon,
          color,
        });
      } else {
        categoryRepository.create({
          name: name.trim(),
          type: activeTab,
          icon,
          color,
        });
      }

      audioService.playSuccessTone();
      setIsCreating(false);
      setEditingCatId(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to save category');
    }
  };

  const handleToggleArchive = (cat: Category) => {
    if (cat.isArchived) {
      categoryRepository.unarchive(cat.id);
    } else {
      categoryRepository.archive(cat.id);
    }
    audioService.triggerHaptic('light');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? (editingCatId ? 'Edit Category' : 'New Category') : 'Manage Categories'}
      maxWidth="md"
    >
      {isCreating ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Category Name"
            placeholder="e.g. Groceries, Gym, Coffee"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {/* Color & Icon Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Color & Icon
            </label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-zinc-900 dark:ring-zinc-100 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 text-zinc-600 dark:text-zinc-400'
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
              {editingCatId ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'EXPENSE'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => setActiveTab('INCOME')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'INCOME'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Income Categories
            </button>
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-zinc-500 font-medium">
              {categories.length} Categories
            </span>
            <Button size="sm" onClick={handleStartCreate}>
              <Plus className="w-4 h-4 mr-1" /> Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconHelper name={cat.icon} size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {cat.name}
                    </span>
                    {cat.isArchived && (
                      <span className="text-[10px] text-amber-600 font-medium">Archived</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                    title="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleArchive(cat)}
                    className={`p-1 rounded ${
                      cat.isArchived
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-zinc-400 hover:text-amber-600'
                    }`}
                    title={cat.isArchived ? 'Restore' : 'Archive'}
                  >
                    <Archive className="w-3.5 h-3.5" />
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
