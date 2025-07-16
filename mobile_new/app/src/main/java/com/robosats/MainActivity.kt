package com.robosats

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import android.graphics.Bitmap
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
import android.webkit.WebResourceError
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
import java.io.ByteArrayInputStream
import java.net.HttpURLConnection
import java.net.InetSocketAddress
import java.net.Proxy
import java.net.URL

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var torKmp: TorKmp
    private lateinit var loadingContainer: ConstraintLayout
    private lateinit var statusTextView: TextView

    // Security constants
    private val ALLOWED_DOMAINS = arrayOf(".onion")
    private val CONTENT_SECURITY_POLICY = "default-src 'self'; connect-src 'self' https://*.onion http://*.onion; " +
            "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; font-src 'self' data:; object-src 'none'; " +
            "media-src 'none'; frame-src 'none'; worker-src 'self';"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

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

        // IMMEDIATELY set a blocking WebViewClient to prevent ANY network access
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                // Block ALL requests until we're sure Tor proxy is correctly set up
                return WebResourceResponse("text/plain", "UTF-8", null)
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                // Block ALL URL loading attempts until proxy is properly configured
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

                // Try to set up the proxy
                setupProxyForWebView()

                // If we get here, proxy setup was successful
                // Perform one final Tor connection check
                if (!torKmp.isConnected()) {
                    throw SecurityException("Tor disconnected after proxy setup")
                }

                // Now get the proxy information that we previously verified in setupProxyForWebView
                // Use system properties that we've already set up and verified
                val proxyHost = System.getProperty("http.proxyHost")
                    ?: throw SecurityException("Missing proxy host in system properties")
                val proxyPort = System.getProperty("http.proxyPort")?.toIntOrNull()
                    ?: throw SecurityException("Missing or invalid proxy port in system properties")

                Log.d("TorProxy", "Using proxy settings: $proxyHost:$proxyPort")

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

                    // Create a custom WebViewClient that forces all traffic through Tor
                    webView.webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                            // Verify Tor is connected before allowing any resource request
                            if (!torKmp.isConnected()) {
                                Log.e("SecurityError", "Tor disconnected during resource request")
                                return WebResourceResponse("text/plain", "UTF-8", null)
                            }

                            val urlString = request.url.toString()
                            Log.d("TorProxy", "Intercepting request: $urlString")

                            // Block all external requests that aren't to .onion domains or local files
                            if (!isAllowedRequest(urlString)) {
                                Log.e("SecurityPolicy", "Blocked forbidden request to: $urlString")
                                return WebResourceResponse("text/plain", "UTF-8", null)
                            }

                            try {
                                // Special handling for .onion domains
                                val isOnionDomain = urlString.contains(".onion")

                                // Only proceed if it's an onion domain or local file
                                if (!isOnionDomain && !urlString.startsWith("file://")) {
                                    Log.e("SecurityPolicy", "Blocked non-onion external request: $urlString")
                                    return WebResourceResponse("text/plain", "UTF-8", null)
                                }

                                // For .onion domains, we must use SOCKS proxy type
                                val proxyType = if (isOnionDomain)
                                    Proxy.Type.SOCKS
                                else
                                    Proxy.Type.HTTP

                                // Create a proxy instance for Tor with the appropriate type
                                val torProxy = Proxy(
                                    proxyType,
                                    InetSocketAddress(proxyHost, proxyPort)
                                )

                                if (isOnionDomain) {
                                    Log.d("TorProxy", "Handling .onion domain with SOCKS proxy: $urlString")
                                }

                                // If it's a local file, return it directly
                                if (urlString.startsWith("file://")) {
                                    // Let the system handle local files
                                    return super.shouldInterceptRequest(view, request)
                                }

                                // Create connection with proxy already configured
                                val url = URL(urlString)
                                val connection = url.openConnection(torProxy)

                                // Configure basic connection properties
                                connection.connectTimeout = 60000  // Longer timeout for onion domains
                                connection.readTimeout = 60000

                                if (connection is HttpURLConnection) {
                                    // Ensure no connection reuse to prevent proxy leaks
                                    connection.setRequestProperty("Connection", "close")

                                    // Add security headers
                                    connection.setRequestProperty("Sec-Fetch-Site", "same-origin")
                                    connection.setRequestProperty("Sec-Fetch-Mode", "cors")
                                    connection.setRequestProperty("DNT", "1") // Do Not Track

                                    // Copy request headers
                                    request.requestHeaders.forEach { (key, value) ->
                                        connection.setRequestProperty(key, value)
                                    }

                                    // Set the request method
                                    connection.requestMethod = request.method

                                    // Special handling for OPTIONS (CORS preflight) requests
                                    if (request.method == "OPTIONS") {
                                        // For OPTIONS, we'll create a custom response without making a network request
                                        // This is the most reliable way to handle CORS preflight
                                        Log.d("CORS", "Handling OPTIONS preflight request for: $urlString")

                                        // Create CORS headers map
                                        val preflightHeaders = HashMap<String, String>()
                                        preflightHeaders["Access-Control-Allow-Origin"] = "*"
                                        preflightHeaders["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE, HEAD"
                                        preflightHeaders["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept, Authorization"
                                        preflightHeaders["Access-Control-Max-Age"] = "86400" // Cache preflight for 24 hours
                                        preflightHeaders["Access-Control-Allow-Credentials"] = "true"
                                        preflightHeaders["Content-Type"] = "text/plain"

                                        // Log CORS headers for debugging
                                        Log.d("CORS", "Preflight response with CORS headers: $preflightHeaders")

                                        // Return a custom preflight response without actually connecting
                                        return WebResourceResponse(
                                            "text/plain",
                                            "UTF-8",
                                            200,
                                            "OK",
                                            preflightHeaders,
                                            ByteArrayInputStream("".toByteArray())
                                        )
                                    }

                                    // Try to connect
                                    connection.connect()
                                    val responseCode = connection.responseCode

                                    // Get content type
                                    val mimeType = connection.contentType ?: "text/plain"
                                    val encoding = connection.contentEncoding ?: "UTF-8"

                                    Log.d("TorProxy", "Successfully proxied request to $url (HTTP ${connection.responseCode})")

                                    // Get the correct input stream based on response code
                                    val inputStream = if (responseCode >= 400) {
                                        connection.errorStream ?: ByteArrayInputStream(byteArrayOf())
                                    } else {
                                        connection.inputStream
                                    }

                                    // Create response headers map with security headers
                                    val responseHeaders = HashMap<String, String>()

                                    // First copy original response headers, but carefully handle CORS headers
                                    for (i in 0 until connection.headerFields.size) {
                                        val key = connection.headerFields.keys.elementAtOrNull(i)
                                        if (key != null && key.isNotEmpty()) {
                                            // Skip any CORS headers from the original response - we'll add our own
                                            if (!key.startsWith("Access-Control-")) {
                                                val value = connection.getHeaderField(key)
                                                if (value != null) {
                                                    responseHeaders[key] = value
                                                }
                                            } else {
                                                // Log any CORS headers we're skipping from the original response
                                                Log.d("CORS", "Skipping original CORS header: $key: ${connection.getHeaderField(key)}")
                                            }
                                        }
                                    }

                                    // Add our own CORS headers
                                    responseHeaders["Access-Control-Allow-Origin"] = "*"
                                    responseHeaders["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE, HEAD"
                                    responseHeaders["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept, Authorization"
                                    responseHeaders["Access-Control-Allow-Credentials"] = "true"
                                    if (!responseHeaders.containsKey("Content-Security-Policy")) {
                                        responseHeaders["Content-Security-Policy"] = CONTENT_SECURITY_POLICY
                                    }
                                    if (!responseHeaders.containsKey("X-Content-Type-Options")) {
                                        responseHeaders["X-Content-Type-Options"] = "nosniff"
                                    }
                                    if (!responseHeaders.containsKey("X-Frame-Options")) {
                                        responseHeaders["X-Frame-Options"] = "DENY"
                                    }
                                    if (!responseHeaders.containsKey("Referrer-Policy")) {
                                        responseHeaders["Referrer-Policy"] = "no-referrer"
                                    }

                                    // Log the CORS headers for debugging
                                    responseHeaders["Access-Control-Allow-Origin"]?.let {
                                        Log.d("CORS", "Access-Control-Allow-Origin: $it")
                                    }

                                    // Return proxied response with security headers
                                    return WebResourceResponse(
                                        mimeType,
                                        encoding,
                                        responseCode,
                                        "OK",
                                        responseHeaders,
                                        inputStream
                                    )
                                } else {
                                    // For non-HTTP connections (rare)
                                    val inputStream = connection.getInputStream()
                                    Log.d("TorProxy", "Successfully established non-HTTP connection to $url")
                                    return WebResourceResponse(
                                        "application/octet-stream",
                                        "UTF-8",
                                        inputStream
                                    )
                                }
                            } catch (e: Exception) {
                                Log.e("TorProxy", "Error proxying request: $urlString - ${e.message}", e)

                                // For security, block the request rather than falling back to system handling
                                return WebResourceResponse("text/plain", "UTF-8", null)
                            }
                        }

                        // We're not handling SSL, so we don't need the onReceivedSslError method

                        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                            // Verify Tor is still connected before allowing any request
                            if (!torKmp.isConnected()) {
                                Log.e("SecurityError", "Tor disconnected during navigation")
                                return true // Block the request
                            }
                            return false // Let our proxied client handle it
                        }

                        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                            Log.e("WebViewError", "Error loading resource: ${error.description}")
                            super.onReceivedError(view, request, error)
                        }

                        override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                            // Verify Tor is connected when page starts loading
                            if (!torKmp.isConnected()) {
                                Log.e("SecurityError", "Tor disconnected as page started loading")
                                view.stopLoading()
                                return
                            }
                            super.onPageStarted(view, url, favicon)
                        }

                        override fun onPageFinished(view: WebView, url: String) {
                            // Verify Tor is still connected when page finishes loading
                            if (!torKmp.isConnected()) {
                                Log.e("SecurityError", "Tor disconnected after page loaded")
                                return
                            }

                            // No JavaScript injection - just log page load completion
                            Log.d("WebView", "Page finished loading: $url")

                            super.onPageFinished(view, url)
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

    private fun setupProxyForWebView() {
        // Triple-check Tor is connected
        if (!torKmp.isConnected()) {
            throw SecurityException("Cannot set up proxy - Tor is not connected")
        }

        try {
            // Get the proxy from TorKmpManager, handling possible exceptions
            val proxy = TorKmpManager.getTorKmpObject().proxy ?:
                throw SecurityException("Tor proxy is null despite Tor being connected")

            val inetSocketAddress = proxy.address() as InetSocketAddress
            val host = inetSocketAddress.hostName
            val port = inetSocketAddress.port

            if (host.isBlank() || port <= 0) {
                throw SecurityException("Invalid Tor proxy address: $host:$port")
            }

            Log.d("WebViewProxy", "Setting up Tor proxy: $host:$port")

            // Set up the proxy
            setWebViewProxy(applicationContext, host, port)

            // Verify proxy was set correctly
            if (System.getProperty("http.proxyHost") != host ||
                System.getProperty("http.proxyPort") != port.toString()) {
                throw SecurityException("Proxy verification failed - system properties don't match expected values")
            }

            Log.d("WebViewProxy", "Proxy setup completed successfully")
        } catch (e: Exception) {
            Log.e("WebViewProxy", "Error setting up proxy: ${e.message}", e)
            throw SecurityException("Failed to set up Tor proxy: ${e.message}", e)
        }
    }

    /**
     * Sets the proxy for WebView using the most direct approach that's known to work with Tor
     */
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

    /**
     * Check if a URL request is allowed based on security policy
     */
    private fun isAllowedRequest(url: String): Boolean {
        // Always allow local file requests
        if (url.startsWith("file:///android_asset/") || url.startsWith("file:///data/")) {
            return true
        }

        // Allow onion domains
        if (ALLOWED_DOMAINS.any { url.contains(it) }) {
            return true
        }

        // Block everything else
        return false
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

    private fun setWebViewProxy(context: Context, proxyHost: String, proxyPort: Int) {
        try {
            // First set system properties (required as a foundation)
            System.setProperty("http.proxyHost", proxyHost)
            System.setProperty("http.proxyPort", proxyPort.toString())
            System.setProperty("https.proxyHost", proxyHost)
            System.setProperty("https.proxyPort", proxyPort.toString())
            System.setProperty("proxy.host", proxyHost)
            System.setProperty("proxy.port", proxyPort.toString())

            Log.d("WebViewProxy", "Set system proxy properties")

            // Create and apply a proxy at the application level
            val proxyClass = Class.forName("android.net.ProxyInfo")
            val proxyConstructor = proxyClass.getConstructor(String::class.java, Int::class.javaPrimitiveType, String::class.java)
            val proxyInfo = proxyConstructor.newInstance(proxyHost, proxyPort, null)

            try {
                // Try to set global proxy through ConnectivityManager
                val connectivityManager = context.getSystemService(CONNECTIVITY_SERVICE)
                val setDefaultProxyMethod = connectivityManager.javaClass.getDeclaredMethod("setDefaultProxy", proxyClass)
                setDefaultProxyMethod.isAccessible = true
                setDefaultProxyMethod.invoke(connectivityManager, proxyInfo)
                Log.d("WebViewProxy", "Set proxy via ConnectivityManager")
            } catch (e: Exception) {
                Log.w("WebViewProxy", "Could not set proxy via ConnectivityManager: ${e.message}")
            }

            // WebView operations must be run on the UI thread
            runOnUiThread {
                try {
                    // Force WebView to use proxy via direct settings (must be on UI thread)
                    webView.settings.javaClass.getDeclaredMethod("setHttpProxy", String::class.java, Int::class.javaPrimitiveType)
                        ?.apply { isAccessible = true }
                        ?.invoke(webView.settings, proxyHost, proxyPort)
                    Log.d("WebViewProxy", "Applied proxy directly to WebView settings")
                } catch (e: Exception) {
                    Log.w("WebViewProxy", "Could not set proxy directly on WebView settings: ${e.message}")
                    // Continue - we'll rely on system properties and connection-level proxying
                }
            }

            // Wait to ensure UI thread operations complete
            // This prevents race conditions with WebView operations
            Thread.sleep(500)

            Log.d("WebViewProxy", "Proxy setup completed")
        } catch (e: Exception) {
            Log.e("WebViewProxy", "Error setting WebView proxy", e)
            throw SecurityException("Failed to set WebView proxy: ${e.message}", e)
        }
    }
}
