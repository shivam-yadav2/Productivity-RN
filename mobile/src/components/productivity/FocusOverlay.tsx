import React from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import { Task } from '../../types';
import { FocusTimer } from './FocusTimer';
import { FocusAnalytics } from './FocusAnalytics';
import { ink } from '../../utils/theme';

interface FocusOverlayProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
}

/**
 * Focus as a screen you enter rather than a tab you switch to.
 *
 * It sat alongside Tasks/Habits/Notes/Reminders in the segmented control, which was the
 * wrong shape: those are lists of things, this is an activity. Pulling it out both frees
 * the control back to four segments and suits a focus timer better — the point is fewer
 * distractions, which a full screen gives and a tab does not.
 *
 * Closing this does NOT end the session (see focusSession.ts); it keeps running and is
 * picked back up the next time this opens.
 */
export const FocusOverlay: React.FC<FocusOverlayProps> = ({ isOpen, task, onClose }) => {
  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-ink-50 dark:bg-ink-950">
        <View className="flex-row items-center justify-between px-4 py-2.5">
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="Close focus"
            className="p-2 -ml-2 rounded-xl active:bg-ink-100 dark:active:bg-ink-800"
          >
            <ChevronDown size={22} color={ink[500]} />
          </Pressable>
          <Text className="text-sm font-bold text-ink-900 dark:text-ink-100">Focus</Text>
          {/* Balances the close button so the title stays centred. */}
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
          <FocusTimer initialTask={task} />
          <FocusAnalytics />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
