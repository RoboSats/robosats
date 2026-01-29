package com.robosats

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import com.robosats.models.EncryptedStorage
import com.robosats.models.NostrClient
import com.robosats.services.NotificationsService
import com.robosats.tor.TorKmpManager.getTorKmpObject
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient.Builder
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern
import okhttp3.Request.Builder as RequestBuilder


/**
 * Provides a secure bridge between JavaScript and native Android code.
 * This class is designed with security in mind, implementing input validation,
 * sanitization, and proper error handling.
 */
@SuppressLint("SetJavaScriptEnabled")
class WebAppInterface(private val context: MainActivity, private val webView: WebView) {
    private val TAG = "WebAppInterface"
    private val roboIdentities = RoboIdentities()
    private val webSockets: MutableMap<String?, WebSocket?> = HashMap<String?, WebSocket?>()

    // Security patterns for input validation
    private val UUID_PATTERN = Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", Pattern.CASE_INSENSITIVE)
    private val SAFE_STRING_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s_\\-.,:;!?()\\[\\]{}\"]*$")

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

    @JavascriptInterface
    fun copyToClipboard(message: String) {
        try {
            // Copy to clipboard
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip = android.content.ClipData.newPlainText("RoboSats Data", message)
            clipboard.setPrimaryClip(clip)

            // Show a toast notification
            Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()

            // Log the action (don't log the content for privacy)
            Log.d(TAG, "Text copied to clipboard")
        } catch (e: Exception) {
            Log.e(TAG, "Error copying to clipboard", e)
            Toast.makeText(context, "Failed to copy to clipboard", Toast.LENGTH_SHORT).show()
        }
    }

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

    @JavascriptInterface
    fun openWS(uuid: String, path: String) {
        // Validate UUID
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for getTorStatus: $uuid")
            return
        }

        try {
            Log.d(TAG, "WebSocket opening: $path")
            // Create OkHttpClient
            var builder = Builder()
                .connectTimeout(60, TimeUnit.SECONDS) // Set connection timeout
                .readTimeout(120, TimeUnit.SECONDS) // Set read timeout

            if (context.useProxy) {
                builder = builder.proxy(getTorKmpObject().proxy)
            }

            val client = builder.build()

            // Create a request for the WebSocket connection
            val request: Request = RequestBuilder()
                .url(path) // Replace with your WebSocket URL
                .build()


            // Create a WebSocket listener
            val listener: WebSocketListener = object : WebSocketListener() {
                override fun onOpen(webSocket: WebSocket, response: Response) {
                    Log.d(TAG, "WebSocket opened: " + response.message)
                    resolvePromise(uuid, "true")
                    synchronized(webSockets) {
                        webSockets.put(
                            path,
                            webSocket
                        ) // Store the WebSocket instance with its URL
                        resolvePromise(uuid, path)
                    }
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                    onWsMessage(path, text)
                }

                override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                    onWsMessage(path, bytes.hex())
                }

                override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                    Log.d(TAG, "WebSocket closing: " + reason)
                    onWsClose(path)
                    synchronized(webSockets) {
                        webSockets.remove(path) // Remove the WebSocket instance by URL
                    }
                }

                override fun onFailure(
                    webSocket: WebSocket,
                    t: Throwable,
                    response: Response?
                ) {
                    Log.d(TAG, "WebSocket error: " + t.message)
                    onWsError(path)
                    rejectPromise(uuid, "false")
                }
            }

            client.newWebSocket(request, listener)
        } catch (e: Exception) {
            Log.e(TAG, "Error connecting to WebSocket", e)
            rejectPromise(uuid, "Error connecting Tor WebSocket")
        }
    }

    @JavascriptInterface
    fun sendWsMessage(uuid: String, path: String, message: String) {
        // Validate UUID
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for getTorStatus: $uuid")
            return
        }

        val websocket = webSockets[path]
        if (websocket != null) {
            websocket.send(message)
            resolvePromise(uuid, "true")
        } else {
            rejectPromise(uuid, "Error sending WebSocket message")
        }
    }

    @JavascriptInterface
    fun sendBinary(uuid: String, url: String, headers: String, base64Data: String) {
        // Validate inputs
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for sendBinary: $uuid")
            rejectPromise(uuid, "Invalid UUID")
            return
        }

        try {
            // Decode base64 to byte array
            val binaryData = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)

            // Create OkHttpClient
            var builder = Builder()
                .connectTimeout(60, TimeUnit.SECONDS) // Set connection timeout
                .readTimeout(120, TimeUnit.SECONDS) // Set read timeout

            if (context.useProxy) {
                builder = builder.proxy(getTorKmpObject().proxy)
            }

            val client = builder.build()

            // Build request with URL
            val requestBuilder = RequestBuilder().url(url)

            // Add headers from JSON and extract Content-Type
            val headersObject = JSONObject(headers)
            var contentType = "application/octet-stream" // Default content type
            val keys = headersObject.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val value = headersObject.optString(key)
                requestBuilder.addHeader(key, value)
                if (key.equals("Content-Type", ignoreCase = true)) {
                    contentType = value
                }
            }

            // Create request body with binary data
            val mediaType = contentType.toMediaType()
            val requestBody = binaryData.toRequestBody(mediaType)
            requestBuilder.put(requestBody)

            // Build and execute request
            val request = requestBuilder.build()
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    Log.d("RobosatsError", e.toString())
                    rejectPromise(uuid, "Binary upload failed: ${e.message}")
                }

                override fun onResponse(call: Call, response: Response) {
                    try {
                        // Get response body
                        val responseBody = response.body.string()

                        // Create JSON object with headers
                        val headersJson = JSONObject()
                        response.headers.names().forEach { name ->
                            headersJson.put(name, response.header(name))
                        }

                        // Return response as JSON string
                        val result = "{\"json\":$responseBody, \"headers\": $headersJson}"
                        resolvePromise(uuid, result)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error processing response", e)
                        rejectPromise(uuid, "Error processing response: ${e.message}")
                    }
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error in sendBinary", e)
            rejectPromise(uuid, "Error sending binary data: ${e.message}")
        }
    }

    @JavascriptInterface
    fun sendRequest(uuid: String, action: String, url: String, headers: String, body: String) {
        // Validate inputs
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for sendRequest: $uuid")
            rejectPromise(uuid, "Invalid UUID")
            return
        }

        try {
            // Create OkHttpClient
            var builder = Builder()
                .connectTimeout(60, TimeUnit.SECONDS) // Set connection timeout
                .readTimeout(120, TimeUnit.SECONDS) // Set read timeout

            if (context.useProxy) {
                builder = builder.proxy(getTorKmpObject().proxy)
            }

            val client = builder.build()

            // Build request with URL
            val requestBuilder = RequestBuilder().url(url)

            // Add headers from JSON
            val headersObject = JSONObject(headers)
            val keys = headersObject.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val value = headersObject.optString(key)
                requestBuilder.addHeader(key, value)
            }

            // Set request method and body
            when (action) {
                "DELETE" -> requestBuilder.delete()
                "POST" -> {
                    val mediaType = "application/json; charset=utf-8".toMediaType()
                    val requestBody = body.toRequestBody(mediaType)
                    requestBuilder.post(requestBody)
                }
                "PUT" -> {
                    val mediaType = "application/json; charset=utf-8".toMediaType()
                    val requestBody = body.toRequestBody(mediaType)
                    requestBuilder.put(requestBody)
                }
                else -> requestBuilder.get()
            }

            // Build and execute request
            val request = requestBuilder.build()
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    Log.d("RobosatsError", e.toString())
                    rejectPromise(uuid, "Request failed: ${e.message}")
                }

                override fun onResponse(call: Call, response: Response) {
                    try {
                        // Get response body
                        val responseBody = response.body.string()

                        // Create JSON object with headers
                        val headersJson = JSONObject()
                        response.headers.names().forEach { name ->
                            headersJson.put(name, response.header(name))
                        }

                        // Return response as JSON string
                        val result = "{\"json\":$responseBody, \"headers\": $headersJson}"
                        resolvePromise(uuid, result)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error processing response", e)
                        rejectPromise(uuid, "Error processing response: ${e.message}")
                    }
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error in sendRequest", e)
            rejectPromise(uuid, "Error sending request: ${e.message}")
        }
    }

    @JavascriptInterface
    fun getEncryptedStorage(uuid: String, key: String) {
        // Validate inputs before processing
        if (!isValidUuid(uuid) || !isValidInput(key)) {
            Log.e(TAG, "Invalid input for getEncryptedStorage: uuid=$uuid, key=$key")
            rejectPromise(uuid, "Invalid input parameters")
            return
        }

        try {
            // Sanitize the input before passing to native code
            val sanitizedKey = key.trim()

            val value = EncryptedStorage.getEncryptedStorage(sanitizedKey)

            // Safely encode and return the result
            resolvePromise(uuid, value)
        } catch (e: Exception) {
            Log.e(TAG, "Error in getEncryptedStorage", e)
            rejectPromise(uuid, "Error obtaining encrypted storage: $key")
        }
    }

    @JavascriptInterface
    fun setEncryptedStorage(uuid: String, key: String, value: String) {
        // Validate inputs before processing
        if (!isValidUuid(uuid) || !isValidInput(key)) {
            Log.e(TAG, "Invalid input for setEncryptedStorage: uuid=$uuid, key=$key")
            rejectPromise(uuid, "Invalid input parameters")
            return
        }
        // Sanitize the input before passing to native code
        val sanitizedKey = key.trim()
        val sanitizedValue = value.trim()

        EncryptedStorage.setEncryptedStorage(sanitizedKey, sanitizedValue)

        if (key == "garage_slots") NostrClient.refresh()
        if (key == "settings_notifications") {
            val serviceIntent = Intent(context, NotificationsService::class.java)
            if (value == "true") {
                context.startForegroundService(serviceIntent)
            } else {
                context.stopService(serviceIntent)
            }
        }

        // Safely encode and return the result
        resolvePromise(uuid, key)
    }

    @JavascriptInterface
    fun deleteEncryptedStorage(uuid: String, key: String) {
        // Validate inputs before processing
        if (!isValidUuid(uuid) || !isValidInput(key)) {
            Log.e(TAG, "Invalid input for deleteEncryptedStorage: uuid=$uuid, key=$key")
            rejectPromise(uuid, "Invalid input parameters")
            return
        }
        // Sanitize the input before passing to native code
        val sanitizedKey = key.trim()

        EncryptedStorage.deleteEncryptedStorage(sanitizedKey)

        // Safely encode and return the result
        resolvePromise(uuid, key)
    }

    @JavascriptInterface
    fun restart() {
        try {
            Log.d(TAG, "Restarting app...")

            val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            intent?.let {
                it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK)

                context.startActivity(it)
                context.finish()
            } ?: run {
                Log.e(TAG, "Could not get launch intent for app restart")
                Toast.makeText(context, "Failed to restart app", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error restarting app", e)
            Toast.makeText(context, "Failed to restart app", Toast.LENGTH_SHORT).show()
        }
    }

    private fun onWsMessage(path: String?, message: String?) {
        val encodedMessage = encodeForJavaScript(message)
        safeEvaluateJavascript("javascript:window.AndroidRobosats.onWSMessage('$path', '$encodedMessage')")
    }

    private fun onWsError(path: String?) {
        Log.d(TAG, "WebSocket error: $path")
        safeEvaluateJavascript("javascript:window.AndroidRobosats.onWsError('$path')")
    }

    private fun onWsClose(path: String?) {
        Log.d(TAG, "WebSocket close: $path")
        safeEvaluateJavascript("javascript:window.AndroidRobosats.onWsClose('$path')")
    }

    private fun resolvePromise(uuid: String, result: String) {
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for promise resolution: $uuid")
            return
        }

        val encodedResult = encodeForJavaScript(result)
        safeEvaluateJavascript("javascript:window.AndroidRobosats.onResolvePromise('$uuid', '$encodedResult')")
    }

    private fun rejectPromise(uuid: String, errorMessage: String) {
        if (!isValidUuid(uuid)) {
            Log.e(TAG, "Invalid UUID for promise rejection: $uuid")
            return
        }

        val encodedError = encodeForJavaScript(errorMessage)
        safeEvaluateJavascript("javascript:window.AndroidRobosats.onRejectPromise('$uuid', '$encodedError')")
    }

    private fun isValidInput(input: String?): Boolean {
        if (input == null || input.isEmpty()) {
            return false
        }
        return SAFE_STRING_PATTERN.matcher(input).matches()
    }

    private fun isValidUuid(uuid: String?): Boolean {
        if (uuid == null || uuid.isEmpty()) {
            return false
        }
        return UUID_PATTERN.matcher(uuid).matches()
    }

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

    private fun encodeForJavaScript(input: String?): String {
        if (input == null) return ""

        return input.replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t")
            .replace("<", "\\u003C")
            .replace(">", "\\u003E")
            .replace("&", "\\u0026")
    }

}
