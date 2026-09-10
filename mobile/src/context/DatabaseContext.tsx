import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { dbEngine, DatabaseTables, TableName } from '../database/db';
import { refreshAndroidWidgets } from '../widgets/refreshWidgets';
import { audioService } from '../services/audioService';

interface DatabaseContextType {
  db: DatabaseTables;
  isReady: boolean;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

/**
 * Pinned widgets are redrawn through a native call per widget. Doing that on every write
 * meant an import or a burst of edits hammered the bridge; widgets are ambient UI where
 * a second of lag is invisible, so they get their own coarse debounce.
 */
const WIDGET_REFRESH_DEBOUNCE_MS = 1500;

/**
 * Builds the next `db` object, giving fresh references ONLY to tables that changed.
 *
 * The engine mutates each table's record map in place (`db.tasks[id] = task`), so a table
 * whose contents changed keeps its old object identity unless it is re-spread — which is
 * why anything keyed on `db.someTable` needs a new reference to notice. The inverse
 * matters just as much for speed: carrying UNCHANGED tables over by reference means
 * saving an expense no longer invalidates every note, habit and document memo in the app.
 */
function applyDirtyTables(
  previous: DatabaseTables,
  current: DatabaseTables,
  dirty: Set<TableName>
): DatabaseTables {
  if (dirty.size === 0) return previous;

  const next = { ...previous } as DatabaseTables;
  dirty.forEach((table) => {
    if (table === 'settings') {
      next.settings = current.settings;
      return;
    }
    (next as any)[table] = { ...(current as any)[table] };
  });
  return next;
}

/** Full clone — for load and manual refresh, where everything is considered new. */
function cloneTables(tables: DatabaseTables): DatabaseTables {
  const out = {} as DatabaseTables;
  (Object.keys(tables) as TableName[]).forEach((table) => {
    (out as any)[table] =
      table === 'settings' ? tables.settings : { ...(tables as any)[table] };
  });
  return out;
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [db, setDb] = useState<DatabaseTables>(() => dbEngine.getTables());
  const widgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const scheduleWidgetRefresh = () => {
      if (widgetTimer.current) return;
      widgetTimer.current = setTimeout(() => {
        widgetTimer.current = null;
        refreshAndroidWidgets();
      }, WIDGET_REFRESH_DEBOUNCE_MS);
    };

    dbEngine.init().then(() => {
      if (isMounted) {
        setDb(cloneTables(dbEngine.getTables()));
        setIsReady(true);
      }
      audioService.syncFromSettings(dbEngine.getTables().settings);
    });

    const unsubscribe = dbEngine.subscribe((dirty) => {
      if (isMounted) {
        setDb((prev) => applyDirtyTables(prev, dbEngine.getTables(), dirty));
      }
      // Sound/haptic playback reads cached flags rather than the database on every tap,
      // so they only need refreshing when settings actually changed.
      if (dirty.has('settings')) {
        audioService.syncFromSettings(dbEngine.getTables().settings);
      }
      scheduleWidgetRefresh();
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (widgetTimer.current) clearTimeout(widgetTimer.current);
    };
  }, []);

  const refresh = useCallback(() => {
    setDb(cloneTables(dbEngine.getTables()));
  }, []);

  // Without this the provider hands down a brand-new object on every render, so every
  // consumer re-renders even when `db` came back reference-identical from the diff above.
  const value = useMemo(() => ({ db, isReady, refresh }), [db, isReady, refresh]);

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

/**
 * Subscribe to a single table instead of the whole database.
 *
 * `useDatabase()` re-renders its component on every write anywhere in the app. This
 * re-renders only when the named table's reference actually changes, which — thanks to
 * the dirty tracking above — means only when that table's data changed. Prefer it in
 * components that read one slice, especially ones rendered per row.
 */
export function useDatabaseTable<K extends TableName>(table: K): DatabaseTables[K] {
  const { db } = useDatabase();
  return db[table];
}
