package com.robosats

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import com.robosats.tor.TorKmpManager.getTorKmpObject
import android.annotation.SuppressLint
import android.text.TextUtils
import java.util.UUID
import java.util.regex.Pattern

/**
 * Provides a secure bridge between JavaScript and native Android code.
 * This class is designed with security in mind, implementing input validation,
 * sanitization, and proper error handling.
 */
@SuppressLint("SetJavaScriptEnabled")
class WebAppInterface(private val context: Context, private val webView: WebView) {
    private val TAG = "WebAppInterface"
    private val roboIdentities = RoboIdentities()

    // Security patterns for input validation
    private val UUID_PATTERN = Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", Pattern.CASE_INSENSITIVE)
    private val SAFE_STRING_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s_\\-.,:;!?()\\[\\]{}]*$")

    // Maximum length for input strings
    private val MAX_INPUT_LENGTH = 1000

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

    /**
     * Validates that a string contains only safe characters and is within length limits
     */
    private fun isValidInput(input: String?, maxLength: Int = MAX_INPUT_LENGTH): Boolean {
        if (input == null || input.isEmpty() || input.length > maxLength) {
            return false
        }
        return SAFE_STRING_PATTERN.matcher(input).matches()
    }

    /**
     * Validates that a string is a valid UUID
     */
    private fun isValidUuid(uuid: String?): Boolean {
        if (uuid == null || uuid.isEmpty()) {
            return false
        }
        return UUID_PATTERN.matcher(uuid).matches()
    }

    /**
     * Safely evaluates JavaScript, escaping any potentially dangerous characters
     */
    private fun safeEvaluateJavascript(script: String) {
        // Remove any null bytes which could be used to trick the JS interpreter
        val sanitizedScript = script.replace("\u0000", "")

        webView.post {
            try {
                webView.evaluateJavascript(sanitizedScript, null)
            } catch (e: Exception) {
                Log.e(TAG, "Error evaluating JavaScript: $e")
            }
        }
    }

    /**
     * Safely encodes a string for use in JavaScript
     */
    private fun encodeForJavaScript(input: String): String {
        return input.replace("\\", "\\\\")
                   .replace("'", "\\'")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("<", "\\u003C")
                   .replace(">", "\\u003E")
                   .replace("&", "\\u0026")
    }

    /**
     * Generate a robot name from the given message
     * @param uuid A unique identifier for the JavaScript Promise
     * @param message The input message to generate a robot name from
     */
    @JavascriptInterface
    fun generateRoboname(uuid: String, message: String) {
        // Validate inputs before processing
        if (!isValidUuid(uuid) || !isValidInput(message)) {
            Log.e(TAG, "Invalid input for generateRoboname: uuid=$uuid, message=$message")
            rejectPromise(uuid, "Invalid input parameters")
            return
        }

        try {
            // Sanitize the input before passing to native code
            val sanitizedMessage = message.trim()

            // Generate the roboname
            val roboname = roboIdentities.generateRoboname(sanitizedMessage)

            // Safely encode and return the result
            resolvePromise(uuid, roboname ?: "")
        } catch (e: Exception) {
            Log.e(TAG, "Error in generateRoboname", e)
            rejectPromise(uuid, "Error generating robot name")
        }
    }

    /**
     * Helper function to safely resolve a JavaScript Promise
     */
    private fun resolvePromise(uuid: String, result: String) {
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for promise resolution: $uuid")
            return
        }

        val encodedResult = encodeForJavaScript(result)
        safeEvaluateJavascript("javascript:window.AndroidRobosats.onResolvePromise('$uuid', '$encodedResult')")
    }

    /**
     * Helper function to safely reject a JavaScript Promise
     */
    private fun rejectPromise(uuid: String, errorMessage: String) {
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for promise rejection: $uuid")
            return
        }

        val encodedError = encodeForJavaScript(errorMessage)
        safeEvaluateJavascript("javascript:window.AndroidRobosats.onRejectPromise('$uuid', '$encodedError')")
    }

    /**
     * Generate a robot hash from the given message
     * @param uuid A unique identifier for the JavaScript Promise
     * @param message The input message to generate a robot hash from
     */
    @JavascriptInterface
    fun generateRobohash(uuid: String, message: String) {
        // Validate inputs before processing
        if (!isValidUuid(uuid) || !isValidInput(message)) {
            Log.e(TAG, "Invalid input for generateRobohash: uuid=$uuid, message=$message")
            rejectPromise(uuid, "Invalid input parameters")
            return
        }

        try {
            // Sanitize the input before passing to native code
            val sanitizedMessage = message.trim()

            // Generate the robohash
            val robohash = roboIdentities.generateRobohash(sanitizedMessage)

            // Safely encode and return the result
            resolvePromise(uuid, robohash ?: "")
        } catch (e: Exception) {
            Log.e(TAG, "Error in generateRobohash", e)
            rejectPromise(uuid, "Error generating robot hash")
        }
    }

    /**
     * Copy text to the clipboard
     * @param message The text to copy to the clipboard
     */
    @JavascriptInterface
    fun copyToClipboard(message: String) {
        // Validate input
        if (!isValidInput(message, 10000)) { // Allow longer text for clipboard
            Log.e(TAG, "Invalid input for copyToClipboard")
            Toast.makeText(context, "Invalid content for clipboard", Toast.LENGTH_SHORT).show()
            return
        }

        try {
            // Limit clipboard content size for security
            val truncatedMessage = if (message.length > 10000) {
                message.substring(0, 10000) + "... (content truncated for security)"
            } else {
                message
            }

            // Copy to clipboard
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip = android.content.ClipData.newPlainText("RoboSats Data", truncatedMessage)
            clipboard.setPrimaryClip(clip)

            // Show a toast notification
            Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()

            // Log the action (don't log the content for privacy)
            Log.d(TAG, "Text copied to clipboard (${truncatedMessage.length} chars)")
        } catch (e: Exception) {
            Log.e(TAG, "Error copying to clipboard", e)
            Toast.makeText(context, "Failed to copy to clipboard", Toast.LENGTH_SHORT).show()
        }
    }

    /**
     * Get the current Tor connection status
     * @param uuid A unique identifier for the JavaScript Promise
     */
    @JavascriptInterface
    fun getTorStatus(uuid: String) {
        // Validate UUID
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for getTorStatus: $uuid")
            return
        }

        try {
            // Get Tor status safely
            val torState = getTorKmpObject().torState.state.name

            // Return the status through the secure promise resolution
            resolvePromise(uuid, torState)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting Tor status", e)
            rejectPromise(uuid, "Error retrieving Tor status")
        }
    }
}
