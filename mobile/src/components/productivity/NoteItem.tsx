import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Pin, Trash2 } from 'lucide-react-native';
import { Note } from '../../types';
import { formatDateDisplay } from '../../utils/date';
import { listItemEntering, listItemExiting, listItemLayout } from '../ui/listMotion';

interface NoteItemProps {
  note: Note;
  index: number;
  onPress: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note, index, onPress, onTogglePin, onDelete }) => {
  const firstBodyLine = note.body.split('\n')[0]?.trim();
  const displayTitle = note.title || firstBodyLine || 'Untitled Note';

  return (
    <Animated.View
      entering={listItemEntering(index)}
      exiting={listItemExiting}
      layout={listItemLayout}
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-start justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
      >
        <View className="flex-col min-w-0 flex-1 pr-2">
          <View className="flex-row items-center gap-1.5 min-w-0">
            <Text numberOfLines={1} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex-1 min-w-0">
              {displayTitle}
            </Text>
          </View>

          {note.body ? (
            <Text numberOfLines={2} className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {note.body}
            </Text>
          ) : null}

          <Text className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-1.5">
            {formatDateDisplay(note.updatedAt.split('T')[0])}
          </Text>
        </View>

        <View className="flex-row items-center gap-1 shrink-0">
          <Pressable
            onPress={onTogglePin}
            hitSlop={6}
            className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg"
            accessibilityLabel={note.pinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin
              size={16}
              color={note.pinned ? '#f59e0b' : '#a1a1aa'}
              fill={note.pinned ? '#f59e0b' : 'transparent'}
            />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={6}
            className="p-1.5 active:bg-rose-100 dark:active:bg-rose-950/60 rounded-lg"
            accessibilityLabel="Delete note"
          >
            <Trash2 size={16} color="#a1a1aa" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};
