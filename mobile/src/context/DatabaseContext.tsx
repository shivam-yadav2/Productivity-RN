import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbEngine, DatabaseTables } from '../database/db';

interface DatabaseContextType {
  db: DatabaseTables;
  isReady: boolean;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

/**
 * dbEngine mutates each table's Record in place (e.g. `db.documents[id] = doc`), so a
 * shallow `{ ...tables }` spread leaves every nested table at its OLD object reference —
 * any `useMemo`/`useCallback` keyed on `db.someTable` then sees "no change" and returns a
 * stale cached value, even though a re-render did happen and the data underneath it did
 * change. Spreading every table one level deeper gives each one a fresh reference on
 * every update, so reference-equality checks downstream actually work.
 */
function cloneTables(tables: DatabaseTables): DatabaseTables {
  return {
    accounts: { ...tables.accounts },
    categories: { ...tables.categories },
    transactions: { ...tables.transactions },
    budgets: { ...tables.budgets },
    recurringTransactions: { ...tables.recurringTransactions },
    tasks: { ...tables.tasks },
    habits: { ...tables.habits },
    habitLogs: { ...tables.habitLogs },
    focusSessions: { ...tables.focusSessions },
    documents: { ...tables.documents },
    savingsGoals: { ...tables.savingsGoals },
    debts: { ...tables.debts },
    notes: { ...tables.notes },
    settings: tables.settings,
  };
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [db, setDb] = useState<DatabaseTables>(() => dbEngine.getTables());

  useEffect(() => {
    let isMounted = true;
    dbEngine.init().then(() => {
      if (isMounted) {
        setDb(cloneTables(dbEngine.getTables()));
        setIsReady(true);
      }
    });

    const unsubscribe = dbEngine.subscribe(() => {
      if (isMounted) {
        setDb(cloneTables(dbEngine.getTables()));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refresh = () => {
    setDb(cloneTables(dbEngine.getTables()));
  };

  return (
    <DatabaseContext.Provider value={{ db, isReady, refresh }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
