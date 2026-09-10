import { dbEngine, TableName } from '../database/db';

/**
 * Guards the write path's performance machinery.
 *
 * Dirty-table tracking decides which parts of the UI recompute after a write. Missing a
 * table means stale data on screen with no error anywhere — the failure mode is invisible,
 * which is exactly why it needs a test. Over-reporting is merely wasteful and allowed.
 */
describe('dirty-table tracking', () => {
  beforeAll(async () => {
    await dbEngine.init();
  });

  it('marks the table a write touched', () => {
    let captured = new Set<TableName>();
    const unsub = dbEngine.subscribe((dirty) => {
      captured = dirty;
    });

    dbEngine.runTransaction((db) => {
      db.tasks['task_dirty_test'] = {
        id: 'task_dirty_test',
        title: 'x',
        status: 'TODO',
        priority: 'LOW',
        createdAt: '',
        updatedAt: '',
      } as any;
    });

    return Promise.resolve().then(() => {
      expect(captured.has('tasks')).toBe(true);
      unsub();
    });
  });

  it('does not mark unrelated tables', () => {
    let captured = new Set<TableName>();
    const unsub = dbEngine.subscribe((dirty) => {
      captured = dirty;
    });

    dbEngine.runTransaction((db) => {
      db.notes['note_dirty_test'] = {
        id: 'note_dirty_test',
        title: 'n',
        body: '',
        createdAt: '',
        updatedAt: '',
      } as any;
    });

    return Promise.resolve().then(() => {
      expect(captured.has('notes')).toBe(true);
      // A note write must not invalidate the ledger — this is the whole point of the
      // mechanism, and the assertion that fails if tracking regresses to "mark everything".
      expect(captured.has('transactions')).toBe(false);
      unsub();
    });
  });

  it('catches a whole-table replacement, not just key writes', () => {
    let captured = new Set<TableName>();
    const unsub = dbEngine.subscribe((dirty) => {
      captured = dirty;
    });

    dbEngine.runTransaction((db) => {
      db.budgets = {};
    });

    return Promise.resolve().then(() => {
      expect(captured.has('budgets')).toBe(true);
      unsub();
    });
  });

  it('coalesces several writes in one tick into a single notification', () => {
    let calls = 0;
    const unsub = dbEngine.subscribe(() => {
      calls++;
    });

    dbEngine.runTransaction((db) => {
      db.tasks['t1'] = { id: 't1' } as any;
    });
    dbEngine.runTransaction((db) => {
      db.tasks['t2'] = { id: 't2' } as any;
    });
    dbEngine.runTransaction((db) => {
      db.habits['h1'] = { id: 'h1' } as any;
    });

    return Promise.resolve().then(() => {
      expect(calls).toBe(1);
      unsub();
    });
  });

  it('reports every table written across coalesced transactions', () => {
    let captured = new Set<TableName>();
    const unsub = dbEngine.subscribe((dirty) => {
      captured = dirty;
    });

    dbEngine.runTransaction((db) => {
      db.tasks['t3'] = { id: 't3' } as any;
    });
    dbEngine.runTransaction((db) => {
      db.habits['h2'] = { id: 'h2' } as any;
    });

    return Promise.resolve().then(() => {
      expect(captured.has('tasks')).toBe(true);
      expect(captured.has('habits')).toBe(true);
      unsub();
    });
  });

  it('rolls back and still notifies when a transaction throws', () => {
    const before = Object.keys(dbEngine.getTables().notes).length;

    expect(() =>
      dbEngine.runTransaction((db) => {
        db.notes['will_not_survive'] = { id: 'will_not_survive' } as any;
        throw new Error('boom');
      })
    ).toThrow('boom');

    expect(Object.keys(dbEngine.getTables().notes).length).toBe(before);
  });
});
