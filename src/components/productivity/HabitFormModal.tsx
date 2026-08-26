import React, { useState, useEffect } from 'react';
import { Habit } from '../../types';
import { habitRepository } from '../../database/repositories/habitRepo';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconHelper } from '../ui/IconHelper';
import { Trash2 } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface HabitFormModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
}

const HABIT_ICONS = [
  'Flame', 'Dumbbell', 'Brain', 'BookOpen', 'GlassWater', 'Heart',
  'Moon', 'Smile', 'Sun', 'Target', 'Coffee', 'Laptop', 'CheckCircle2',
];

const HABIT_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#14b8a6', '#6366f1', '#06b6d4', '#64748b',
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({ habit, isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState('#f59e0b');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [error, setError] = useState('');

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || '');
      setIcon(habit.icon);
      setColor(habit.color);
      setTargetDaysPerWeek(habit.targetDaysPerWeek);
    } else {
      setName('');
      setDescription('');
      setIcon('Flame');
      setColor('#f59e0b');
      setTargetDaysPerWeek(7);
    }
    setError('');
  }, [habit, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    try {
      if (habit) {
        habitRepository.update(habit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          color,
          targetDaysPerWeek,
        });
      } else {
        habitRepository.create({
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
          color,
          targetDaysPerWeek,
        });
      }

      audioService.playSuccessTone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save habit');
    }
  };

  const handleDelete = () => {
    if (habit) {
      habitRepository.delete(habit.id);
      audioService.triggerHaptic('light');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit ? 'Edit Habit' : 'New Daily Habit'}
      maxWidth="sm"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Habit Name"
          placeholder="e.g. Read 20 mins, Morning run, Daily meditation"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Input
          label="Notes / Intent (Optional)"
          placeholder="e.g. Drink 300ml right after waking up"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Color & Icon */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Color & Icon
          </label>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {HABIT_COLORS.map((c) => (
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

          <div className="grid grid-cols-6 gap-1.5 p-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
            {HABIT_ICONS.map((ic) => (
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

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {habit ? (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              title="Delete habit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary">
              {habit ? 'Update Habit' : 'Create Habit'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
