import { requestWidgetUpdate } from 'react-native-android-widget';
import { renderConfiguredWidget } from './widgetTaskHandler';

const DATA_DRIVEN_WIDGETS = ['Balance', 'HabitStreak', 'Today'];

/**
 * Called whenever the app's own database changes (see DatabaseContext.tsx) so pinned
 * widgets reflect a new expense/task/habit almost immediately, instead of waiting for
 * their 30-minute `updatePeriodMillis` — a no-op per widget name if none are pinned.
 */
export function refreshAndroidWidgets() {
  for (const widgetName of DATA_DRIVEN_WIDGETS) {
    requestWidgetUpdate({
      widgetName,
      renderWidget: (info) => renderConfiguredWidget(info) as any,
    }).catch(() => {
      // Best-effort — widgets aren't critical path, and this is a no-op on iOS/web anyway.
    });
  }
}
