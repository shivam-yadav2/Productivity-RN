package expo.modules.alarm

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * The set of alarms currently registered with AlarmManager.
 *
 * AlarmManager itself forgets everything on reboot and gives us no way to enumerate what
 * we've scheduled, so this mirror in SharedPreferences is what BootReceiver replays from
 * and what `cancelAll` walks. It deliberately duplicates a little of the JS-side reminder
 * table: the JS layer isn't running when the device boots.
 */
internal data class StoredAlarm(
  val id: Int,
  val triggerAtMillis: Long,
  val title: String,
  val body: String,
  val snoozeMinutes: Int,
  val ringSeconds: Int
) {
  fun toJson(): JSONObject = JSONObject().apply {
    put("id", id)
    put("triggerAtMillis", triggerAtMillis)
    put("title", title)
    put("body", body)
    put("snoozeMinutes", snoozeMinutes)
    put("ringSeconds", ringSeconds)
  }

  companion object {
    fun fromJson(o: JSONObject) = StoredAlarm(
      id = o.getInt("id"),
      triggerAtMillis = o.getLong("triggerAtMillis"),
      title = o.optString("title", "Reminder"),
      body = o.optString("body", ""),
      snoozeMinutes = o.optInt("snoozeMinutes", 5),
      ringSeconds = o.optInt("ringSeconds", 120)
    )
  }
}

internal object AlarmStore {
  private const val PREFS = "expo_alarm_store"
  private const val KEY = "alarms"

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun all(context: Context): List<StoredAlarm> {
    val raw = prefs(context).getString(KEY, null) ?: return emptyList()
    return runCatching {
      val arr = JSONArray(raw)
      (0 until arr.length()).map { StoredAlarm.fromJson(arr.getJSONObject(it)) }
    }.getOrDefault(emptyList())
  }

  fun get(context: Context, id: Int): StoredAlarm? = all(context).firstOrNull { it.id == id }

  fun put(context: Context, alarm: StoredAlarm) {
    write(context, all(context).filterNot { it.id == alarm.id } + alarm)
  }

  fun remove(context: Context, id: Int) {
    write(context, all(context).filterNot { it.id == id })
  }

  fun clear(context: Context) = write(context, emptyList())

  private fun write(context: Context, alarms: List<StoredAlarm>) {
    val arr = JSONArray()
    alarms.forEach { arr.put(it.toJson()) }
    prefs(context).edit().putString(KEY, arr.toString()).apply()
  }
}
