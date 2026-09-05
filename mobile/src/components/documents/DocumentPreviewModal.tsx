import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, Image, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { File } from 'expo-file-system';
import { ArrowLeft, Share2, Edit2, Trash2, FileWarning } from 'lucide-react-native';
import { AppDocument } from '../../types';
import { IconHelper } from '../ui/IconHelper';
import { getDocumentIconName } from '../../services/documentStorage';
import { ink } from '../../utils/theme';

interface DocumentPreviewModalProps {
  document: AppDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
}

type PreviewKind = 'image' | 'pdf' | 'text' | 'unsupported';

const TEXT_MIME_HINTS = /^text\/|\/json$|\.(txt|md|markdown|json|csv|log)$/i;

function previewKindFor(doc: AppDocument): PreviewKind {
  if (/^image\//i.test(doc.mimeType)) return 'image';
  if (/^application\/pdf$|\.pdf$/i.test(doc.mimeType) || /\.pdf$/i.test(doc.originalFileName)) return 'pdf';
  if (TEXT_MIME_HINTS.test(doc.mimeType) || TEXT_MIME_HINTS.test(doc.originalFileName)) return 'text';
  return 'unsupported';
}

/**
 * In-app preview instead of always handing the file straight to the OS share sheet.
 * Images and text render directly; PDFs go through a WebView pointed at the local file
 * (reliable on iOS's WebKit, which has PDF viewing built in — Android's System WebView
 * varies more by device/version, so this is a best-effort, not a guarantee, there).
 * Anything else (docx, xlsx, pptx, zip, ...) has no reasonable in-app renderer without a
 * much heavier dependency, so it falls back to the share sheet, same as before.
 */
export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  isOpen,
  onClose,
  onShare,
  onRename,
  onDelete,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textError, setTextError] = useState(false);
  const isDark = useColorScheme() === 'dark';
  const onDarkButtonBg = isDark ? ink[900] : '#FFFFFF';

  const kind = document ? previewKindFor(document) : 'unsupported';

  useEffect(() => {
    setTextContent(null);
    setTextError(false);
    if (isOpen && document && kind === 'text') {
      new File(document.uri)
        .text()
        .then(setTextContent)
        .catch(() => setTextError(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, document?.id, kind]);

  if (!document) return null;
  const iconName = getDocumentIconName(document.mimeType, document.originalFileName);

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-ink-950">
        <View className="flex-row items-center justify-between px-3 py-2 border-b border-ink-100 dark:border-ink-800">
          <Pressable onPress={onClose} className="p-2 -ml-1 active:bg-ink-100 dark:active:bg-ink-800 rounded-lg">
            <ArrowLeft size={20} color={ink[500]} />
          </Pressable>
          <Text numberOfLines={1} className="flex-1 mx-2 text-sm font-semibold text-ink-900 dark:text-ink-100 text-center">
            {document.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <Pressable onPress={onRename} className="p-2 active:bg-ink-100 dark:active:bg-ink-800 rounded-lg">
              <Edit2 size={17} color={ink[500]} />
            </Pressable>
            <Pressable onPress={onShare} className="p-2 active:bg-ink-100 dark:active:bg-ink-800 rounded-lg">
              <Share2 size={17} color={ink[500]} />
            </Pressable>
            <Pressable onPress={onDelete} className="p-2 active:bg-rose-50 dark:active:bg-rose-950/40 rounded-lg">
              <Trash2 size={17} color="#e11d48" />
            </Pressable>
          </View>
        </View>

        <View className="flex-1">
          {kind === 'image' && (
            <Image source={{ uri: document.uri }} style={{ flex: 1 }} resizeMode="contain" />
          )}

          {kind === 'pdf' && (
            <WebView source={{ uri: document.uri }} style={{ flex: 1 }} originWhitelist={['*']} />
          )}

          {kind === 'text' && (
            <>
              {textContent == null && !textError && (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator color={ink[500]} />
                </View>
              )}
              {textError && (
                <View className="flex-1 items-center justify-center px-8">
                  <Text className="text-xs text-ink-500 text-center">Couldn't read this file's contents.</Text>
                </View>
              )}
              {textContent != null && (
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
                  <Text className="text-xs font-mono text-ink-800 dark:text-ink-200 leading-5">{textContent}</Text>
                </ScrollView>
              )}
            </>
          )}

          {kind === 'unsupported' && (
            <View className="flex-1 items-center justify-center px-8 gap-3">
              <View className="w-14 h-14 rounded-2xl bg-ink-100 dark:bg-ink-800 items-center justify-center">
                <IconHelper name={iconName} size={26} color={ink[400]} />
              </View>
              <View className="items-center gap-1">
                <View className="flex-row items-center gap-1.5">
                  <FileWarning size={14} color={ink[400]} />
                  <Text className="text-xs font-semibold text-ink-700 dark:text-ink-300">No in-app preview for this file type</Text>
                </View>
                <Text className="text-[11px] text-ink-400 text-center">
                  Share it to open it with another app on your phone instead.
                </Text>
              </View>
              <Pressable onPress={onShare} className="mt-2 px-4 py-2 bg-ink-900 dark:bg-ink-100 rounded-xl flex-row items-center gap-1.5">
                <Share2 size={14} color={onDarkButtonBg} />
                <Text className="text-xs font-semibold" style={{ color: onDarkButtonBg }}>Share / Open with…</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};
