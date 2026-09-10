package expo.modules.alarm

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The screen that takes over a locked phone when an alarm fires.
 *
 * It is intentionally plain Android views rather than React Native: it has to appear on a
 * locked device, possibly while the JS engine is not running at all, so it cannot depend
 * on the React root being alive.
 */
class AlarmActivity : Activity() {

  companion object {
    @Volatile private var instance: AlarmActivity? = null

    /** Lets AlarmService dismiss the screen when the alarm is stopped from the notification. */
    fun finishIfShowing() {
      instance?.runOnUiThread { instance?.finish() }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    instance = this

    showOverLockScreen()
    setContentView(R.layout.expo_alarm_activity)

    val title = AlarmService.ringingTitle ?: "Reminder"
    val body = AlarmService.ringingBody.orEmpty()

    findViewById<TextView>(R.id.alarm_time).text =
      SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date())
    findViewById<TextView>(R.id.alarm_title).text = title

    val bodyView = findViewById<TextView>(R.id.alarm_body)
    if (body.isBlank()) {
      bodyView.visibility = android.view.View.GONE
    } else {
      bodyView.text = body
    }

    val snoozeButton = findViewById<Button>(R.id.alarm_snooze)
    if (AlarmService.ringingSnoozeMinutes > 0) {
      snoozeButton.text = "Snooze ${AlarmService.ringingSnoozeMinutes} min"
      snoozeButton.setOnClickListener { send(AlarmService.ACTION_SNOOZE) }
    } else {
      snoozeButton.visibility = android.view.View.GONE
    }

    findViewById<Button>(R.id.alarm_stop).setOnClickListener { send(AlarmService.ACTION_STOP) }
  }

  private fun showOverLockScreen() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      (getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager)
        .requestDismissKeyguard(this, null)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  private fun send(action: String) {
    startService(Intent(this, AlarmService::class.java).setAction(action))
    finish()
  }

  /** The alarm must be dealt with deliberately, so back does not dismiss it. */
  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    // Intentionally empty.
  }

  override fun onDestroy() {
    if (instance === this) instance = null
    super.onDestroy()
  }
}
