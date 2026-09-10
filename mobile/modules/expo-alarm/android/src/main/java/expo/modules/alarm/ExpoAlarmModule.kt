package expo.modules.alarm

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoAlarmModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoAlarm")

    /** Whether the OS will let us fire at an exact time (Android 12+ gates this). */
    Function("canScheduleExactAlarms") {
      AlarmScheduler.canScheduleExact(context)
    }

    /**
     * Opens the system screen where the user grants "Alarms & reminders". There is no
     * in-app prompt for this permission — it can only be granted in Settings.
     */
    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
          data = Uri.parse("package:${context.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      }
    }

    /**
     * Registers one alarm. `id` must be stable for the reminder it belongs to, since it
     * is also the cancellation handle and the PendingIntent request code.
     */
    Function("scheduleAlarm") { id: Int, triggerAtMillis: Double, title: String, body: String, snoozeMinutes: Int, ringSeconds: Int ->
      AlarmScheduler.schedule(
        context,
        StoredAlarm(
          id = id,
          triggerAtMillis = triggerAtMillis.toLong(),
          title = title,
          body = body,
          snoozeMinutes = snoozeMinutes,
          ringSeconds = ringSeconds
        )
      )
    }

    Function("cancelAlarm") { id: Int ->
      AlarmScheduler.cancel(context, id)
    }

    Function("cancelAllAlarms") {
      AlarmScheduler.cancelAll(context)
    }

    /** Ids still registered — used to reconcile the JS reminder list against the OS. */
    Function("getScheduledAlarmIds") {
      AlarmStore.all(context).map { it.id }
    }

    /** Silences a currently ringing alarm (e.g. from an in-app "Stop" button). */
    Function("stopRinging") {
      context.startService(
        Intent(context, AlarmService::class.java).setAction(AlarmService.ACTION_STOP)
      )
    }
  }
}
