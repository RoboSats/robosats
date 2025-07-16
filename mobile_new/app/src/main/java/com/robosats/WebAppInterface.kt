package com.robosats

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
            webView.post {
                webView.evaluateJavascript("javascript:window.AndroidRobosats.onResolvePromise('${uuid}', '${roboname}')", null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in generateRoboname", e)

            // Handle error gracefully by returning a fallback value
            webView.post {
                webView.evaluateJavascript(
                    "javascript:window.AndroidRobosats.onRejectPromise('${uuid}', 'Error generating robot name')",
                    null
                )
            }
        }
    }

    @JavascriptInterface
    fun generateRobohash(uuid: String, message: String) {
        try {
            val roboname = roboIdentities.generateRobohash(message)
            webView.post {
                webView.evaluateJavascript("javascript:window.AndroidRobosats.onResolvePromise('${uuid}', '${roboname}')", null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in generateRobohash", e)

            // Handle error gracefully by returning a fallback value
            webView.post {
                webView.evaluateJavascript(
                    "javascript:window.AndroidRobosats.onRejectPromise('${uuid}', 'Error generating robot hash')",
                    null
                )
            }
        }
    }

    @JavascriptInterface
    fun copyToClipboard(message: String) {
        try {
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip = android.content.ClipData.newPlainText("RoboSats Data", message)
            clipboard.setPrimaryClip(clip)

            // Show a toast notification
            Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()

            // Log the action
            Log.d(TAG, "Text copied to clipboard")
        } catch (e: Exception) {
            Log.e(TAG, "Error copying to clipboard", e)
            Toast.makeText(context, "Failed to copy to clipboard", Toast.LENGTH_SHORT).show()
        }
    }
}
