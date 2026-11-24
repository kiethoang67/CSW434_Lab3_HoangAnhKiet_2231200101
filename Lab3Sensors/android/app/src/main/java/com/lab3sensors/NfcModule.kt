package com.lab3sensors

import android.content.Intent
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.Ndef
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.nio.charset.Charset

/**
 * NfcModule — Turbo Native Module for reading NFC tags & NDEF records on Android.
 *
 * Implements:
 * 1. Physical NFC tag reading via NfcAdapter + Ndef technology.
 * 2. Real Android NdefMessage / NdefRecord construction & parsing for Mock / ADB
 *    testing on Android Emulator (following https://developer.android.com/develop/connectivity/nfc/nfc).
 * 3. Automatic event emission ('NfcTagDetected') to React Native when a tag is read.
 */
class NfcModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "NfcModule"
        const val EVENT_TAG_DETECTED = "NfcTagDetected"

        @Volatile
        private var instance: NfcModule? = null
        private var pendingIntentToProcess: Intent? = null

        fun handleNfcIntent(intent: Intent) {
            val mod = instance
            if (mod != null) {
                mod.processNfcIntent(intent)
            } else {
                pendingIntentToProcess = intent
            }
        }
    }

    // Active by default so NFC listener works immediately when the app starts
    private var isScanning = true

    init {
        instance = this
    }

    override fun getName(): String = MODULE_NAME

    // ─── JS-callable Turbo Module Methods ─────────────────────────────────────

    @ReactMethod
    fun startNfcScan() {
        isScanning = true
        pendingIntentToProcess?.let {
            pendingIntentToProcess = null
            processNfcIntent(it)
        }
        reactContext.currentActivity?.intent?.let { intent: Intent ->
            if (intent.action == NfcAdapter.ACTION_NDEF_DISCOVERED ||
                intent.action == NfcAdapter.ACTION_TAG_DISCOVERED ||
                intent.action == NfcAdapter.ACTION_TECH_DISCOVERED
            ) {
                processNfcIntent(intent)
            }
        }
    }

    @ReactMethod
    fun stopNfcScan() {
        isScanning = false
    }

    /**
     * Constructs a real Android android.nfc.NdefMessage & NdefRecord in Kotlin
     * (per https://developer.android.com/develop/connectivity/nfc/nfc),
     * parses it using the exact native NDEF parser, and emits 'NfcTagDetected'.
     */
    @ReactMethod
    fun simulateNfcTag(presetType: String) {
        isScanning = true
        val (tagId, techList, ndefMessage) = when (presetType) {
            "uri" -> Triple(
                "04:A2:8F:12:9C:5B:80",
                "android.nfc.tech.NfcA, android.nfc.tech.Ndef",
                NdefMessage(
                    arrayOf(
                        NdefRecord.createUri("https://developer.android.com/develop/connectivity/nfc/nfc"),
                        NdefRecord.createTextRecord("en", "Android NFC Developer Documentation")
                    )
                )
            )
            "multi" -> Triple(
                "04:E1:44:9A:3C:71:80",
                "android.nfc.tech.NfcA, android.nfc.tech.MifareUltralight, android.nfc.tech.Ndef",
                NdefMessage(
                    arrayOf(
                        NdefRecord.createTextRecord("en", "Student: Hoang Anh Kiet - ID: 2231200101"),
                        NdefRecord.createUri("https://eiu.edu.vn"),
                        NdefRecord.createMime(
                            "application/json",
                            "{\"course\":\"CSW434\",\"lab\":3,\"module\":\"TurboNativeModule\"}".toByteArray(Charsets.UTF_8)
                        )
                    )
                )
            )
            "vcard" -> Triple(
                "04:7B:21:D0:11:4E:80",
                "android.nfc.tech.NfcA, android.nfc.tech.IsoDep, android.nfc.tech.Ndef",
                NdefMessage(
                    arrayOf(
                        NdefRecord.createMime(
                            "text/vcard",
                            "BEGIN:VCARD\nVERSION:3.0\nFN:Hoang Anh Kiet\nORG:Eastern International University\nTITLE:CSW 434 Student (2231200101)\nEND:VCARD".toByteArray(Charsets.UTF_8)
                        )
                    )
                )
            )
            else -> Triple(
                "04:A1:B2:C3:D4:E5:80",
                "android.nfc.tech.NfcA, android.nfc.tech.Ndef, android.nfc.tech.NdefFormatable",
                NdefMessage(
                    arrayOf(
                        NdefRecord.createTextRecord("en", "Hello NFC! Hoang Anh Kiet - 2231200101 (CSW 434 Lab 3)")
                    )
                )
            )
        }

        val ndefMap = parseNdefMessageToMap(ndefMessage, maxSize = 532, isWritable = true)
        val params = Arguments.createMap().apply {
            putString("tagId", tagId)
            putString("techList", techList)
            putString("source", "Android Native NdefMessage (TurboModule)")
            putMap("ndef", ndefMap)
        }
        emitEvent(EVENT_TAG_DETECTED, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    // ─── Native Intent & NDEF Processing ──────────────────────────────────────

    internal fun processNfcIntent(intent: Intent) {
        if (!isScanning) return

        // 1. Check for physical Tag object
        @Suppress("DEPRECATION")
        val tag: Tag? = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
        if (tag != null) {
            val params = Arguments.createMap().apply {
                putString("tagId", tag.id.toHexString())
                putString("techList", tag.techList.joinToString(", "))
                putString("source", "Hardware NFC Adapter")
            }
            val ndefData = readPhysicalNdefContent(tag)
            if (ndefData != null) {
                params.putMap("ndef", ndefData)
            } else {
                params.putNull("ndef")
            }
            emitEvent(EVENT_TAG_DETECTED, params)
            return
        }

        // 2. Check for raw NDEF_MESSAGES parcelable array in intent
        @Suppress("DEPRECATION")
        val rawMsgs = intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES)
        if (!rawMsgs.isNullOrEmpty()) {
            val ndefMsg = rawMsgs[0] as? NdefMessage
            if (ndefMsg != null) {
                val params = Arguments.createMap().apply {
                    putString("tagId", "04:ND:EF:00:01")
                    putString("techList", "android.nfc.tech.Ndef")
                    putString("source", "NDEF Intent Dispatch")
                    putMap("ndef", parseNdefMessageToMap(ndefMsg, 512, true))
                }
                emitEvent(EVENT_TAG_DETECTED, params)
                return
            }
        }

        // 3. Check for ADB-injected NDEF_DISCOVERED / TAG_DISCOVERED intent
        val mockPayload: String? = intent.getStringExtra("mock_payload")
        val uriData: String? = intent.data?.toString()
        if (mockPayload != null || uriData != null || intent.action == NfcAdapter.ACTION_TAG_DISCOVERED) {
            val records = mutableListOf<NdefRecord>()
            if (uriData != null) {
                records.add(NdefRecord.createUri(uriData))
            }
            if (mockPayload != null) {
                records.add(NdefRecord.createTextRecord("en", mockPayload))
            }
            if (records.isEmpty()) {
                records.add(NdefRecord.createTextRecord("en", "ADB NFC Tag Discovered — CSW434 Lab 3"))
            }
            val ndefMessage = NdefMessage(records.toTypedArray())
            val params = Arguments.createMap().apply {
                putString("tagId", "04:AD:B0:22:31:20")
                putString("techList", "android.nfc.tech.NfcA, android.nfc.tech.Ndef (ADB Intent)")
                putString("source", "ADB Intent -> Native NdefMessage")
                putMap("ndef", parseNdefMessageToMap(ndefMessage, 532, true))
            }
            emitEvent(EVENT_TAG_DETECTED, params)
        }
    }

    private fun readPhysicalNdefContent(tag: Tag): WritableMap? {
        val ndef = Ndef.get(tag) ?: return null
        return try {
            ndef.connect()
            val ndefMessage: NdefMessage = ndef.ndefMessage ?: return null
            parseNdefMessageToMap(ndefMessage, ndef.maxSize, ndef.isWritable)
        } catch (_: Exception) {
            null
        } finally {
            try {
                ndef.close()
            } catch (_: Exception) {}
        }
    }

    /**
     * Converts an Android NdefMessage into a React Native WritableMap.
     */
    private fun parseNdefMessageToMap(
        ndefMessage: NdefMessage,
        maxSize: Int,
        isWritable: Boolean
    ): WritableMap {
        val recordsArray = Arguments.createArray()
        for (record in ndefMessage.records) {
            val recordMap = Arguments.createMap().apply {
                putString("type", String(record.type, Charsets.UTF_8))
                putString("id", record.id?.toHexString() ?: "")
                putString("payload", parseNdefPayload(record))
                putString("tnf", record.tnf.toTnfString())
                putInt("byteLength", record.payload.size)
            }
            recordsArray.pushMap(recordMap)
        }
        return Arguments.createMap().apply {
            putArray("records", recordsArray)
            putInt("maxSize", maxSize)
            putBoolean("isWritable", isWritable)
        }
    }

    private fun parseNdefPayload(record: NdefRecord): String {
        return try {
            when {
                record.tnf == NdefRecord.TNF_WELL_KNOWN &&
                        record.type.contentEquals(NdefRecord.RTD_TEXT) -> {
                    val payload = record.payload
                    val languageCodeLength = payload[0].toInt() and 0x3F
                    val encoding: Charset = if ((payload[0].toInt() and 0x80) == 0)
                        Charsets.UTF_8 else Charsets.UTF_16
                    String(
                        payload,
                        1 + languageCodeLength,
                        payload.size - 1 - languageCodeLength,
                        encoding
                    )
                }

                record.tnf == NdefRecord.TNF_WELL_KNOWN &&
                        record.type.contentEquals(NdefRecord.RTD_URI) -> {
                    val payload = record.payload
                    val prefix = URI_PREFIX_MAP.getOrElse(payload[0].toInt()) { "" }
                    prefix + String(payload, 1, payload.size - 1, Charsets.UTF_8)
                }

                record.tnf == NdefRecord.TNF_MIME_MEDIA ||
                        record.tnf == NdefRecord.TNF_ABSOLUTE_URI -> {
                    String(record.payload, Charsets.UTF_8)
                }

                else -> record.payload.toHexString()
            }
        } catch (_: Exception) {
            record.payload.toHexString()
        }
    }

    private fun emitEvent(eventName: String, params: WritableMap) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    private fun ByteArray.toHexString(): String =
        joinToString(separator = ":") { byte -> "%02X".format(byte) }

    private fun Short.toTnfString(): String = when (this.toInt()) {
        NdefRecord.TNF_EMPTY.toInt() -> "TNF_EMPTY (0x00)"
        NdefRecord.TNF_WELL_KNOWN.toInt() -> "TNF_WELL_KNOWN (0x01)"
        NdefRecord.TNF_MIME_MEDIA.toInt() -> "TNF_MIME_MEDIA (0x02)"
        NdefRecord.TNF_ABSOLUTE_URI.toInt() -> "TNF_ABSOLUTE_URI (0x03)"
        NdefRecord.TNF_EXTERNAL_TYPE.toInt() -> "TNF_EXTERNAL_TYPE (0x04)"
        NdefRecord.TNF_UNKNOWN.toInt() -> "TNF_UNKNOWN (0x05)"
        else -> "TNF_RESERVED"
    }

    private val URI_PREFIX_MAP = mapOf(
        0x00 to "", 0x01 to "http://www.", 0x02 to "https://www.",
        0x03 to "http://", 0x04 to "https://", 0x05 to "tel:",
        0x06 to "mailto:", 0x07 to "ftp://anonymous:anonymous@",
        0x08 to "ftp://ftp.", 0x09 to "ftps://", 0x0A to "sftp://",
        0x0B to "smb://", 0x0C to "nfs://", 0x0D to "ftp://",
        0x0E to "dav://", 0x0F to "news:", 0x10 to "telnet://",
        0x11 to "imap:", 0x12 to "rtsp://", 0x13 to "urn:",
        0x14 to "pop:", 0x15 to "sip:", 0x16 to "sips:",
        0x17 to "tftp:", 0x18 to "btspp://", 0x19 to "btl2cap://",
        0x1A to "btgoep://", 0x1B to "tcpobex://", 0x1C to "irdaobex://",
        0x1D to "file://", 0x1E to "urn:epc:id:", 0x1F to "urn:epc:tag:",
        0x20 to "urn:epc:pat:", 0x21 to "urn:epc:raw:", 0x22 to "urn:epc:",
        0x23 to "urn:nfc:"
    )
}
