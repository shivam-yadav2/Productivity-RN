import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Pin, Trash2 } from 'lucide-react-native';
import { Note } from '../../types';
import { formatDateDisplay } from '../../utils/date';
import { listItemEntering, listItemExiting, listItemLayout } from '../ui/listMotion';
import { ink } from '../../utils/theme';

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
        className="flex-row items-start justify-between p-3 rounded-3xl bg-ink-50 dark:bg-ink-800/50 border border-ink-200/70 dark:border-ink-800 active:bg-ink-100 dark:active:bg-ink-800"
      >
        <View className="flex-col min-w-0 flex-1 pr-2">
          <View className="flex-row items-center gap-1.5 min-w-0">
            <Text numberOfLines={1} className="text-sm font-semibold text-ink-900 dark:text-ink-100 flex-1 min-w-0">
              {displayTitle}
            </Text>
          </View>

          {note.body ? (
            <Text numberOfLines={2} className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              {note.body}
            </Text>
          ) : null}

          <Text className="text-[11px] font-medium text-ink-400 dark:text-ink-500 mt-1.5">
            {formatDateDisplay(note.updatedAt.split('T')[0])}
          </Text>
        </View>

        <View className="flex-row items-center gap-1 shrink-0">
          <Pressable
            onPress={onTogglePin}
            hitSlop={6}
            className="p-1.5 active:bg-ink-200/60 dark:active:bg-ink-700 rounded-lg"
            accessibilityLabel={note.pinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin
              size={16}
              color={note.pinned ? '#f59e0b' : ink[400]}
              fill={note.pinned ? '#f59e0b' : 'transparent'}
            />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={6}
            className="p-1.5 active:bg-rose-100 dark:active:bg-rose-950/60 rounded-lg"
            accessibilityLabel="Delete note"
          >
            <Trash2 size={16} color={ink[400]} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};
