/**
 * Notification service for reminders and alerts.
 */
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
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

  async scheduleAt(identifier: string, title: string, body: string, date: Date): Promise<string | null> {
    try {
      if (!(await this.hasPermission())) return null;
      return await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title, body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
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
