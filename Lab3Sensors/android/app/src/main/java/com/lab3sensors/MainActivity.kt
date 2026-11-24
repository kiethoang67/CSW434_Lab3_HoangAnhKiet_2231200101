package com.lab3sensors

import android.app.PendingIntent
import android.content.Intent
import android.nfc.NfcAdapter
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * MainActivity — entry point for the React Native app.
 *
 * Configures NFC Foreground Dispatch so that when the Activity is active,
 * any NFC tag discovery or ADB-injected NDEF intent is routed directly to
 * NfcModule.handleNfcIntent().
 */
class MainActivity : ReactActivity() {

    private var nfcAdapter: NfcAdapter? = null
    private var pendingIntent: PendingIntent? = null

    override fun getMainComponentName(): String = "Lab3Sensors"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            nfcAdapter = NfcAdapter.getDefaultAdapter(this)
            val intent = Intent(this, javaClass).apply {
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
            }
            pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
        } catch (_: Exception) {
            // Device/Emulator without NFC hardware support
        }

        // Check if launched directly by an NFC intent
        intent?.let { checkAndForwardNfcIntent(it) }
    }

    override fun onResume() {
        super.onResume()
        try {
            if (nfcAdapter?.isEnabled == true && pendingIntent != null) {
                nfcAdapter?.enableForegroundDispatch(this, pendingIntent, null, null)
            }
        } catch (_: Exception) {}
    }

    override fun onPause() {
        super.onPause()
        try {
            if (nfcAdapter?.isEnabled == true) {
                nfcAdapter?.disableForegroundDispatch(this)
            }
        } catch (_: Exception) {}
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        checkAndForwardNfcIntent(intent)
    }

    private fun checkAndForwardNfcIntent(intent: Intent) {
        val action = intent.action ?: return
        if (action == NfcAdapter.ACTION_NDEF_DISCOVERED ||
            action == NfcAdapter.ACTION_TAG_DISCOVERED ||
            action == NfcAdapter.ACTION_TECH_DISCOVERED
        ) {
            NfcModule.handleNfcIntent(intent)
        }
    }
}
