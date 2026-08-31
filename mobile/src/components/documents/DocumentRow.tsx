import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Edit2, Trash2 } from 'lucide-react-native';
import { AppDocument } from '../../types';
import { IconHelper } from '../ui/IconHelper';
import { getDocumentIconName } from '../../services/documentStorage';
import { formatDateDisplay } from '../../utils/date';
import { listItemEntering, listItemExiting, listItemLayout } from '../ui/listMotion';

interface DocumentRowProps {
  document: AppDocument;
  index: number;
  onPress: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DocumentRow: React.FC<DocumentRowProps> = ({ document, index, onPress, onRename, onDelete }) => {
  const iconName = getDocumentIconName(document.mimeType, document.originalFileName);

  return (
    <Animated.View
      entering={listItemEntering(index)}
      exiting={listItemExiting}
      layout={listItemLayout}
    >
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
      >
        <View className="flex-row items-center gap-3 flex-1 min-w-0 pr-2">
          <View className="w-10 h-10 rounded-xl items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
            <IconHelper name={iconName} size={20} color="#2563eb" />
          </View>

          <View className="flex-col min-w-0">
            <Text numberOfLines={1} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {document.name}
            </Text>
            <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {formatFileSize(document.sizeBytes)} • {formatDateDisplay(document.createdAt.split('T')[0])}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1 shrink-0">
          <Pressable onPress={onRename} className="p-1.5 active:bg-zinc-200/60 dark:active:bg-zinc-700 rounded-lg">
            <Edit2 size={16} color="#71717a" />
          </Pressable>
          <Pressable onPress={onDelete} className="p-1.5 active:bg-rose-100 dark:active:bg-rose-950/60 rounded-lg">
            <Trash2 size={16} color="#a1a1aa" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};
