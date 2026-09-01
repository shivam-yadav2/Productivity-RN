import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Category, CategoryType } from '../../types';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { categoryRepository } from '../../database/repositories/categoryRepo';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconHelper } from '../ui/IconHelper';
import { Plus, Edit2, Archive, Check } from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

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
  const { resolvedTheme } = useTheme();
  const selectedAccentColor = resolvedTheme === 'dark' ? '#18161D' : '#ffffff';
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

  const handleSave = () => {
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
        <View className="flex-col gap-4">
          <Input
            label="Category Name"
            placeholder="e.g. Groceries, Gym, Coffee"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          {/* Color & Icon Picker */}
          <View className="flex-col gap-1.5">
            <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">Color & Icon</Text>
            <View className="flex-row items-center gap-2 flex-wrap mb-2">
              {CATEGORY_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={12} color="#ffffff" />}
                </Pressable>
              ))}
            </View>

            <View
              className="flex-row flex-wrap gap-1.5 p-1 bg-ink-50 dark:bg-ink-800/50 rounded-xl border border-ink-200 dark:border-ink-700"
              style={{ maxHeight: 176 }}
            >
              {CATEGORY_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  className={cn(
                    'p-2 rounded-lg items-center justify-center',
                    icon === ic ? 'bg-ink-900 dark:bg-ink-100' : 'active:bg-ink-200/60 dark:active:bg-ink-700/60'
                  )}
                  style={{ width: '15%' }}
                >
                  <IconHelper name={ic} size={18} color={icon === ic ? selectedAccentColor : '#8A8680'} />
                </Pressable>
              ))}
            </View>
          </View>

          {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

          <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-ink-100 dark:border-ink-800">
            <Button variant="ghost" onPress={() => setIsCreating(false)}>
              <Text className={buttonTextColor.ghost}>Back</Text>
            </Button>
            <Button variant="primary" onPress={handleSave}>
              <Text className={buttonTextColor.primary}>{editingCatId ? 'Save Changes' : 'Create Category'}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-col gap-3">
          {/* Tab Selector */}
          <View className="flex-row items-center p-1 bg-ink-100 dark:bg-ink-800/80 rounded-xl">
            <Pressable
              onPress={() => setActiveTab('EXPENSE')}
              className={cn(
                'flex-1 py-1.5 rounded-lg items-center',
                activeTab === 'EXPENSE' && 'bg-white dark:bg-ink-900'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-semibold',
                  activeTab === 'EXPENSE' ? 'text-ink-900 dark:text-ink-100' : 'text-ink-500'
                )}
              >
                Expense Categories
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('INCOME')}
              className={cn(
                'flex-1 py-1.5 rounded-lg items-center',
                activeTab === 'INCOME' && 'bg-white dark:bg-ink-900'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-semibold',
                  activeTab === 'INCOME' ? 'text-ink-900 dark:text-ink-100' : 'text-ink-500'
                )}
              >
                Income Categories
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-xs text-ink-500 font-medium">{categories.length} Categories</Text>
            <Button size="sm" onPress={handleStartCreate}>
              <Plus size={16} color="#ffffff" />
              <Text className={buttonTextColor.primary}>Add Category</Text>
            </Button>
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            <View className="flex-col gap-2">
              {categories.map((cat) => (
                <View
                  key={cat.id}
                  className="flex-row items-center justify-between p-2.5 rounded-xl bg-ink-50 dark:bg-ink-800/40 border border-ink-200/70 dark:border-ink-800"
                >
                  <View className="flex-row items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconHelper name={cat.icon} size={16} color="#ffffff" />
                    </View>
                    <View className="flex-col min-w-0">
                      <Text numberOfLines={1} className="text-xs font-semibold text-ink-900 dark:text-ink-100">
                        {cat.name}
                      </Text>
                      {cat.isArchived && (
                        <Text className="text-[10px] text-amber-600 font-medium">Archived</Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1 shrink-0">
                    <Pressable onPress={() => handleStartEdit(cat)} className="p-1 rounded active:bg-ink-200/60 dark:active:bg-ink-700/60">
                      <Edit2 size={14} color="#A79D8C" />
                    </Pressable>
                    <Pressable onPress={() => handleToggleArchive(cat)} className="p-1 rounded active:bg-ink-200/60 dark:active:bg-ink-700/60">
                      <Archive size={14} color={cat.isArchived ? '#16a34a' : '#A79D8C'} />
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
