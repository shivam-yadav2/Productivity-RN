/**
 * Notification service for reminders and alerts.
 */

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  },

  hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  },

  sendNotification(title: string, body: string, icon = '/favicon.ico') {
    if (this.hasPermission()) {
      try {
        new Notification(title, {
          body,
          icon,
          badge: icon,
        });
      } catch {
        // Ignore fallback
      }
    }
  },
};
