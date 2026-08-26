import { dbEngine } from '../db';
import { Category, CategoryType } from '../../types';

export const categoryRepository = {
  getAll(type?: CategoryType, includeArchived = false): Category[] {
    const db = dbEngine.getTables();
    return Object.values(db.categories)
      .filter((c) => (!type || c.type === type) && (includeArchived || !c.isArchived))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  },

  getById(id: string): Category | undefined {
    return dbEngine.getTables().categories[id];
  },

  create(params: {
    name: string;
    type: CategoryType;
    icon?: string;
    color?: string;
  }): Category {
    const id = `cat_${params.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const existingCount = Object.values(dbEngine.getTables().categories).filter(
      (c) => c.type === params.type
    ).length;

    const newCategory: Category = {
      id,
      name: params.name.trim(),
      type: params.type,
      icon: params.icon || (params.type === 'EXPENSE' ? 'Tag' : 'Coins'),
      color: params.color || (params.type === 'EXPENSE' ? '#f97316' : '#10b981'),
      isArchived: false,
      isDefault: false,
      sortOrder: existingCount + 1,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.categories[id] = newCategory;
    });

    return newCategory;
  },

  update(id: string, params: Partial<Omit<Category, 'id' | 'createdAt'>>): Category {
    const existing = dbEngine.getTables().categories[id];
    if (!existing) {
      throw new Error(`Category not found with id ${id}`);
    }

    const updated: Category = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.categories[id] = updated;
    });

    return updated;
  },

  archive(id: string): void {
    this.update(id, { isArchived: true });
  },

  unarchive(id: string): void {
    this.update(id, { isArchived: false });
  },

  delete(id: string): void {
    const db = dbEngine.getTables();
    const isReferenced = Object.values(db.transactions).some((t) => t.categoryId === id);
    if (isReferenced) {
      // Must archive, never hard delete if referenced by historical transactions
      this.archive(id);
    } else {
      dbEngine.runTransaction((d) => {
        delete d.categories[id];
      });
    }
  },
};
