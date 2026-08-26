import React, { useState } from 'react';
import { taskRepository } from '../../database/repositories/taskRepo';
import { getTodayDateString } from '../../utils/date';
import { Plus, ArrowUpRight } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface TaskQuickAddProps {
  onTaskAdded?: () => void;
}

export const TaskQuickAdd: React.FC<TaskQuickAddProps> = ({ onTaskAdded }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    taskRepository.create({
      title: title.trim(),
      dueDate: getTodayDateString(),
      priority: 'MEDIUM',
    });

    audioService.playSoftClick();
    setTitle('');
    if (onTaskAdded) onTaskAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick capture task for today..."
        className="w-full pl-3.5 pr-11 py-2 text-xs bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-md text-[#1A1A1A] dark:text-[#EDEDEB] placeholder:text-[#71716E] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-white transition-all shadow-2xs"
      />
      <button
        type="submit"
        disabled={!title.trim()}
        className="absolute right-1.5 p-1.5 rounded-md bg-[#1A1A1A] text-white dark:bg-[#EDEDEB] dark:text-[#1A1A1A] disabled:opacity-30 transition-all cursor-pointer"
        aria-label="Add task"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};
