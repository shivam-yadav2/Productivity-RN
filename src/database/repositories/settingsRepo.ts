import { dbEngine } from '../db';
import { AppSettings } from '../../types';
import { DEFAULT_SETTINGS } from '../initialData';

export const settingsRepository = {
  get(): AppSettings {
    const db = dbEngine.getTables();
    return db.settings || { ...DEFAULT_SETTINGS };
  },

  update(params: Partial<AppSettings>): AppSettings {
    const current = this.get();
    const updated: AppSettings = {
      ...current,
      ...params,
    };

    dbEngine.runTransaction((db) => {
      db.settings = updated;
    });

    return updated;
  },
};
