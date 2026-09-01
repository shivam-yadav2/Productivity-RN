import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppDocument } from '../../types';
import { Modal } from '../ui/Modal';
import { Button, buttonTextColor } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

interface RenameDocumentModalProps {
  document: AppDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const RenameDocumentModal: React.FC<RenameDocumentModalProps> = ({
  document,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (document) {
      setName(document.name);
      setError('');
    }
  }, [document]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    onSave(name.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Document" maxWidth="sm">
      <View className="flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setError('');
          }}
          autoFocus
        />

        {error ? <Text className="text-xs text-rose-500 font-semibold">{error}</Text> : null}

        <View className="flex-row items-center justify-end gap-2 pt-2 border-t border-ink-100 dark:border-ink-800">
          <Button variant="ghost" onPress={onClose}>
            <Text className={buttonTextColor.ghost}>Cancel</Text>
          </Button>
          <Button variant="primary" onPress={handleSave}>
            <Text className={cn(buttonTextColor.primary)}>Save</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
};
