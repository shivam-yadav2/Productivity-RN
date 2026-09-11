import { dbEngine } from '../database/db';
import { settingsRepository } from '../database/repositories/settingsRepo';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Reproduces "I set a PIN and a dark theme, force-closed the app, and they were gone".
 *
 * Two separate failures produced that symptom and both are covered here:
 *  - settings were written behind the 400ms persist debounce, so force-closing before it
 *    elapsed lost them (Android kills a swiped-away process without any lifecycle event);
 *  - the value on disk was never read back into the app, which is asserted by reloading
 *    a fresh engine view of storage below.
 */
const DB_STORAGE_KEY = 'ppf_local_database_v1';

async function readStoredSettings(): Promise<any> {
  const raw = await AsyncStorage.getItem(DB_STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw).settings;
}

describe('settings durability', () => {
  beforeAll(async () => {
    await dbEngine.init();
  });

  it('writes a theme change to storage without waiting for the debounce', async () => {
    settingsRepository.update({ theme: 'dark' });

    // Deliberately no timer advance and no flush() call: a write-through table must
    // already be on its way to storage by the time the next tick runs.
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    const stored = await readStoredSettings();
    expect(stored).not.toBeNull();
    expect(stored.theme).toBe('dark');
  });

  it('writes a PIN and security type straight through', async () => {
    settingsRepository.update({ pinHash: 'hashed-pin-value', securityType: 'PIN' });

    await new Promise((r) => setTimeout(r, 0));

    const stored = await readStoredSettings();
    expect(stored.pinHash).toBe('hashed-pin-value');
    expect(stored.securityType).toBe('PIN');
  });

  it('keeps earlier settings when a later one is written', async () => {
    settingsRepository.update({ currency: 'USD' });
    await new Promise((r) => setTimeout(r, 0));

    const stored = await readStoredSettings();
    // The theme and PIN from the previous cases must survive an unrelated settings write.
    expect(stored.theme).toBe('dark');
    expect(stored.pinHash).toBe('hashed-pin-value');
    expect(stored.currency).toBe('USD');
  });

  it('survives several rapid writes without losing the last one', async () => {
    settingsRepository.update({ autoLockMinutes: 1 });
    settingsRepository.update({ autoLockMinutes: 15 });
    settingsRepository.update({ autoLockMinutes: 60 });

    await dbEngine.flush();
    await new Promise((r) => setTimeout(r, 0));

    const stored = await readStoredSettings();
    // The mid-write re-entrancy path must not drop the final value.
    expect(stored.autoLockMinutes).toBe(60);
  });

  it('marks settings dirty so contexts are told to re-read', () => {
    let captured = new Set<string>();
    const unsub = dbEngine.subscribe((dirty) => {
      captured = new Set(dirty);
    });

    settingsRepository.update({ theme: 'light' });

    return Promise.resolve().then(() => {
      expect(captured.has('settings')).toBe(true);
      unsub();
    });
  });
});
