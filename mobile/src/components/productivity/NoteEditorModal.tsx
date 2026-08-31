import React, { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Note } from '../../types';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { audioService } from '../../services/audioService';
import { cn } from '../../utils/cn';

interface NoteEditorModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: { title: string; body: string }) => void;
  onDelete?: () => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(note?.title || '');
      setBody(note?.body || '');
    }
  }, [note, isOpen]);

  const handleSave = () => {
    onSave({ title: title.trim(), body: body.trim() });
    audioService.playSuccessTone();
    audioService.triggerHaptic('light');
  };

  const handleDelete = () => {
    onDelete?.();
    audioService.triggerHaptic('light');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={note ? 'Edit Note' : 'New Note'} maxWidth="md">
      <View className="flex-col gap-4">
        <Input
          placeholder="Title (optional)"
          value={title}
          onChangeText={setTitle}
          autoFocus={!note}
        />

        <View className="w-full flex flex-col gap-1.5">
          <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Body</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write your note here..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100"
            style={{ minHeight: 160 }}
          />
        </View>

        <View className="flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {note && onDelete ? (
            <Button variant="ghost" onPress={handleDelete}>
              <Text className="text-rose-600 dark:text-rose-400 font-medium">Delete</Text>
            </Button>
          ) : (
            <View />
          )}

          <View className="flex-row items-center gap-2">
            <Button variant="ghost" onPress={onClose}>
              <Text className={buttonTextColor.ghost}>Cancel</Text>
            </Button>
            <Button variant="primary" onPress={handleSave}>
              <Text className={cn(buttonTextColor.primary)}>Save</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
