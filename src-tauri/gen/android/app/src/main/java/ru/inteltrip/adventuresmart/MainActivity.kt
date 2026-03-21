package ru.inteltrip.adventuresmart

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import android.view.WindowManager

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }
}
