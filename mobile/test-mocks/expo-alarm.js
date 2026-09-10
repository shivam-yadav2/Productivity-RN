/** Stub for the Android-only local native alarm module. */
module.exports = {
  isAlarmModuleAvailable: false,
  scheduleAlarm: () => {},
  cancelAlarm: () => {},
  cancelAllAlarms: () => {},
  getScheduledAlarmIds: () => [],
  stopRinging: () => {},
  canScheduleExactAlarms: () => true,
  openExactAlarmSettings: () => {},
};
