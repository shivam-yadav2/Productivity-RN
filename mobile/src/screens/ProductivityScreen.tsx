import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { CheckSquare, Sparkles, Timer, Plus, CheckCircle2, StickyNote, Search, X, NotebookPen, AlarmClock } from 'lucide-react-native';
import { useDatabase } from '../context/DatabaseContext';
import { Task, Habit, Note, Reminder } from '../types';
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
import { RemindersView } from '../components/productivity/RemindersView';
import { FadeSwap } from '../components/ui/FadeSwap';
import { cn } from '../utils/cn';
import { ink } from '../utils/theme';

interface ProductivityScreenProps {
  onSelectTask: (task: Task) => void;
  onOpenNewTask: () => void;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onOpenNewNote: () => void;
  onSelectNote: (note: Note) => void;
  onOpenNewReminder: () => void;
  onSelectReminder: (reminder: Reminder) => void;
  initialFocusTask?: Task | null;
  initialSubTab?: 'TASKS' | 'HABITS' | 'FOCUS' | 'NOTES' | 'REMINDERS';
}

/**
 * These lists render straight into the screen's ScrollView, so they can't use a FlatList
 * (nesting a VirtualizedList inside a ScrollView of the same orientation breaks both).
 * Capping the mounted rows with a "show more" step is the same trade the ledger makes.
 */
const LIST_PAGE_SIZE = 30;

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
  onOpenNewReminder,
  onSelectReminder,
  initialFocusTask,
  initialSubTab,
}) => {
  const { db } = useDatabase();
  const [activeTab, setActiveTab] = useState<'TASKS' | 'HABITS' | 'FOCUS' | 'NOTES' | 'REMINDERS'>(initialSubTab || 'TASKS');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'TODAY' | 'HIGH' | 'COMPLETED'>('ALL');
  const [focusTask, setFocusTask] = useState<Task | null>(initialFocusTask || null);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [taskLimit, setTaskLimit] = useState(LIST_PAGE_SIZE);
  const [noteLimit, setNoteLimit] = useState(LIST_PAGE_SIZE);

  // A change of filter or query starts the page count over.
  useEffect(() => setTaskLimit(LIST_PAGE_SIZE), [taskFilter]);
  useEffect(() => setNoteLimit(LIST_PAGE_SIZE), [noteSearchQuery]);

  // This screen now stays mounted after its first visit (see App.tsx), so `initialFocusTask`
  // only seeding `focusTask` via useState's initializer isn't enough — that only runs once,
  // ever. Re-apply it whenever the prop actually changes (a new "Start Focus" tap from Home),
  // and jump to the Focus segment the same way starting a session from within this screen does.
  useEffect(() => {
    if (initialFocusTask) {
      setFocusTask(initialFocusTask);
      setActiveTab('FOCUS');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFocusTask]);

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
    { key: 'REMINDERS' as const, label: 'Reminders', icon: AlarmClock },
  ];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 56, gap: 16 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between pt-1">
        <View className="flex flex-col">
          <Text className="text-xl font-bold text-ink-900 dark:text-ink-100 tracking-tight">Productivity</Text>
          <Text className="text-xs text-ink-500">Tasks, daily habits & deep focus timers</Text>
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

        {activeTab === 'REMINDERS' && (
          <Button size="sm" onPress={onOpenNewReminder}>
            <Plus size={16} color="#ffffff" />
            <Text className={cn('text-xs font-medium ml-1', buttonTextColor.primary)}>New Reminder</Text>
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
                  taskFilter === f.key ? 'bg-ink-900 dark:bg-ink-100' : 'bg-ink-100 dark:bg-ink-800'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    taskFilter === f.key ? 'text-white dark:text-ink-900' : 'text-ink-600 dark:text-ink-400'
                  )}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex flex-col gap-2">
            {filteredTasks.length === 0 ? (
              <View className="py-12 items-center justify-center bg-ink-50 dark:bg-ink-800/30 rounded-3xl border border-ink-200/60 dark:border-ink-800">
                <CheckCircle2 size={32} color={ink[400]} />
                <Text className="text-xs text-ink-500 mt-2">No tasks in this filter view.</Text>
              </View>
            ) : (
              filteredTasks.slice(0, taskLimit).map((t, i) => (
                <TaskItem key={t.id} task={t} index={i} onClick={() => onSelectTask(t)} onStartFocus={() => handleStartFocus(t)} />
              ))
            )}

            {filteredTasks.length > taskLimit && (
              <Pressable
                onPress={() => setTaskLimit((c) => c + LIST_PAGE_SIZE)}
                className="py-3 items-center rounded-2xl border border-ink-200 dark:border-ink-800 active:bg-ink-100 dark:active:bg-ink-800/60"
              >
                <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">
                  Show more tasks
                </Text>
                <Text className="text-[10px] text-ink-400 mt-0.5">
                  {taskLimit} of {filteredTasks.length}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {activeTab === 'HABITS' && (
        <View className="flex flex-col gap-3">
          <Text className="text-xs text-ink-500">
            Build consistency with daily habits. Tap once to mark complete for today.
          </Text>

          <View className="flex flex-col gap-2.5">
            {habits.length === 0 ? (
              <View className="py-12 items-center justify-center bg-ink-50 dark:bg-ink-800/30 rounded-3xl border border-ink-200/60 dark:border-ink-800">
                <Sparkles size={32} color={ink[400]} />
                <Text className="text-xs text-ink-500 mt-2">No habits created yet.</Text>
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
              <Search size={16} color={ink[500]} />
            </View>
            <TextInput
              value={noteSearchQuery}
              onChangeText={setNoteSearchQuery}
              placeholder="Search notes..."
              placeholderTextColor={ink[500]}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-md text-ink-900 dark:text-ink-100"
            />
            {noteSearchQuery ? (
              <Pressable onPress={() => setNoteSearchQuery('')} className="absolute right-2.5">
                <X size={14} color={ink[500]} />
              </Pressable>
            ) : null}
          </View>

          <View className="flex flex-col gap-2">
            {filteredNotes.length === 0 ? (
              <View className="py-12 items-center justify-center bg-ink-50 dark:bg-ink-800/30 rounded-3xl border border-ink-200/60 dark:border-ink-800">
                <NotebookPen size={32} color={ink[400]} />
                <Text className="text-xs text-ink-500 mt-2">
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
              filteredNotes.slice(0, noteLimit).map((n, i) => (
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

            {filteredNotes.length > noteLimit && (
              <Pressable
                onPress={() => setNoteLimit((c) => c + LIST_PAGE_SIZE)}
                className="py-3 items-center rounded-2xl border border-ink-200 dark:border-ink-800 active:bg-ink-100 dark:active:bg-ink-800/60"
              >
                <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">
                  Show more notes
                </Text>
                <Text className="text-[10px] text-ink-400 mt-0.5">
                  {noteLimit} of {filteredNotes.length}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {activeTab === 'REMINDERS' && (
        <RemindersView
          onOpenNewReminder={onOpenNewReminder}
          onSelectReminder={onSelectReminder}
        />
      )}
      </FadeSwap>
    </ScrollView>
  );
};
