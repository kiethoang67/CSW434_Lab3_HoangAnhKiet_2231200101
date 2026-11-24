package com.lab3sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

/**
 * CompassModule — Turbo Native Module for reading the Magnetometer sensor
 * on Android and computing the device's orientation relative to magnetic North.
 */
class CompassModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    companion object {
        const val MODULE_NAME = "CompassModule"
        const val EVENT_COMPASS_UPDATE = "CompassUpdate"
    }

    private val sensorManager: SensorManager =
        reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    private val magnetometer: Sensor? =
        sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)

    private val accelerometer: Sensor? =
        sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    // Default gravity (device flat) so magnetometer works immediately even before accelerometer changes
    private val gravity = floatArrayOf(0f, 0f, 9.81f)
    private val geomagnetic = floatArrayOf(0f, 25f, -40f)
    private var hasGeomagnetic = false

    private val ALPHA = 0.25f
    private var lastEmitTime = 0L
    private val EMIT_INTERVAL_MS = 40L

    override fun getName(): String = MODULE_NAME

    @ReactMethod
    fun startCompass() {
        magnetometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
    }

    @ReactMethod
    fun stopCompass() {
        sensorManager.unregisterListener(this)
    }

    /**
     * Feeds a simulated magnetic field vector for the given heading angle (0..360°)
     * through the native SensorManager.getRotationMatrix() & getOrientation() pipeline
     * and emits a CompassUpdate event to React Native.
     */
    @ReactMethod
    fun simulateDirection(targetDegrees: Double) {
        val rad = Math.toRadians(targetDegrees)
        val fieldStrength = 45.0f // Typical Earth magnetic field in μT
        // For flat device (gravity = [0, 0, +9.81]):
        // North vector in device coordinates when rotated by targetDegrees clockwise:
        geomagnetic[0] = (-fieldStrength * sin(rad)).toFloat()
        geomagnetic[1] = (fieldStrength * cos(rad)).toFloat()
        geomagnetic[2] = -15.0f
        gravity[0] = 0f
        gravity[1] = 0f
        gravity[2] = 9.81f
        hasGeomagnetic = true
        computeAndEmitHeading()
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                gravity[0] = ALPHA * event.values[0] + (1 - ALPHA) * gravity[0]
                gravity[1] = ALPHA * event.values[1] + (1 - ALPHA) * gravity[1]
                gravity[2] = ALPHA * event.values[2] + (1 - ALPHA) * gravity[2]
            }
            Sensor.TYPE_MAGNETIC_FIELD -> {
                if (!hasGeomagnetic) {
                    geomagnetic[0] = event.values[0]
                    geomagnetic[1] = event.values[1]
                    geomagnetic[2] = event.values[2]
                    hasGeomagnetic = true
                } else {
                    geomagnetic[0] = ALPHA * event.values[0] + (1 - ALPHA) * geomagnetic[0]
                    geomagnetic[1] = ALPHA * event.values[1] + (1 - ALPHA) * geomagnetic[1]
                    geomagnetic[2] = ALPHA * event.values[2] + (1 - ALPHA) * geomagnetic[2]
                }
            }
        }

        if (!hasGeomagnetic) return

        val now = System.currentTimeMillis()
        if (now - lastEmitTime < EMIT_INTERVAL_MS) return
        lastEmitTime = now

        computeAndEmitHeading()
    }

    private fun computeAndEmitHeading() {
        val rotationMatrix = FloatArray(9)
        val inclinationMatrix = FloatArray(9)
        val success = SensorManager.getRotationMatrix(
            rotationMatrix,
            inclinationMatrix,
            gravity,
            geomagnetic
        )

        var azimuth: Float
        var pitchDeg = 0.0
        var rollDeg = 0.0

        if (success) {
            val orientation = FloatArray(3)
            SensorManager.getOrientation(rotationMatrix, orientation)
            azimuth = Math.toDegrees(orientation[0].toDouble()).toFloat()
            pitchDeg = Math.toDegrees(orientation[1].toDouble())
            rollDeg = Math.toDegrees(orientation[2].toDouble())
        } else {
            // Direct magnetometer fallback using atan2(-Bx, By)
            azimuth = Math.toDegrees(
                atan2(-geomagnetic[0].toDouble(), geomagnetic[1].toDouble())
            ).toFloat()
        }

        if (azimuth < 0) azimuth += 360f
        azimuth %= 360f

        val params = Arguments.createMap().apply {
            putDouble("angle", azimuth.toDouble())
            putString("cardinal", toCardinalDirection(azimuth))
            putDouble("pitch", pitchDeg)
            putDouble("roll", rollDeg)
            putDouble("magX", geomagnetic[0].toDouble())
            putDouble("magY", geomagnetic[1].toDouble())
            putDouble("magZ", geomagnetic[2].toDouble())
        }

        emitEvent(EVENT_COMPASS_UPDATE, params)
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}

    private fun toCardinalDirection(degrees: Float): String {
        val directions = arrayOf("N", "NE", "E", "SE", "S", "SW", "W", "NW")
        val index = ((degrees + 22.5f) / 45.0f).toInt() % 8
        return directions[index]
    }

    private fun emitEvent(eventName: String, params: WritableMap) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}
