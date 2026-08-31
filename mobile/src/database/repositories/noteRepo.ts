import { dbEngine } from '../db';
import { Note } from '../../types';

export const noteRepository = {
  getAll(): Note[] {
    const db = dbEngine.getTables();
    return Object.values(db.notes).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  },

  getById(id: string): Note | undefined {
    return dbEngine.getTables().notes[id];
  },

  create(params: { title: string; body: string }): Note {
    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const note: Note = {
      id,
      title: params.title.trim(),
      body: params.body.trim(),
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.notes[id] = note;
    });

    return note;
  },

  update(id: string, params: Partial<Omit<Note, 'id' | 'createdAt'>>): Note {
    const existing = dbEngine.getTables().notes[id];
    if (!existing) {
      throw new Error(`Note ${id} not found.`);
    }

    const updated: Note = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.notes[id] = updated;
    });

    return updated;
  },

  togglePin(id: string): Note {
    const existing = dbEngine.getTables().notes[id];
    if (!existing) {
      throw new Error(`Note ${id} not found.`);
    }

    return this.update(id, { pinned: !existing.pinned });
  },

  delete(id: string): void {
    dbEngine.runTransaction((db) => {
      delete db.notes[id];
    });
  },
};
