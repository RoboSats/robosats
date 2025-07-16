package com.koalasat.robosats

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast

class WebAppInterface(private val context: Context, private val webView: WebView) {
    private val TAG = "WebAppInterface"
    private val roboIdentities = RoboIdentities()

    init {
        // Check if libraries are loaded and show a toast notification if there's an issue
        if (!RoboIdentities.areLibrariesLoaded()) {
            Log.w(TAG, "Native libraries for RoboIdentities are not loaded - fallback names will be used")
            Toast.makeText(
                context,
                "Warning: Robot name generator is using fallback mode",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    @JavascriptInterface
    fun generateRoboname(uuid: String, message: String) {
        try {
            val roboname = roboIdentities.generateRoboname(message)
            Log.d(TAG, "Generated roboname: $roboname for message: $message")

            webView.post {
                webView.evaluateJavascript("javascript:window.AndroidRobosats.onResolvePromise('${uuid}', '${roboname}')", null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in generateRoboname: ${e.message}", e)

            // Handle error gracefully by returning a fallback value
            webView.post {
                webView.evaluateJavascript(
                    "javascript:window.AndroidRobosats.onRejectPromise('${uuid}', 'Error generating robot name')",
                    null
                )
            }
        }
    }
}
