package expo.modules.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Wakes on the AlarmManager broadcast and hands off to the foreground service, which owns
 * the ringing (sound, vibration, and the full-screen notification). A BroadcastReceiver
 * gets roughly ten seconds of runtime, so it must not do the ringing itself.
 */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getIntExtra(AlarmScheduler.EXTRA_ID, -1)
    if (id == -1) return

    // A fired one-shot is done; leaving it in the store would make a reboot resurrect it.
    AlarmStore.remove(context, id)

    val serviceIntent = Intent(context, AlarmService::class.java).apply {
      action = AlarmService.ACTION_START
      putExtra(AlarmScheduler.EXTRA_ID, id)
      putExtra(AlarmScheduler.EXTRA_TITLE, intent.getStringExtra(AlarmScheduler.EXTRA_TITLE))
      putExtra(AlarmScheduler.EXTRA_BODY, intent.getStringExtra(AlarmScheduler.EXTRA_BODY))
      putExtra(
        AlarmScheduler.EXTRA_SNOOZE_MINUTES,
        intent.getIntExtra(AlarmScheduler.EXTRA_SNOOZE_MINUTES, 5)
      )
      putExtra(
        AlarmScheduler.EXTRA_RING_SECONDS,
        intent.getIntExtra(AlarmScheduler.EXTRA_RING_SECONDS, 120)
      )
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(serviceIntent)
    } else {
      context.startService(serviceIntent)
    }
  }
}
