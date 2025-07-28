package com.robosats

import android.Manifest
import android.annotation.SuppressLint
import android.app.Application
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.net.Uri
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
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.robosats.models.EncryptedStorage
import com.robosats.models.LanguageManager
import com.robosats.services.NotificationsService
import com.robosats.tor.TorKmp
import com.robosats.tor.TorKmpManager
import com.robosats.tor.TorKmpManager.getTorKmpObject
import com.vitorpamplona.ammolite.service.HttpClientManager

class MainActivity : AppCompatActivity() {
    private val requestCodePostNotifications: Int = 1
    private lateinit var webView: WebView
    private lateinit var torKmp: TorKmp
    private lateinit var loadingContainer: ConstraintLayout
    private lateinit var statusTextView: TextView
    private lateinit var intentData: String
    private lateinit var useOrbotButton: Button
    var useProxy: Boolean = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize EncryptedStorage
        EncryptedStorage.init(this)

        // Initialize language manager with system language
        LanguageManager.init(this)

        // Lock the screen orientation to portrait mode
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        // We don't need edge-to-edge since we're using fitsSystemWindows
        setContentView(R.layout.activity_main)

        // Set up the UI references
        webView = findViewById(R.id.webView)
        loadingContainer = findViewById(R.id.loadingContainer)
        statusTextView = findViewById(R.id.statusTextView)
        useOrbotButton = findViewById(R.id.useOrbotButton)

        // Set click listener for action button
        useOrbotButton.setOnClickListener {
            onUseOrbotButtonClicked()
        }

        // Set initial status message
        updateStatus(getString(R.string.init_tor))

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS,
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                requestCodePostNotifications,
            )
        }

        val intent = intent
        intentData = ""
        if (intent != null) {
            val orderId = intent.getStringExtra("order_id")
            if (orderId?.isNotEmpty() == true) {
                intentData = orderId
            }
        }


        val settingProxy = EncryptedStorage.getEncryptedStorage("settings_use_proxy")
        if (settingProxy == "false") {
            // Setup WebView to use Orbot if the user previously clicked
            onUseOrbotButtonClicked()
        } else {
            // Initialize Tor and setup WebView only after Tor is properly connected
            initializeTor()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.let {
            val orderId = intent.getStringExtra("order_id")
            if (orderId?.isNotEmpty() == true) {
                intentData = orderId
            }
        }
    }

    /**
     * Disables the built-in proxy for users with Orbot configured
     * This assumes that Orbot is already running and properly configured
     * to handle .onion addresses through the system proxy settings
     */
    private fun onUseOrbotButtonClicked() {
        Log.d("OrbotMode", "Switching to Orbot proxy mode")
        EncryptedStorage.setEncryptedStorage("settings_use_proxy", "false")
        useProxy = false

        // Show a message to the user
        Toast.makeText(
            this,
            getString(R.string.using_orbot),
            Toast.LENGTH_LONG
        ).show()

        setupWebView()
    }

    /**
     * Initialize Notifications service
     */
    fun initializeNotifications() {
        startForegroundService(
            Intent(
                this,
                NotificationsService::class.java,
            ),
        )
    }

    /**
     * Initialize Notifications service
     */
    fun stopNotifications() {
        stopService(
            Intent(
                this,
                NotificationsService::class.java,
            ),
        )
    }

    /**
     * Initialize TorKmp if it's not already initialized
     */
    private fun initializeTor() {
        try {
            try {
                torKmp = getTorKmpObject()
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
                updateStatus(getString(R.string.tor_init_error))
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
                updateStatus(getString(R.string.connecting_tor))
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
                        updateStatus(getString(R.string.still_connecting_tor))
                    }
                }
            }

            // Check if Tor connected successfully
            if (torKmp.isConnected()) {
                Log.d("TorInitialization", "Tor connected successfully after $retries retries")

                // Show success message and proceed
                runOnUiThread {
                    updateStatus(getString(R.string.connected_tor))

                    HttpClientManager.setDefaultProxy(getTorKmpObject().proxy)

                    // Now that Tor is connected, set up the WebView
                    setupWebView()
                }
            } else {
                // If we've exhausted retries and still not connected
                Log.e("TorInitialization", "Failed to connect to Tor after $maxRetries retries")

                runOnUiThread {
                    updateStatus(getString(R.string.fail_tor))
                }
            }
        } catch (e: Exception) {
            Log.e("TorInitialization", "Error during Tor connection: ${e.message}", e)

            runOnUiThread {
                updateStatus(getString(R.string.error_tor) + "${e.message}")
            }
        }
    }

    /**
     * Configures initial WebView settings with external blocked
     */
    private fun setupWebView() {
        // Double-check Tor is connected before proceeding
        if (useProxy && !torKmp.isConnected()) {
            Log.e("SecurityError", "Attempted to set up WebView without Tor connection")
            return
        }

        // Set a blocking WebViewClient to prevent ANY network access
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                // Block ALL requests until we're sure Tor proxy is correctly set up
                return WebResourceResponse("text/plain", "UTF-8", null)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                // Block ALL URL loading attempts
                return true
            }
        }

        // Configure WebView settings on UI thread with security as priority
        secureWebViewSettings()

        // Show message that we're setting up secure browsing
        runOnUiThread {
            updateStatus(if (useProxy) getString(R.string.setting_tor) else getString(R.string.setting_orbot))
        }

        // Configure proxy for WebView in a background thread to avoid NetworkOnMainThreadException
        Thread {
            try {
                // First verify Tor is still connected
                if (useProxy && !torKmp.isConnected()) {
                    throw SecurityException("Tor disconnected during proxy setup")
                }

                // Success - now configure WebViewClient and load URL on UI thread
                runOnUiThread {
                    updateStatus(getString(R.string.loading_app))

                    // Set up WebViewClient that allows external links and deep links to be opened
                    webView.webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                            val url = request.url.toString()
                            val uri = request.url

                            if (url.startsWith("file:///android_asset/")) return false

                            try {
                                Log.d("ExternalLink", "Attempting to open: $url")

                                val intent = Intent(Intent.ACTION_VIEW, uri)
                                if (intent.resolveActivity(packageManager) != null) {
                                    startActivity(intent)
                                    Log.d("ExternalLink", "Successfully opened link in external app")
                                } else {
                                    Log.w("ExternalLink", "No app found to handle: $url")
                                    if (url.startsWith("http://") || url.startsWith("https://")) {
                                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                        startActivity(browserIntent)
                                        Log.d("ExternalLink", "Opened http/https link in browser")
                                    }
                                }

                                return true
                            } catch (e: Exception) {
                                Log.e("ExternalLink", "Failed to open external link: ${e.message}", e)
                                return true
                            }
                        }
                    }

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

                    val notifications = EncryptedStorage.getEncryptedStorage("settings_notifications")
                    if (notifications != "false") initializeNotifications()

                    if (intentData != "") {
                        webView.post {
                            try {
                                webView.evaluateJavascript("javascript:window.AndroidDataRobosats =  { navigateToPage: '$intentData' }", null)
                            } catch (e: Exception) {
                                Log.e("NavigateToPage", "Error evaluating JavaScript: $e")
                            }
                        }
                    }
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
        ServiceWorkerController.getInstance().setServiceWorkerClient(null)

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

        stopNotifications()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().removeSessionCookies(null)
        }

        super.onDestroy()
    }
}
