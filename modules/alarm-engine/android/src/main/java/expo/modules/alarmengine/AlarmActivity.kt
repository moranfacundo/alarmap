package expo.modules.alarmengine

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextClock
import android.widget.TextView

/**
 * Pantalla de alarma sonando: hora, etiqueta, tokens de rutina, Posponer y Detener. Nativa a
 * propósito: abre al instante sobre el bloqueo sin depender de que arranque el bundle JS.
 * Colores = palette.ts (res/values{,-night}/colors.xml); tipografía Inter.
 */
class AlarmActivity : Activity() {
  companion object {
    fun intent(context: Context, alarmId: String): Intent =
      Intent(context, AlarmActivity::class.java)
        .putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
  }

  private val ended = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) = finish()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setShowWhenLocked(true)
    setTurnScreenOn(true)
    registerReceiver(ended, IntentFilter(AlarmRingingService.ACTION_RINGING_ENDED), RECEIVER_NOT_EXPORTED)
    render(intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID))
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    render(intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID))
  }

  override fun onDestroy() {
    unregisterReceiver(ended)
    super.onDestroy()
  }

  /** Evita descartar la alarma por accidente: solo Posponer o Detener. */
  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {}

  private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

  private fun render(alarmId: String?) {
    val alarm = alarmId?.let { AlarmDb.get(this, it) }
    val settings = AlarmDb.settings(this)
    val regular = resources.getFont(R.font.inter_regular)
    val semibold = resources.getFont(R.font.inter_semibold)
    val bold = resources.getFont(R.font.inter_bold)

    fun text(value: String, sp: Float, color: Int, face: Typeface) = TextView(this).apply {
      this.text = value
      setTextSize(TypedValue.COMPLEX_UNIT_SP, sp)
      setTextColor(color)
      typeface = face
      gravity = Gravity.CENTER
    }

    fun button(label: String, fill: Int, textColor: Int, onClick: () -> Unit) = Button(this).apply {
      text = label
      isAllCaps = false
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
      typeface = semibold
      setTextColor(textColor)
      background = GradientDrawable().apply { setColor(fill); cornerRadius = dp(28).toFloat() }
      layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(56)).apply { topMargin = dp(12) }
      setOnClickListener { onClick() }
    }

    val bg = getColor(R.color.alarmap_bg)
    val fg = getColor(R.color.alarmap_text)
    val muted = getColor(R.color.alarmap_text_muted)

    val clock = TextClock(this).apply {
      val pattern = if (settings.timeFormat == 12) "h:mm" else "HH:mm"
      format12Hour = pattern
      format24Hour = pattern
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 80f)
      setTextColor(fg)
      typeface = bold
      gravity = Gravity.CENTER
    }

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setBackgroundColor(bg)
      setPadding(dp(32), dp(48), dp(32), dp(48))
      addView(clock)
      addView(text(alarm?.label?.ifBlank { "Alarma" } ?: "Alarma", 24f, fg, semibold))
      if (!alarm?.tags.isNullOrEmpty()) {
        addView(text(alarm!!.tags.joinToString(" · "), 16f, muted, regular).apply { setPadding(0, dp(8), 0, 0) })
      }
      addView(android.view.View(context), LinearLayout.LayoutParams(0, dp(48)))
      addView(button("Posponer ${settings.snoozeMinutes} min", getColor(R.color.alarmap_surface_alt), fg) {
        startService(AlarmRingingService.actionIntent(this@AlarmActivity, AlarmRingingService.ACTION_SNOOZE))
      })
      addView(button("Detener", getColor(R.color.alarmap_accent), getColor(R.color.alarmap_on_accent)) {
        startService(AlarmRingingService.actionIntent(this@AlarmActivity, AlarmRingingService.ACTION_STOP))
      })
    }
    setContentView(root)
  }
}
