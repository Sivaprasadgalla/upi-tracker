package com.upitracker.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class UpiNotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var receiver: BroadcastReceiver? = null

    init {
        registerNotificationBroadcastReceiver()
    }

    override fun getName(): String {
        return "UpiNotificationModule"
    }

    private fun registerNotificationBroadcastReceiver() {
        receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent == null) return
                val packageName = intent.getStringExtra("packageName") ?: ""
                val rawText = intent.getStringExtra("rawText") ?: ""
                val timestamp = intent.getLongExtra("timestamp", System.currentTimeMillis())

                val params = Arguments.createMap().apply {
                    putString("packageName", packageName)
                    putString("rawText", rawText)
                    putDouble("timestamp", timestamp.toDouble())
                }

                sendEvent("onUpiNotificationReceived", params)
            }
        }

        val filter = IntentFilter("com.upitracker.ACTION_UPI_NOTIFICATION")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            reactContext.registerReceiver(receiver, filter)
        }
    }

    private fun sendEvent(eventName: String, params: Any?) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    @ReactMethod
    fun isPermissionGranted(promise: Promise) {
        val packageName = reactContext.packageName
        val flat = Settings.Secure.getString(
            reactContext.contentResolver,
            "enabled_notification_listeners"
        )
        val isGranted = flat != null && flat.contains(packageName)
        promise.resolve(isGranted)
    }

    @ReactMethod
    fun openSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactContext.startActivity(intent)
    }
}
