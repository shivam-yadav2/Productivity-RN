import React, { useState } from 'react';
import { View, TextInput, Pressable, useColorScheme } from 'react-native';
import { taskRepository } from '../../database/repositories/taskRepo';
import { getTodayDateString } from '../../utils/date';
import { Plus } from 'lucide-react-native';
import { audioService } from '../../services/audioService';
import { ink } from '../../utils/theme';

interface TaskQuickAddProps {
  onTaskAdded?: () => void;
}

export const TaskQuickAdd: React.FC<TaskQuickAddProps> = ({ onTaskAdded }) => {
  const [title, setTitle] = useState('');
  const isDark = useColorScheme() === 'dark';

  const handleSubmit = () => {
    if (!title.trim()) return;

    taskRepository.create({
      title: title.trim(),
      dueDate: getTodayDateString(),
      priority: 'MEDIUM',
    });

    audioService.playSoftClick();
    setTitle('');
    onTaskAdded?.();
  };

  return (
    <View className="relative flex-row items-center w-full">
      <TextInput
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={handleSubmit}
        placeholder="Quick capture task for today..."
        placeholderTextColor={ink[500]}
        className="w-full pl-3.5 pr-11 py-2 text-xs bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-md text-ink-900 dark:text-ink-100"
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!title.trim()}
        className="absolute right-1.5 p-1.5 rounded-md bg-ink-900 dark:bg-ink-100"
        style={{ opacity: title.trim() ? 1 : 0.3 }}
        accessibilityLabel="Add task"
      >
        <Plus size={14} color={isDark ? ink[900] : '#fff'} />
      </Pressable>
    </View>
  );
};
