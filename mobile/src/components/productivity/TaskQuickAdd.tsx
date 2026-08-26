import React, { useState } from 'react';
import { View, TextInput, Pressable, useColorScheme } from 'react-native';
import { taskRepository } from '../../database/repositories/taskRepo';
import { getTodayDateString } from '../../utils/date';
import { Plus } from 'lucide-react-native';
import { audioService } from '../../services/audioService';

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
        placeholderTextColor="#71716E"
        className="w-full pl-3.5 pr-11 py-2 text-xs bg-white dark:bg-[#1A1A19] border border-[#E5E5E2] dark:border-[#2C2C29] rounded-md text-[#1A1A1A] dark:text-[#EDEDEB]"
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!title.trim()}
        className="absolute right-1.5 p-1.5 rounded-md bg-[#1A1A1A] dark:bg-[#EDEDEB]"
        style={{ opacity: title.trim() ? 1 : 0.3 }}
        accessibilityLabel="Add task"
      >
        <Plus size={14} color={isDark ? '#1A1A1A' : '#fff'} />
      </Pressable>
    </View>
  );
};
