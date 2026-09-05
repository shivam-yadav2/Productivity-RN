/**
 * Notification service for reminders and alerts.
 */
import * as Notifications from 'expo-notifications';

/**
 * There's no real system-level Do Not Disturb this app can toggle (iOS has no API for
 * it at all; Android needs a manual permission grant + a native module) — so the closest
 * we can get to "quiet while I'm focusing" is: while a focus session is running AND the
 * app is in the foreground, suppress the banner/sound for anything that ISN'T the focus
 * session's own end-of-session alert. This can't reach notifications that arrive while
 * the app is backgrounded/killed — the OS delivers those on its own, before any of our JS
 * runs — so it only ever helps for the "phone face-up next to you while you focus" case.
 */
let isFocusSessionActive = false;
export function setFocusSessionActive(active: boolean) {
  isFocusSessionActive = active;
}

export const FOCUS_END_CATEGORY = 'focus-end';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isFocusEndAlert = notification.request.content.data?.category === FOCUS_END_CATEGORY;
    const suppress = isFocusSessionActive && !isFocusEndAlert;
    return {
      shouldPlaySound: !suppress,
      shouldSetBadge: false,
      shouldShowBanner: !suppress,
      shouldShowList: true,
    };
  },
});

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    try {
      const existing = await Notifications.getPermissionsAsync();
      if (existing.granted) return true;
      const res = await Notifications.requestPermissionsAsync();
      return res.granted;
    } catch {
      return false;
    }
  },

  async hasPermission(): Promise<boolean> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings.granted;
    } catch {
      return false;
    }
  },

  async sendNotification(title: string, body: string) {
    try {
      if (!(await this.hasPermission())) return;
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    } catch {
      // Ignore fallback
    }
  },

  async scheduleAt(
    identifier: string,
    title: string,
    body: string,
    date: Date,
    data?: Record<string, unknown>
  ): Promise<string | null> {
    try {
      if (!(await this.hasPermission())) return null;
      return await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title, body, data },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
    } catch {
      return null;
    }
  },

  /** Repeats every day at the given hour/minute, indefinitely, until cancelled — for
   *  habit reminders. Unlike `scheduleAt` there's no completion check baked in (expo-
   *  notifications can't run app logic before firing a local notification), so this
   *  fires the same reminder daily regardless of whether the habit was already done. */
  async scheduleDaily(identifier: string, title: string, body: string, hour: number, minute: number): Promise<string | null> {
    try {
      if (!(await this.hasPermission())) return null;
      return await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title, body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    } catch {
      return null;
    }
  },

  async cancel(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      // Ignore fallback
    }
  },
};
