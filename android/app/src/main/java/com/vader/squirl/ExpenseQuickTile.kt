package com.vader.squirl

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.quicksettings.TileService
import android.service.quicksettings.Tile

/**
 * ExpenseQuickTile
 *
 * A Quick Settings Tile that appears in the Android notification shade.
 * Users can add it via: Settings → Quick Settings → Edit → drag "Log Expense" tile.
 *
 * Tapping the tile deep-links directly to the Squirl expense entry screen
 * using the squirl://expense URI already registered in AndroidManifest.xml.
 *
 * Requires API 24+ (Android 7.0) — available on virtually all modern devices.
 */
class ExpenseQuickTile : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        qsTile?.apply {
            state = Tile.STATE_INACTIVE
            label = "Log Expense"
            contentDescription = "Open Squirl expense logger"
            updateTile()
        }
    }

    override fun onClick() {
        super.onClick()

        val deepLinkUri = Uri.parse("squirl://expense")
        val launchIntent = Intent(Intent.ACTION_VIEW, deepLinkUri).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // Android 14+ requires startActivityAndCollapse with PendingIntent
            val pendingIntent = PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            startActivityAndCollapse(pendingIntent)
        } else {
            // Android 7–13: collapse the shade then launch
            @Suppress("DEPRECATION")
            startActivityAndCollapse(launchIntent)
        }
    }
}
