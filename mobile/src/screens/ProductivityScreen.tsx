import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { CheckSquare, Sparkles, Timer, Plus, CheckCircle2, StickyNote, Search, X, NotebookPen } from 'lucide-react-native';
import { useDatabase } from '../context/DatabaseContext';
import { Task, Habit, Note } from '../types';
import { TaskItem } from '../components/productivity/TaskItem';
import { TaskQuickAdd } from '../components/productivity/TaskQuickAdd';
import { HabitCard } from '../components/productivity/HabitCard';
import { NoteItem } from '../components/productivity/NoteItem';
import { FocusTimer } from '../components/productivity/FocusTimer';
import { FocusAnalytics } from '../components/productivity/FocusAnalytics';
import { noteRepository } from '../database/repositories/noteRepo';
import { audioService } from '../services/audioService';
import { Button, buttonTextColor } from '../components/ui/Button';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { FadeSwap } from '../components/ui/FadeSwap';
import { cn } from '../utils/cn';

interface ProductivityScreenProps {
  onSelectTask: (task: Task) => void;
  onOpenNewTask: () => void;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onOpenNewNote: () => void;
  onSelectNote: (note: Note) => void;
  initialFocusTask?: Task | null;
  initialSubTab?: 'TASKS' | 'HABITS' | 'FOCUS' | 'NOTES';
}

const taskFilters = [
  { key: 'ALL' as const, label: 'All Tasks' },
  { key: 'TODAY' as const, label: 'Due Today' },
  { key: 'HIGH' as const, label: 'Priority' },
  { key: 'COMPLETED' as const, label: 'Completed' },
];

