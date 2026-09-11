import { FocusMode } from '../../types';

/**
 * The currently running focus session, held outside the React tree.
 *
 * `FocusTimer` keeps its countdown in component state, which was fine while it lived in a
 * tab that was only ever unmounted by navigating away from it. Now that Focus opens as a
 * screen you close, that state has to outlive the component — otherwise dismissing the
 * timer to glance at a task would silently abandon the session.
 *
 * Deliberately in memory only: the end time is an absolute timestamp and a backstop
 * notification is already scheduled with the OS, so a session that survives a process
 * kill would still announce itself. Persisting it would add a restore path with no
 * benefit the notification doesn't already cover.
 */
export interface ActiveFocusSession {
  mode: FocusMode;
  /** Absolute epoch ms the session ends at. */
  endAtMs: number;
  taskId?: string;
  /** "HH:mm" the session began, for the focus log written on completion. */
  startedAtTime: string;
  /** Identifier of the scheduled end-of-session notification, so it can be cancelled. */
  notificationId: string | null;
}

let active: ActiveFocusSession | null = null;
const listeners = new Set<() => void>();

export function getActiveFocusSession(): ActiveFocusSession | null {
  // A session whose end time has passed is over, whether or not anything was mounted to
  // notice. Treating it as active would show a negative countdown.
  if (active && active.endAtMs <= Date.now()) active = null;
  return active;
}

export function setActiveFocusSession(session: ActiveFocusSession | null) {
  active = session;
  listeners.forEach((fn) => fn());
}

export function updateActiveFocusSession(patch: Partial<ActiveFocusSession>) {
  if (!active) return;
  active = { ...active, ...patch };
  listeners.forEach((fn) => fn());
}

export function subscribeToFocusSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whole seconds left, or 0 when nothing is running. */
export function focusSecondsRemaining(): number {
  const session = getActiveFocusSession();
  if (!session) return 0;
  return Math.max(0, Math.round((session.endAtMs - Date.now()) / 1000));
}
