package com.koalasat.robosats

import android.app.Application
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import com.koalasat.robosats.tor.WebAppInterface
import com.robosats.tor.TorKmp
import com.robosats.tor.TorKmpManager
import java.net.InetSocketAddress

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var torKmp: TorKmp

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // We don't need edge-to-edge since we're using fitsSystemWindows
        setContentView(R.layout.activity_main)

        // Set up the WebView reference
        webView = findViewById(R.id.webView)

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

            // Show a toast notification about the critical error
            runOnUiThread {
                android.widget.Toast.makeText(
                    this,
                    "Critical error: Tor initialization failed. App cannot proceed securely.",
                    android.widget.Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun waitForTorConnection() {
        var retries = 0
        val maxRetries = 15

        try {
            // Display connecting message
            runOnUiThread {
                android.widget.Toast.makeText(
                    this,
                    "Connecting to Tor network...",
                    android.widget.Toast.LENGTH_SHORT
                ).show()
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
                        android.widget.Toast.makeText(
                            this,
                            "Still connecting to Tor (attempt $retries/$maxRetries)...",
                            android.widget.Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            }

            // Check if Tor connected successfully
            if (torKmp.isConnected()) {
                Log.d("TorInitialization", "Tor connected successfully after $retries retries")

                // Show success message
                runOnUiThread {
                    android.widget.Toast.makeText(
                        this,
                        "Tor connected successfully",
                        android.widget.Toast.LENGTH_SHORT
                    ).show()

                    // Now that Tor is connected, set up the WebView
                    setupWebView()
                }
            } else {
                // If we've exhausted retries and still not connected
                Log.e("TorInitialization", "Failed to connect to Tor after $maxRetries retries")

                runOnUiThread {
                    android.widget.Toast.makeText(
                        this,
                        "Failed to connect to Tor after multiple attempts. App cannot proceed securely.",
                        android.widget.Toast.LENGTH_LONG
                    ).show()
                }
            }
        } catch (e: Exception) {
            Log.e("TorInitialization", "Error during Tor connection: ${e.message}", e)

            runOnUiThread {
                android.widget.Toast.makeText(
                    this,
                    "Error connecting to Tor: ${e.message}",
                    android.widget.Toast.LENGTH_LONG
                ).show()
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

        // Configure WebView settings on UI thread
        val webSettings = webView.settings

        // Enable JavaScript
        webSettings.javaScriptEnabled = true

        // Enable DOM storage for HTML5 apps
        webSettings.domStorageEnabled = true

        // Enable CORS and cross-origin requests
        webSettings.allowUniversalAccessFromFileURLs = true
        webSettings.allowFileAccessFromFileURLs = true

        // Disable cache completely to prevent leaks
        webSettings.cacheMode = WebSettings.LOAD_NO_CACHE

        // Enable mixed content (http in https)
        webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // Enable zooming
        webSettings.setSupportZoom(true)
        webSettings.builtInZoomControls = true
        webSettings.displayZoomControls = false

        // Enable HTML5 features
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true
        webSettings.loadWithOverviewMode = true
        webSettings.useWideViewPort = true
        webSettings.setSupportMultipleWindows(true)
        webSettings.javaScriptCanOpenWindowsAutomatically = true

        // Improve display for better Android integration
        webSettings.textZoom = 100 // Normal text zoom

        // Show message that we're setting up secure browsing
        runOnUiThread {
            android.widget.Toast.makeText(
                this,
                "Setting up secure Tor browsing...",
                android.widget.Toast.LENGTH_SHORT
            ).show()
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
                    android.widget.Toast.makeText(
                        this,
                        "Secure connection established",
                        android.widget.Toast.LENGTH_SHORT
                    ).show()

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

                            try {
                                // Special handling for .onion domains
                                val isOnionDomain = urlString.contains(".onion")

                                // For .onion domains, we must use SOCKS proxy type
                                val proxyType = if (isOnionDomain)
                                    java.net.Proxy.Type.SOCKS
                                else
                                    java.net.Proxy.Type.HTTP

                                // Create a proxy instance for Tor with the appropriate type
                                val torProxy = java.net.Proxy(
                                    proxyType,
                                    java.net.InetSocketAddress(proxyHost, proxyPort)
                                )

                                if (isOnionDomain) {
                                    Log.d("TorProxy", "Handling .onion domain with SOCKS proxy: $urlString")
                                }

                                // Create connection with proxy already configured
                                val url = java.net.URL(urlString)
                                val connection = url.openConnection(torProxy)

                                // Configure basic connection properties
                                connection.connectTimeout = 60000  // Longer timeout for onion domains
                                connection.readTimeout = 60000

                                if (connection is java.net.HttpURLConnection) {
                                    // Ensure no connection reuse to prevent proxy leaks
                                    connection.setRequestProperty("Connection", "close")

                                    // Copy request headers
                                    request.requestHeaders.forEach { (key, value) ->
                                        connection.setRequestProperty(key, value)
                                    }

                                    // Special handling for OPTIONS (CORS preflight) requests
                                    if (request.method == "OPTIONS") {
                                        // Handle preflight CORS request
                                        connection.requestMethod = "OPTIONS"
                                        connection.setRequestProperty("Access-Control-Request-Method",
                                            request.requestHeaders["Access-Control-Request-Method"] ?: "GET, POST, OPTIONS")
                                        connection.setRequestProperty("Access-Control-Request-Headers",
                                            request.requestHeaders["Access-Control-Request-Headers"] ?: "")
                                    } else {
                                        // Set request method for non-OPTIONS requests
                                        connection.requestMethod = request.method
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
                                        connection.errorStream ?: java.io.ByteArrayInputStream(byteArrayOf())
                                    } else {
                                        connection.inputStream
                                    }

                                    // Create response headers map with CORS headers
                                    val responseHeaders = HashMap<String, String>()

                                    // Add CORS headers
                                    responseHeaders["Access-Control-Allow-Origin"] = "*"
                                    responseHeaders["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
                                    responseHeaders["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept"
                                    responseHeaders["Access-Control-Allow-Credentials"] = "true"

                                    // Copy original response headers
                                    for (i in 0 until connection.headerFields.size) {
                                        val key = connection.headerFields.keys.elementAtOrNull(i)
                                        if (key != null) {
                                            val value = connection.getHeaderField(key)
                                            if (value != null) {
                                                responseHeaders[key] = value
                                            }
                                        }
                                    }

                                    // Return proxied response with CORS headers
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

                                // For non-onion domains, let the system handle it
                                return super.shouldInterceptRequest(view, request)
                            }
                        }

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

                        override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
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

                    // Now it's safe to load the local HTML file
                    webView.loadUrl("file:///android_asset/index.html")
                }
            } catch (e: Exception) {
                Log.e("WebViewSetup", "Security error in WebView setup: ${e.message}", e)

                // Show error and exit - DO NOT LOAD WEBVIEW
                runOnUiThread {
                    // Show toast with error
                    android.widget.Toast.makeText(
                        this,
                        "SECURITY ERROR: Cannot set up secure browsing: ${e.message}",
                        android.widget.Toast.LENGTH_LONG
                    ).show()
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
                val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE)
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
