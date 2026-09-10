package expo.modules.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * AlarmManager registrations do not survive a reboot (or an app update), so everything
 * still pending has to be re-registered from AlarmStore once the device is back up.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED -> AlarmScheduler.rescheduleAll(context)
    }
  }
}
