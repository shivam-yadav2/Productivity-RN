import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbEngine, DatabaseTables } from '../database/db';

interface DatabaseContextType {
  db: DatabaseTables;
  isReady: boolean;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [db, setDb] = useState<DatabaseTables>(() => dbEngine.getTables());

  useEffect(() => {
    let isMounted = true;
    dbEngine.init().then(() => {
      if (isMounted) {
        setDb(dbEngine.getTables());
        setIsReady(true);
      }
    });

    const unsubscribe = dbEngine.subscribe(() => {
      if (isMounted) {
        // Clone new reference to trigger reactivity
        setDb({ ...dbEngine.getTables() });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refresh = () => {
    setDb({ ...dbEngine.getTables() });
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
