import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, ArrowLeft } from 'lucide-react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { searchAll, SearchResult } from '../../services/searchService';
import { getDocumentIconName } from '../../services/documentStorage';
import { IconHelper } from '../ui/IconHelper';

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
}

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  transaction: 'Transaction',
  task: 'Task',
  habit: 'Habit',
  document: 'Document',
  note: 'Note',
};

function resultIconName(result: SearchResult): string {
  switch (result.type) {
    case 'transaction':
      return 'Receipt';
    case 'task':
      return 'CheckSquare';
    case 'habit':
      return 'Sparkles';
    case 'document':
      return getDocumentIconName(result.item.mimeType, result.item.originalFileName);
    case 'note':
      return 'StickyNote';
  }
}

export const GlobalSearchOverlay: React.FC<GlobalSearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const { db } = useDatabase();
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => searchAll(query, db.settings.currency || 'INR'),
    [query, db]
  );

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <Pressable onPress={handleClose} className="p-1.5 active:bg-zinc-100 dark:active:bg-zinc-800 rounded-lg">
            <ArrowLeft size={20} color="#71717a" />
          </Pressable>

          <View className="flex-1 relative justify-center">
            <View className="absolute left-3 z-10">
              <Search size={16} color="#71717a" />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search transactions, tasks, habits, documents, notes..."
              placeholderTextColor="#a1a1aa"
              autoFocus
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} className="absolute right-2.5">
                <X size={14} color="#71717a" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}_${item.id}`}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelectResult(item);
                setQuery('');
              }}
              className="flex-row items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
            >
              <View className="w-9 h-9 rounded-xl items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                <IconHelper name={resultIconName(item)} size={18} color="#2563eb" />
              </View>
              <View className="flex-1 min-w-0">
                <Text numberOfLines={1} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </Text>
                <Text numberOfLines={1} className="text-xs text-zinc-500 dark:text-zinc-400">
                  {TYPE_LABEL[item.type]} • {item.subtitle}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            query.trim() ? (
              <View className="py-12 items-center">
                <Text className="text-xs text-zinc-500 text-center">No results for "{query.trim()}".</Text>
              </View>
            ) : (
              <View className="py-12 items-center">
                <Text className="text-xs text-zinc-500 text-center">
                  Search across transactions, tasks, habits, documents, and notes.
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </Modal>
  );
};
