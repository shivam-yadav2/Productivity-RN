package expo.modules.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

internal object AlarmScheduler {

  const val EXTRA_ID = "expo.modules.alarm.ID"
  const val EXTRA_TITLE = "expo.modules.alarm.TITLE"
  const val EXTRA_BODY = "expo.modules.alarm.BODY"
  const val EXTRA_SNOOZE_MINUTES = "expo.modules.alarm.SNOOZE_MINUTES"
  const val EXTRA_RING_SECONDS = "expo.modules.alarm.RING_SECONDS"

  private fun alarmManager(context: Context) =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun pendingIntent(context: Context, alarm: StoredAlarm): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java).apply {
      // A distinct action per id keeps PendingIntent.getBroadcast from treating two
      // different alarms as the same intent (extras alone are not part of intent equality).
      action = "expo.modules.alarm.FIRE.${alarm.id}"
      putExtra(EXTRA_ID, alarm.id)
      putExtra(EXTRA_TITLE, alarm.title)
      putExtra(EXTRA_BODY, alarm.body)
      putExtra(EXTRA_SNOOZE_MINUTES, alarm.snoozeMinutes)
      putExtra(EXTRA_RING_SECONDS, alarm.ringSeconds)
    }
    return PendingIntent.getBroadcast(
      context,
      alarm.id,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  fun canScheduleExact(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return alarmManager(context).canScheduleExactAlarms()
  }

  /**
   * Schedules (or replaces) one alarm and records it so a reboot can replay it.
   *
   * Uses `setAlarmClock` when allowed: it is the only AlarmManager mode the OS treats as a
   * user-visible alarm — exempt from Doze batching, and it surfaces the standard alarm icon
   * in the status bar. Falls back to inexact scheduling if the user has denied exact
   * alarms, which may drift by minutes but is better than silently never firing.
   */
  fun schedule(context: Context, alarm: StoredAlarm) {
    AlarmStore.put(context, alarm)
    val am = alarmManager(context)
    val operation = pendingIntent(context, alarm)

    if (canScheduleExact(context)) {
      val showIntent = PendingIntent.getActivity(
        context,
        alarm.id,
        Intent(context, AlarmActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      am.setAlarmClock(AlarmManager.AlarmClockInfo(alarm.triggerAtMillis, showIntent), operation)
    } else {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarm.triggerAtMillis, operation)
    }
  }

  fun cancel(context: Context, id: Int) {
    val stored = AlarmStore.get(context, id) ?: StoredAlarm(id, 0L, "", "", 5, 120)
    alarmManager(context).cancel(pendingIntent(context, stored))
    AlarmStore.remove(context, id)
  }

  fun cancelAll(context: Context) {
    AlarmStore.all(context).forEach { alarmManager(context).cancel(pendingIntent(context, it)) }
    AlarmStore.clear(context)
  }

  /** Re-registers everything still in the future; drops anything already past. */
  fun rescheduleAll(context: Context) {
    val now = System.currentTimeMillis()
    AlarmStore.all(context).forEach { alarm ->
      if (alarm.triggerAtMillis > now) schedule(context, alarm) else AlarmStore.remove(context, alarm.id)
    }
  }
}
