import { dbEngine } from '../db';
import { Account, AccountType } from '../../types';

export const accountRepository = {
  getAll(includeInactive = false): Account[] {
    const db = dbEngine.getTables();
    return Object.values(db.accounts)
      .filter((a) => includeInactive || a.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getById(id: string): Account | undefined {
    return dbEngine.getTables().accounts[id];
  },

  create(params: {
    name: string;
    type: AccountType;
    openingBalanceMinor: number;
    currency?: string;
    icon?: string;
    color?: string;
  }): Account {
    const id = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newAccount: Account = {
      id,
      name: params.name.trim(),
      type: params.type,
      openingBalanceMinor: params.openingBalanceMinor,
      currentBalanceMinor: params.openingBalanceMinor,
      currency: params.currency || 'INR',
      icon: params.icon || 'Building2',
      color: params.color || '#2563eb',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    dbEngine.runTransaction((db) => {
      db.accounts[id] = newAccount;
    });

    dbEngine.reconcileAllAccountBalances();
    return newAccount;
  },

  update(id: string, params: Partial<Omit<Account, 'id' | 'createdAt'>>): Account {
    const existing = dbEngine.getTables().accounts[id];
    if (!existing) {
      throw new Error(`Account not found with id ${id}`);
    }

    const updated: Account = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.accounts[id] = updated;
    });

    dbEngine.reconcileAllAccountBalances();
    return updated;
  },

  delete(id: string): void {
    const db = dbEngine.getTables();
    // Check if account has any historical transactions
    const hasTransactions = Object.values(db.transactions).some(
      (tx) => tx.accountId === id || tx.destinationAccountId === id
    );

    if (hasTransactions) {
      // Archive instead of delete to preserve historical integrity
      this.update(id, { isActive: false });
    } else {
      dbEngine.runTransaction((d) => {
        delete d.accounts[id];
      });
    }
  },
};
