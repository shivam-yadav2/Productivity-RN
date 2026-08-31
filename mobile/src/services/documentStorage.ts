import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { documentRepository } from '../database/repositories/documentRepo';
import { AppDocument } from '../types';

function documentsDir(): Directory {
  const dir = new Directory(Paths.document, 'documents');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** Strips characters that are awkward in a filename, keeping the name recognizable. */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'file';
}

const ICON_HINTS: { match: RegExp; icon: string }[] = [
  { match: /^application\/pdf$|\.pdf$/i, icon: 'FileText' },
  { match: /^image\//i, icon: 'Image' },
  { match: /^video\//i, icon: 'Video' },
  { match: /^audio\//i, icon: 'Music' },
  { match: /spreadsheet|excel|\.xlsx?$|\.csv$/i, icon: 'FileSpreadsheet' },
  { match: /wordprocessing|msword|\.docx?$/i, icon: 'FileText' },
  { match: /presentation|powerpoint|\.pptx?$/i, icon: 'FileText' },
  { match: /zip|compressed|archive|\.rar$|\.7z$/i, icon: 'FileArchive' },
];

/** Picks a lucide-react-native icon name for IconHelper based on mime type / file name. */
export function getDocumentIconName(mimeType: string, fileName: string): string {
  const hit = ICON_HINTS.find((h) => h.match.test(mimeType) || h.match.test(fileName));
  return hit?.icon ?? 'File';
}

/** Opens the file picker, copies the chosen file into permanent app storage, and records it. */
export async function pickAndSaveDocument(): Promise<AppDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const originalFileName = asset.name || 'Untitled';

  const sourceFile = new File(asset.uri);
  const destFile = new File(documentsDir(), `${id}_${sanitizeFileName(originalFileName)}`);
  await sourceFile.copy(destFile);

  return documentRepository.create({
    id,
    name: originalFileName,
    originalFileName,
    mimeType: asset.mimeType || 'application/octet-stream',
    sizeBytes: asset.size ?? destFile.size ?? 0,
    uri: destFile.uri,
  });
}

/** Hands the document to the OS share sheet — doubles as "view" (iOS previews before the
 *  chooser) and "download" (the sheet's Save to Files / Drive / etc. targets). */
export async function shareDocument(doc: AppDocument): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert('Not available', 'Sharing is not available on this device.');
    return;
  }
  try {
    await Sharing.shareAsync(doc.uri, { mimeType: doc.mimeType, dialogTitle: doc.name });
  } catch (error: any) {
    Alert.alert('Could not open document', error?.message || 'Please try again.');
  }
}

/** Deletes the underlying file first, then its metadata — never leaves an orphaned file. */
export function deleteDocument(doc: AppDocument): void {
  const file = new File(doc.uri);
  if (file.exists) file.delete();
  documentRepository.delete(doc.id);
}
