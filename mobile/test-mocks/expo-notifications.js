/**
 * Stub for logic tests. `expo-notifications` ships ESM and pulls the native runtime, but
 * the functions under test (schedule expansion, date maths) never call into it — they only
 * share a module with code that does.
 */
module.exports = {
  setNotificationHandler: () => {},
  getPermissionsAsync: async () => ({ granted: false }),
  requestPermissionsAsync: async () => ({ granted: false }),
  scheduleNotificationAsync: async () => 'stub-id',
  cancelScheduledNotificationAsync: async () => {},
  cancelAllScheduledNotificationsAsync: async () => {},
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
};
