import { dbEngine } from '../db';
import { AppDocument } from '../../types';

export const documentRepository = {
  getAll(): AppDocument[] {
    const db = dbEngine.getTables();
    return Object.values(db.documents).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getById(id: string): AppDocument | undefined {
    return dbEngine.getTables().documents[id];
  },

  create(params: {
    id: string;
    name: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    uri: string;
  }): AppDocument {
    if (!params.name.trim()) {
      throw new Error('Document name cannot be empty.');
    }

    const now = new Date().toISOString();
    const document: AppDocument = {
      id: params.id,
      name: params.name.trim(),
      originalFileName: params.originalFileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      uri: params.uri,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.documents[document.id] = document;
    });

    return document;
  },

  rename(id: string, name: string): AppDocument {
    if (!name.trim()) {
      throw new Error('Document name cannot be empty.');
    }

    const existing = dbEngine.getTables().documents[id];
    if (!existing) {
      throw new Error(`Document ${id} not found.`);
    }

    const updated: AppDocument = { ...existing, name: name.trim(), updatedAt: new Date().toISOString() };

    dbEngine.runTransaction((db) => {
      db.documents[id] = updated;
    });

    return updated;
  },

  delete(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.documents[id];
    });
  },
};
