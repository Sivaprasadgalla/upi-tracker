package com.upitracker.app

import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class UpiNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "UpiNotificationListener"

        // Known UPI & Banking Android Packages
        private val TRACKED_PACKAGES = setOf(
            "com.google.android.apps.nbu.paisa.user", // Google Pay
            "com.phonepe.app",                       // PhonePe
            "net.one97.paytm",                       // Paytm
            "com.dreamplug.androidapp",               // CRED
            "in.amazon.mShop.android.shopping",      // Amazon Pay
            "in.org.npci.upiapp",                    // BHIM
            "com.google.android.apps.messaging",     // Google Messages (Bank SMS)
            "com.samsung.android.messaging"          // Samsung Messages (Bank SMS)
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: return

        // Check if package is tracked or has financial/UPI indicators
        if (!TRACKED_PACKAGES.contains(packageName) && !packageName.contains("bank", ignoreCase = true)) {
            return
        }

        val extras: Bundle = sbn.notification.extras ?: return
        val title = extras.getCharSequence("android.title")?.toString() ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""

        val fullContent = if (bigText.isNotEmpty()) "$title $bigText" else "$title $text"

        // Filter: Must contain currency symbol or transaction keyword
        val isFinancial = fullContent.contains("₹") ||
                fullContent.contains("Rs", ignoreCase = true) ||
                fullContent.contains("INR", ignoreCase = true) ||
                fullContent.contains("Paid", ignoreCase = true) ||
                fullContent.contains("Debited", ignoreCase = true) ||
                fullContent.contains("Credited", ignoreCase = true)

        if (!isFinancial) return

        Log.d(TAG, "Captured UPI Notification from [$packageName]: $fullContent")

        // Broadcast to React Native Module
        val intent = Intent("com.upitracker.ACTION_UPI_NOTIFICATION")
        intent.putExtra("packageName", packageName)
        intent.putExtra("rawText", fullContent)
        intent.putExtra("timestamp", sbn.postTime)
        intent.setPackage(this.packageName)
        sendBroadcast(intent)
    }
}
