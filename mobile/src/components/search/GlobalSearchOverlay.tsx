import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, ArrowLeft } from 'lucide-react-native';
import { useDatabase } from '../../context/DatabaseContext';
import { searchAll, SearchResult } from '../../services/searchService';
import { getDocumentIconName } from '../../services/documentStorage';
import { IconHelper } from '../ui/IconHelper';
import { ink } from '../../utils/theme';

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
      <SafeAreaView className="flex-1 bg-white dark:bg-ink-950">
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-ink-100 dark:border-ink-800">
          <Pressable onPress={handleClose} className="p-1.5 active:bg-ink-100 dark:active:bg-ink-800 rounded-lg">
            <ArrowLeft size={20} color={ink[500]} />
          </Pressable>

          <View className="flex-1 relative justify-center">
            <View className="absolute left-3 z-10">
              <Search size={16} color={ink[500]} />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search transactions, tasks, habits, documents, notes..."
              placeholderTextColor={ink[400]}
              autoFocus
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-ink-100 dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl text-ink-900 dark:text-ink-100"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} className="absolute right-2.5">
                <X size={14} color={ink[500]} />
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
              className="flex-row items-center gap-3 p-3 rounded-3xl bg-ink-50 dark:bg-ink-900 border border-ink-200/70 dark:border-ink-800 active:bg-ink-100 dark:active:bg-ink-800"
            >
              <View className="w-9 h-9 rounded-xl items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                <IconHelper name={resultIconName(item)} size={18} color="#2563eb" />
              </View>
              <View className="flex-1 min-w-0">
                <Text numberOfLines={1} className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                  {item.title}
                </Text>
                <Text numberOfLines={1} className="text-xs text-ink-500 dark:text-ink-400">
                  {TYPE_LABEL[item.type]} • {item.subtitle}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            query.trim() ? (
              <View className="py-12 items-center">
                <Text className="text-xs text-ink-500 text-center">No results for "{query.trim()}".</Text>
              </View>
            ) : (
              <View className="py-12 items-center">
                <Text className="text-xs text-ink-500 text-center">
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
