package expo.modules.kiosk

import android.app.admin.DevicePolicyManager
import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KioskModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Kiosk")

    Function("isDeviceOwner") {
      val context = appContext.reactContext
      if (context == null) return@Function false
      val pm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
      pm?.isDeviceOwnerApp(context.packageName) ?: false
    }

    Function("startLockTask") {
      var attempts = 0
      fun tryStart() {
        val activity = appContext.currentActivity
        if (activity != null) {
          activity.runOnUiThread {
            try {
              activity.startLockTask()
            } catch (_: SecurityException) {
            }
          }
        } else if (attempts < 20) {
          attempts++
          android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({ tryStart() }, 500)
        }
      }
      tryStart()
    }

    Function("stopLockTask") {
      val activity = appContext.currentActivity
      if (activity != null) {
        activity.runOnUiThread {
          try {
            activity.stopLockTask()
          } catch (_: SecurityException) {
          }
        }
      }
    }
  }
}
