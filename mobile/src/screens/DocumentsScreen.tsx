import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search, X, FolderOpen, Plus } from 'lucide-react-native';
import { useDatabase } from '../context/DatabaseContext';
import { AppDocument } from '../types';
import { DocumentRow } from '../components/documents/DocumentRow';
import { RenameDocumentModal } from '../components/documents/RenameDocumentModal';
import { Button, buttonTextColor } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { documentRepository } from '../database/repositories/documentRepo';
import { pickAndSaveDocument, shareDocument, deleteDocument } from '../services/documentStorage';
import { audioService } from '../services/audioService';
import { cn } from '../utils/cn';

export const DocumentsScreen: React.FC = () => {
  const { db } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingDoc, setRenamingDoc] = useState<AppDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const documents = useMemo(() => {
    const all = Object.values(db.documents).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!searchQuery.trim()) return all;
    const q = searchQuery.trim().toLowerCase();
    return all.filter((d) => d.name.toLowerCase().includes(q));
  }, [db.documents, searchQuery]);

  const handleAddDocument = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const saved = await pickAndSaveDocument();
      if (saved) {
        audioService.playSuccessTone();
      }
    } catch (error: any) {
      Alert.alert('Could not add document', error?.message || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameSave = (name: string) => {
    if (!renamingDoc) return;
    try {
      documentRepository.rename(renamingDoc.id, name);
      audioService.playSuccessTone();
      setRenamingDoc(null);
    } catch (error: any) {
      Alert.alert('Could not rename document', error?.message || 'Please try again.');
    }
  };

  const handleDelete = (doc: AppDocument) => {
    Alert.alert('Delete document?', `"${doc.name}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDocument(doc);
          audioService.triggerHaptic('light');
        },
      },
    ]);
  };

  return (
    <View className="flex-1">
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 96, gap: 12 }}
        ListHeaderComponent={
          <View className="flex-col gap-3 pb-1">
            <View className="flex-row items-center justify-between pt-1">
              <View className="flex-col">
                <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Documents
                </Text>
                <Text className="text-xs text-zinc-500">
                  {documents.length} saved {documents.length === 1 ? 'document' : 'documents'}
                </Text>
              </View>
            </View>

            <View className="flex-1 relative justify-center">
              <View className="absolute left-3 z-10">
                <Search size={16} color="#71717a" />
              </View>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search documents..."
                placeholderTextColor="#a1a1aa"
                className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100"
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} className="absolute right-2.5">
                  <X size={14} color="#71717a" />
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View className="px-0 mb-2">
            <DocumentRow
              document={item}
              index={index}
              onPress={() => shareDocument(item)}
              onRename={() => setRenamingDoc(item)}
              onDelete={() => handleDelete(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="py-12 items-center justify-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
            <FolderOpen size={32} color="#a1a1aa" />
            <Text className="text-xs text-zinc-500 mt-2 text-center px-6">
              {searchQuery ? 'No documents match your search.' : 'No documents saved yet. Add one to get started.'}
            </Text>
          </View>
        }
      />

      <Animated.View
        entering={FadeInDown.springify().damping(20).mass(0.9)}
        style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}
      >
        <View
          className="bg-white/90 dark:bg-zinc-900/90 p-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80"
          style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8 }}
        >
          <Button variant="primary" onPress={handleAddDocument} disabled={isSaving} className="rounded-xl">
            {isSaving ? <Spinner size={16} color="#ffffff" trackColor="rgba(255,255,255,0.3)" /> : <Plus size={16} color="#ffffff" />}
            <Text className={cn('text-sm font-bold ml-1', buttonTextColor.primary)}>
              {isSaving ? 'Adding…' : 'Add Document'}
            </Text>
          </Button>
        </View>
      </Animated.View>

      <RenameDocumentModal
        document={renamingDoc}
        isOpen={Boolean(renamingDoc)}
        onClose={() => setRenamingDoc(null)}
        onSave={handleRenameSave}
      />
    </View>
  );
};