export const ProductivityScreen: React.FC<ProductivityScreenProps> = ({
  onSelectTask,
  onOpenNewTask,
  onOpenNewHabit,
  onEditHabit,
  onOpenNewNote,
  onSelectNote,
  initialFocusTask,
  initialSubTab,
}) => {
  const { db } = useDatabase();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'HABITS' | 'FOCUS' | 'NOTES'>(initialSubTab || 'TASKS');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'TODAY' | 'HIGH' | 'COMPLETED'>('ALL');
  const [focusTask, setFocusTask] = useState<Task | null>(initialFocusTask || null);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  const tasks = Object.values(db.tasks);
  const habits = Object.values(db.habits);

  const notes = useMemo(() => {
    return noteRepository.getAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.notes]);

  const filteredNotes = useMemo(() => {
    const q = noteSearchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notes, noteSearchQuery]);

  const handleDeleteNote = (note: Note) => {
    Alert.alert('Delete note?', 'This note will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          noteRepository.delete(note.id);
          audioService.triggerHaptic('light');
        },
      },
    ]);
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (taskFilter === 'COMPLETED') return t.status === 'COMPLETED';
        if (t.status === 'COMPLETED' && taskFilter !== 'ALL') return false;

        if (taskFilter === 'TODAY') {
          const todayStr = new Date().toISOString().split('T')[0];
          return t.dueDate === todayStr;
        }
        if (taskFilter === 'HIGH') {
          return t.priority === 'HIGH' || t.priority === 'URGENT';
        }
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
        return (b.dueDate || '').localeCompare(a.dueDate || '');
      });
  }, [tasks, taskFilter]);

  const handleStartFocus = (task: Task) => {
    setFocusTask(task);
    setActiveTab('FOCUS');
  };

  const tabs = [
    { key: 'TASKS' as const, label: `Tasks (${tasks.filter((t) => t.status !== 'COMPLETED').length})`, icon: CheckSquare },
    { key: 'HABITS' as const, label: `Habits (${habits.length})`, icon: Sparkles },
    { key: 'FOCUS' as const, label: 'Focus', icon: Timer },
    { key: 'NOTES' as const, label: `Notes (${notes.length})`, icon: StickyNote },
  ];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 56, gap: 16 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between pt-1">
        <View className="flex flex-col">
          <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Productivity</Text>
          <Text className="text-xs text-zinc-500">Tasks, daily habits & deep focus timers</Text>
        </View>

        {activeTab === 'TASKS' && (
          <Button size="sm" onPress={onOpenNewTask}>
            <Plus size={16} color="#ffffff" />
            <Text className={cn('text-xs font-medium ml-1', buttonTextColor.primary)}>New Task</Text>
          </Button>
        )}

        {activeTab === 'HABITS' && (
          <Button size="sm" onPress={onOpenNewHabit}>
            <Plus size={16} color="#ffffff" />
            <Text className={cn('text-xs font-medium ml-1', buttonTextColor.primary)}>New Habit</Text>
          </Button>
        )}

        {activeTab === 'NOTES' && (
          <Button size="sm" onPress={onOpenNewNote}>
            <Plus size={16} color="#ffffff" />
            <Text className={cn('text-xs font-medium ml-1', buttonTextColor.primary)}>New Note</Text>
          </Button>
        )}
      </View>

      {/* Main Tab Navigation */}
      <SegmentedControl
        segments={tabs.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Contents */}
      <FadeSwap swapKey={activeTab}>
      {activeTab === 'TASKS' && (
        <View className="flex flex-col gap-3">
          <TaskQuickAdd />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {taskFilters.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setTaskFilter(f.key)}
                className={cn(
                  'px-3 py-1 rounded-lg',
                  taskFilter === f.key ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-100 dark:bg-zinc-800'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    taskFilter === f.key ? 'text-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'
                  )}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex flex-col gap-2">
            {filteredTasks.length === 0 ? (
              <View className="py-12 items-center justify-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                <CheckCircle2 size={32} color="#a1a1aa" />
                <Text className="text-xs text-zinc-500 mt-2">No tasks in this filter view.</Text>
              </View>
            ) : (
              filteredTasks.map((t, i) => (
                <TaskItem key={t.id} task={t} index={i} onClick={() => onSelectTask(t)} onStartFocus={() => handleStartFocus(t)} />
              ))
            )}
          </View>
        </View>
      )}

      {activeTab === 'HABITS' && (
        <View className="flex flex-col gap-3">
          <Text className="text-xs text-zinc-500">
            Build consistency with daily habits. Tap once to mark complete for today.
          </Text>

          <View className="flex flex-col gap-2.5">
            {habits.length === 0 ? (
              <View className="py-12 items-center justify-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                <Sparkles size={32} color="#a1a1aa" />
                <Text className="text-xs text-zinc-500 mt-2">No habits created yet.</Text>
                <Button size="sm" className="mt-3" onPress={onOpenNewHabit}>
                  <Plus size={16} color="#ffffff" />
                  <Text className={cn('text-xs font-medium ml-1', buttonTextColor.primary)}>Add Your First Habit</Text>
                </Button>
              </View>
            ) : (
              habits.map((h, i) => <HabitCard key={h.id} habit={h} index={i} onEdit={onEditHabit} />)
            )}
          </View>
        </View>
      )}

      {activeTab === 'FOCUS' && (
        <View className="flex flex-col gap-4">
          <FocusTimer initialTask={focusTask} />
          <FocusAnalytics />
        </View>
      )}

      {activeTab === 'NOTES' && (
        <View className="flex flex-col gap-3">
          <View className="relative justify-center">
            <View className="absolute left-3 z-10">
              <Search size={16} color="#71716E" />
            </View>
            <TextInput
              value={noteSearchQuery}
              onChangeText={setNoteSearchQuery}
              placeholder="Search notes..."
              placeholderTextColor="#71716E"
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100"
            />
            {noteSearchQuery ? (
              <Pressable onPress={() => setNoteSearchQuery('')} className="absolute right-2.5">
                <X size={14} color="#71716E" />
              </Pressable>
            ) : null}
          </View>

          <View className="flex flex-col gap-2">
            {filteredNotes.length === 0 ? (
              <View className="py-12 items-center justify-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                <NotebookPen size={32} color="#a1a1aa" />
                <Text className="text-xs text-zinc-500 mt-2">
                  {noteSearchQuery ? 'No notes match your search.' : 'No notes yet.'}
                </Text>
                {!noteSearchQuery && (
                  <Button size="sm" className="mt-3" onPress={onOpenNewNote}>
                    <Plus size={16} color="#ffffff" />
                    <Text className={cn('text-xs font-medium ml-1', buttonTextColor.primary)}>Write Your First Note</Text>
                  </Button>
                )}
              </View>
            ) : (
              filteredNotes.map((n, i) => (
                <NoteItem
                  key={n.id}
                  note={n}
                  index={i}
                  onPress={() => onSelectNote(n)}
                  onTogglePin={() => noteRepository.togglePin(n.id)}
                  onDelete={() => handleDeleteNote(n)}
                />
              ))
            )}
          </View>
        </View>
      )}
      </FadeSwap>
    </ScrollView>
  );
};
