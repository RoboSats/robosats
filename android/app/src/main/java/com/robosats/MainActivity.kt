package com.robosats

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.ServiceWorkerController
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import com.robosats.tor.TorKmp
import com.robosats.tor.TorKmpManager

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var torKmp: TorKmp
    private lateinit var loadingContainer: ConstraintLayout
    private lateinit var statusTextView: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Lock the screen orientation to portrait mode
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        // We don't need edge-to-edge since we're using fitsSystemWindows
        setContentView(R.layout.activity_main)

        // Set up the UI references
        webView = findViewById(R.id.webView)
        loadingContainer = findViewById(R.id.loadingContainer)
        statusTextView = findViewById(R.id.statusTextView)

        // Set initial status message
        updateStatus("Initializing Tor connection...")

        // Initialize Tor and setup WebView only after Tor is properly connected
        initializeTor()
    }

    private fun initializeTor() {
        // Initialize TorKmp if it's not already initialized
        try {
            try {
                torKmp = TorKmpManager.getTorKmpObject()
            } catch (e: UninitializedPropertyAccessException) {
                torKmp = TorKmp(application as Application)
                TorKmpManager.updateTorKmpObject(torKmp)
                torKmp.torOperationManager.startQuietly()
            }

            // Run Tor connection check on a background thread
            Thread {
                waitForTorConnection()
            }.start()

        } catch (e: Exception) {
            // Log the error and show a critical error message
            Log.e("TorInitialization", "Failed to initialize Tor: ${e.message}", e)

            // Show error message on the loading screen
            runOnUiThread {
                updateStatus("Critical error: Tor initialization failed. App cannot proceed securely.")
            }
        }
    }

    /**
     * Updates the status message on the loading screen
     */
    private fun updateStatus(message: String) {
        statusTextView.text = message
    }

    private fun waitForTorConnection() {
        var retries = 0
        val maxRetries = 15

        try {
            // Display connecting message
            runOnUiThread {
                updateStatus("Connecting to Tor network...")
            }

            // Wait for Tor to connect with retry mechanism
            while (!torKmp.isConnected() && retries < maxRetries) {
                if (!torKmp.isStarting()) {
                    torKmp.torOperationManager.startQuietly()
                }
                Thread.sleep(2000)
                retries += 1

                // Update status on UI thread every few retries
                if (retries % 3 == 0) {
                    runOnUiThread {
                        updateStatus("Still connecting to Tor (attempt $retries/$maxRetries)...")
                    }
                }
            }

            // Check if Tor connected successfully
            if (torKmp.isConnected()) {
                Log.d("TorInitialization", "Tor connected successfully after $retries retries")

                // Show success message and proceed
                runOnUiThread {
                    updateStatus("Tor connected successfully. Setting up secure browser...")

                    // Now that Tor is connected, set up the WebView
                    setupWebView()
                }
            } else {
                // If we've exhausted retries and still not connected
                Log.e("TorInitialization", "Failed to connect to Tor after $maxRetries retries")

                runOnUiThread {
                    updateStatus("Failed to connect to Tor after multiple attempts. App cannot proceed securely.")
                }
            }
        } catch (e: Exception) {
            Log.e("TorInitialization", "Error during Tor connection: ${e.message}", e)

            runOnUiThread {
                updateStatus("Error connecting to Tor: ${e.message}")
            }
        }
    }

    private fun setupWebView() {
        // Double-check Tor is connected before proceeding
        if (!torKmp.isConnected()) {
            Log.e("SecurityError", "Attempted to set up WebView without Tor connection")
            return
        }

        // Set a blocking WebViewClient to prevent ANY network access
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                // Block ALL requests until we're sure Tor proxy is correctly set up
                return WebResourceResponse("text/plain", "UTF-8", null)
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                // Block ALL URL loading attempts
                return true
            }
        }

        // Configure WebView settings on UI thread with security as priority
        secureWebViewSettings()

        // Show message that we're setting up secure browsing
        runOnUiThread {
            updateStatus("Setting up secure Tor browsing...")
        }

        // Configure proxy for WebView in a background thread to avoid NetworkOnMainThreadException
        Thread {
            try {
                // First verify Tor is still connected
                if (!torKmp.isConnected()) {
                    throw SecurityException("Tor disconnected during proxy setup")
                }

                // If we get here, proxy setup was successful
                // Perform one final Tor connection check
                if (!torKmp.isConnected()) {
                    throw SecurityException("Tor disconnected after proxy setup")
                }

                // Success - now configure WebViewClient and load URL on UI thread
                runOnUiThread {
                    updateStatus("Secure connection established. Loading app...")

                    // Set up WebChromeClient with restricted permissions
                    webView.webChromeClient = object : WebChromeClient() {
                        override fun onGeolocationPermissionsShowPrompt(
                            origin: String,
                            callback: GeolocationPermissions.Callback
                        ) {
                            // Deny all geolocation requests
                            callback.invoke(origin, false, false)
                            Log.d("SecurityPolicy", "Blocked geolocation request from: $origin")
                        }

                        override fun onPermissionRequest(request: PermissionRequest) {
                            // Deny all permission requests from web content
                            request.deny()
                            Log.d("SecurityPolicy", "Denied permission request: ${request.resources.joinToString()}")
                        }

                        // Control console messages
                        override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                            Log.d("WebViewConsole", "${consoleMessage.message()} -- From line ${consoleMessage.lineNumber()} of ${consoleMessage.sourceId()}")
                            return true
                        }
                    }

                    webView.settings.userAgentString = "AndroidRobosats"

                    // Add the JavaScript interface
                    webView.addJavascriptInterface(WebAppInterface(this, webView), "AndroidAppRobosats")

                    // Show WebView and hide loading screen
                    loadingContainer.visibility = View.GONE
                    webView.visibility = View.VISIBLE

                    // Now it's safe to load the local HTML file
                    webView.loadUrl("file:///android_asset/index.html")
                }
            } catch (e: Exception) {
                Log.e("WebViewSetup", "Security error in WebView setup: ${e.message}", e)

                // Show error and exit - DO NOT LOAD WEBVIEW
                runOnUiThread {
                    // Show error on loading screen
                    updateStatus("SECURITY ERROR: Cannot set up secure browsing: ${e.message}")
                }
            }
        }.start()
    }

    /**
     * Configure WebView settings with a security-first approach
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun secureWebViewSettings() {
        val webSettings = webView.settings

        // --- SECURITY SETTINGS ---

        // 1. JavaScript is required for the app to function, but we restrict it
        webSettings.javaScriptEnabled = true // Required, but we'll restrict its capabilities

        // 2. Disable features that could lead to data leakage
        webSettings.saveFormData = false
        webSettings.savePassword = false
        webSettings.cacheMode = WebSettings.LOAD_NO_CACHE
        webSettings.setGeolocationEnabled(false)

        // 3. Disable database access
        webSettings.databaseEnabled = false
        webSettings.domStorageEnabled = true // Required for most modern web apps

        // 4. File access settings - must allow cross-origin access for our use case
        webSettings.allowFileAccess = true // Needed for loading internal HTML
        webSettings.allowContentAccess = false
        webSettings.allowFileAccessFromFileURLs = true // Required for local HTML to work
        webSettings.allowUniversalAccessFromFileURLs = true // Required to allow CORS from file:// to onion URLs

        // Log these critical settings for debugging
        Log.d("WebViewSettings", "allowFileAccessFromFileURLs: ${webSettings.allowFileAccessFromFileURLs}")
        Log.d("WebViewSettings", "allowUniversalAccessFromFileURLs: ${webSettings.allowUniversalAccessFromFileURLs}")

        // 5. Disable potentially risky features
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            webSettings.javaScriptCanOpenWindowsAutomatically = false
        }
        webSettings.setSupportMultipleWindows(false)

        // 6. Set secure mixed content mode
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }

        // 7. Disable plugins (none needed for our app)
        webSettings.pluginState = WebSettings.PluginState.OFF

        // 8. Configure cookies for security
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true) // We need cookies for the app to function
        cookieManager.setAcceptThirdPartyCookies(webView, false) // Block 3rd party cookies

        // 10. Disable Service Workers (not needed for our local app)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            ServiceWorkerController.getInstance().setServiceWorkerClient(null)
        }

        // --- USABILITY SETTINGS ---

        // Allow zooming for better accessibility
        webSettings.setSupportZoom(true)
        webSettings.builtInZoomControls = true
        webSettings.displayZoomControls = false

        // Improve display for better Android integration
        webSettings.loadWithOverviewMode = true
        webSettings.useWideViewPort = true
        webSettings.textZoom = 100
    }

    // SSL error description method removed as we're not using SSL

    /**
     * Clear all WebView data when activity is destroyed
     */
    override fun onDestroy() {
        // Clear all cookies, cache, and WebView data for privacy
        CookieManager.getInstance().removeAllCookies(null)
        CookieManager.getInstance().flush()

        webView.clearCache(true)
        webView.clearHistory()
        webView.clearFormData()
        webView.clearSslPreferences()

        WebStorage.getInstance().deleteAllData()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().removeSessionCookies(null)
        }

        super.onDestroy()
    }
}
