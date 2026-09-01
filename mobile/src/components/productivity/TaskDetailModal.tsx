import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, useColorScheme } from 'react-native';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { taskRepository } from '../../database/repositories/taskRepo';
import { getTodayDateString } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DateField } from '../ui/DateField';
import { Trash2, Play } from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStartFocus?: (task: Task) => void;
}

const PRIORITY_OPTIONS: { label: string; value: TaskPriority }[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
];

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: 'To Do', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Inbox', value: 'INBOX' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onStartFocus,
}) => {
  const isDark = useColorScheme() === 'dark';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setTags(task.tags || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setDueDate(getTodayDateString());
      setDueTime('');
      setTags([]);
    }
    setError('');
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      if (task) {
        taskRepository.update(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      } else {
        taskRepository.create({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
      }

      audioService.playSuccessTone();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save task');
    }
  };

  const handleDelete = () => {
    if (task) {
      taskRepository.delete(task.id);
      audioService.triggerHaptic('light');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Task Details' : 'New Task'} maxWidth="sm">
      <View className="flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="Task title..."
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <View className="flex flex-col gap-1.5">
          <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">Description</Text>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="Add extra details, notes, or checklists..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            className="w-full px-3 py-2 text-xs rounded-xl bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-900 dark:text-ink-100"
            style={{ textAlignVertical: 'top', minHeight: 72 }}
          />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Select label="Priority" value={priority} onChange={(v) => setPriority(v as TaskPriority)} options={PRIORITY_OPTIONS} />
          </View>
          <View className="flex-1">
            <Select label="Status" value={status} onChange={(v) => setStatus(v as TaskStatus)} options={STATUS_OPTIONS} />
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <DateField mode="date" label="Due Date" value={dueDate} onChange={setDueDate} />
          </View>
          <View className="flex-1">
            <DateField mode="time" label="Due Time" value={dueTime} onChange={setDueTime} />
          </View>
        </View>

        {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

        <View className="flex-row items-center justify-between pt-3 border-t border-ink-100 dark:border-ink-800">
          {task ? (
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={handleDelete}
                className="p-2 rounded-xl active:bg-rose-50 dark:active:bg-rose-950/40"
                accessibilityLabel="Delete task"
              >
                <Trash2 size={16} color="#e11d48" />
              </Pressable>
              {onStartFocus && status !== 'COMPLETED' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    onClose();
                    onStartFocus(task);
                  }}
                >
                  <Play size={14} color={isDark ? '#EDEAE4' : '#18161D'} />
                  <Text className={cn('text-sm font-medium ml-1', buttonTextColor.secondary)}>Focus</Text>
                </Button>
              )}
            </View>
          ) : (
            <View />
          )}

          <View className="flex-row items-center gap-2">
            <Button variant="ghost" size="sm" onPress={onClose}>
              <Text className={cn('text-sm font-medium', buttonTextColor.ghost)}>Cancel</Text>
            </Button>
            <Button size="sm" variant="primary" onPress={handleSave}>
              <Text className={cn('text-sm font-medium', buttonTextColor.primary)}>
                {task ? 'Update Task' : 'Save Task'}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
