package com.lab3sensors

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * SensorsPackage — registers NfcModule and CompassModule with React Native.
 *
 * This single package contains both sensor Turbo Modules so we only need to
 * add one entry in MainApplication.getPackages().
 */
class SensorsPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(
        NfcModule(reactContext),
        CompassModule(reactContext)
    )

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
