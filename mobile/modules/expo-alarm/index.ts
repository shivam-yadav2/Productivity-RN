import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

interface ExpoAlarmNativeModule {
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): void;
  scheduleAlarm(
    id: number,
    triggerAtMillis: number,
    title: string,
    body: string,
    snoozeMinutes: number,
    ringSeconds: number
  ): void;
  cancelAlarm(id: number): void;
  cancelAllAlarms(): void;
  getScheduledAlarmIds(): number[];
  stopRinging(): void;
}

/**
 * Android-only local native module (see modules/expo-alarm/android). `requireOptional`
 * rather than `requireNativeModule` so the JS bundle still loads on web and in any build
 * where the native side isn't linked — every call below no-ops instead of throwing.
 */
const native = requireOptionalNativeModule<ExpoAlarmNativeModule>('ExpoAlarm');

export const isAlarmModuleAvailable = Platform.OS === 'android' && native != null;

export function canScheduleExactAlarms(): boolean {
  return native?.canScheduleExactAlarms() ?? false;
}

export function openExactAlarmSettings(): void {
  native?.openExactAlarmSettings();
}

export function scheduleAlarm(params: {
  id: number;
  triggerAtMillis: number;
  title: string;
  body?: string;
  snoozeMinutes?: number;
  ringSeconds?: number;
}): void {
  native?.scheduleAlarm(
    params.id,
    params.triggerAtMillis,
    params.title,
    params.body ?? '',
    params.snoozeMinutes ?? 5,
    params.ringSeconds ?? 120
  );
}

export function cancelAlarm(id: number): void {
  native?.cancelAlarm(id);
}

export function cancelAllAlarms(): void {
  native?.cancelAllAlarms();
}

export function getScheduledAlarmIds(): number[] {
  return native?.getScheduledAlarmIds() ?? [];
}

export function stopRinging(): void {
  native?.stopRinging();
}
