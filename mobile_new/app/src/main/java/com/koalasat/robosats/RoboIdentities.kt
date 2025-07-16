package com.koalasat.robosats

import android.util.Log

class RoboIdentities {
    companion object {
        private const val TAG = "RoboIdentities"
        private var librariesLoaded = false

        init {
            try {
                System.loadLibrary("robonames")
                System.loadLibrary("robohash")
                librariesLoaded = true
                Log.d(TAG, "Native libraries loaded successfully")
            } catch (e: UnsatisfiedLinkError) {
                Log.e(TAG, "Failed to load native libraries: ${e.message}", e)
                librariesLoaded = false
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error loading native libraries: ${e.message}", e)
                librariesLoaded = false
            }
        }

        fun areLibrariesLoaded(): Boolean {
            return librariesLoaded
        }
    }

    fun generateRoboname(initial_string: String?): String? {
        return try {
            if (!areLibrariesLoaded()) {
                Log.e(TAG, "Cannot generate roboname: Native libraries not loaded")
                ""            }
            nativeGenerateRoboname(initial_string)
        } catch (e: Exception) {
            Log.e(TAG, "Error generating roboname: ${e.message}", e)
            ""
        }
    }

    fun generateRobohash(initial_string: String?): String? {
        return try {
            if (!areLibrariesLoaded()) {
                Log.e(TAG, "Cannot generate robohash: Native libraries not loaded")
                return ""
            }
            nativeGenerateRobohash(initial_string)
        } catch (e: Exception) {
            Log.e(TAG, "Error generating robohash: ${e.message}", e)
            ""
        }
    }

    // Native functions implemented in Rust.
    private external fun nativeGenerateRoboname(initial_string: String?): String?
    private external fun nativeGenerateRobohash(initial_string: String?): String?
}
