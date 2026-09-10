package expo.modules.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat

/**
 * Owns a ringing alarm: the looping sound, the vibration, the full-screen notification,
 * and the auto-stop timeout.
 *
 * This is a foreground service rather than work done inside the Activity because the
 * alarm has to keep ringing whether or not the screen ever came on — on a locked device
 * the full-screen intent may be shown as a heads-up notification instead of launching
 * the Activity, and the user may never open it at all.
 */
class AlarmService : Service() {

  companion object {
    const val ACTION_START = "expo.modules.alarm.START"
    const val ACTION_STOP = "expo.modules.alarm.STOP"
    const val ACTION_SNOOZE = "expo.modules.alarm.SNOOZE"

    private const val CHANNEL_ID = "expo_alarm_channel"
    private const val NOTIFICATION_ID = 0x4A1A

    /** Set while an alarm is ringing so AlarmActivity can show the right title. */
    @Volatile var ringingTitle: String? = null
    @Volatile var ringingBody: String? = null
    @Volatile var ringingId: Int = -1
    @Volatile var ringingSnoozeMinutes: Int = 5
  }

  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private val handler = Handler(Looper.getMainLooper())
  private var autoStop: Runnable? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopEverything()
        return START_NOT_STICKY
      }
      ACTION_SNOOZE -> {
        snooze()
        return START_NOT_STICKY
      }
    }

    val id = intent?.getIntExtra(AlarmScheduler.EXTRA_ID, -1) ?: -1
    val title = intent?.getStringExtra(AlarmScheduler.EXTRA_TITLE) ?: "Reminder"
    val body = intent?.getStringExtra(AlarmScheduler.EXTRA_BODY) ?: ""
    val snoozeMinutes = intent?.getIntExtra(AlarmScheduler.EXTRA_SNOOZE_MINUTES, 5) ?: 5
    val ringSeconds = intent?.getIntExtra(AlarmScheduler.EXTRA_RING_SECONDS, 120) ?: 120

    ringingId = id
    ringingTitle = title
    ringingBody = body
    ringingSnoozeMinutes = snoozeMinutes

    startForeground(NOTIFICATION_ID, buildNotification(title, body, snoozeMinutes > 0))
    acquireWakeLock(ringSeconds)
    startRinging()

    // Stop on its own so a missed alarm doesn't ring until the battery dies.
    autoStop = Runnable { stopEverything() }.also {
      handler.postDelayed(it, ringSeconds * 1000L)
    }

    return START_STICKY
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return

    val channel = NotificationChannel(
      CHANNEL_ID,
      "Alarms",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Reminders that ring like an alarm"
      setBypassDnd(true)
      lockscreenVisibility = androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC
      // The service plays the sound itself on the alarm stream, so the channel stays
      // silent — otherwise the notification tone and the alarm tone overlap.
      setSound(null, null)
      enableVibration(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(
    title: String,
    body: String,
    withSnooze: Boolean
  ): android.app.Notification {
    ensureChannel()

    val fullScreen = PendingIntent.getActivity(
      this,
      1,
      Intent(this, AlarmActivity::class.java).addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
      ),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val stopIntent = PendingIntent.getService(
      this,
      2,
      Intent(this, AlarmService::class.java).setAction(ACTION_STOP),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(body.ifEmpty { "Tap to open" })
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setFullScreenIntent(fullScreen, true)
      .addAction(0, "Stop", stopIntent)

    if (withSnooze) {
      val snoozeIntent = PendingIntent.getService(
        this,
        3,
        Intent(this, AlarmService::class.java).setAction(ACTION_SNOOZE),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      builder.addAction(0, "Snooze", snoozeIntent)
    }

    return builder.build()
  }

  private fun acquireWakeLock(ringSeconds: Int) {
    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "expo-alarm:ring").apply {
      setReferenceCounted(false)
      acquire((ringSeconds + 10) * 1000L)
    }
  }

  private fun startRinging() {
    val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

    runCatching {
      player = MediaPlayer().apply {
        setDataSource(this@AlarmService, uri)
        // STREAM_ALARM so it uses the alarm volume and is audible with the ringer silenced.
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        )
        isLooping = true
        prepare()
        start()
      }
    }

    vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

    val pattern = longArrayOf(0, 600, 600)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
    } else {
      @Suppress("DEPRECATION")
      vibrator?.vibrate(pattern, 0)
    }
  }

  private fun snooze() {
    val minutes = ringingSnoozeMinutes.coerceAtLeast(1)
    val id = ringingId
    val title = ringingTitle ?: "Reminder"
    val body = ringingBody ?: ""

    if (id != -1) {
      AlarmScheduler.schedule(
        this,
        StoredAlarm(
          id = id,
          triggerAtMillis = System.currentTimeMillis() + minutes * 60_000L,
          title = title,
          body = body,
          snoozeMinutes = minutes,
          ringSeconds = 120
        )
      )
    }
    stopEverything()
  }

  private fun stopEverything() {
    autoStop?.let { handler.removeCallbacks(it) }
    autoStop = null

    runCatching { player?.stop() }
    runCatching { player?.release() }
    player = null

    runCatching { vibrator?.cancel() }
    vibrator = null

    runCatching { if (wakeLock?.isHeld == true) wakeLock?.release() }
    wakeLock = null

    ringingId = -1
    ringingTitle = null
    ringingBody = null

    AlarmActivity.finishIfShowing()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    stopSelf()
  }

  override fun onDestroy() {
    stopEverything()
    super.onDestroy()
  }
}
