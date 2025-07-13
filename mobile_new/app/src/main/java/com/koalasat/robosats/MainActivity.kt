package com.koalasat.robosats

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // We don't need edge-to-edge since we're using fitsSystemWindows
        setContentView(R.layout.activity_main)

        // Set up the WebView
        webView = findViewById(R.id.webView)
        setupWebView()
    }

    private fun setupWebView() {
        // Set WebViewClient to handle page navigation
        webView.webViewClient = WebViewClient()

        val webSettings = webView.settings

        // Enable JavaScript
        webSettings.javaScriptEnabled = true

        // Enable DOM storage for HTML5 apps
        webSettings.domStorageEnabled = true

        // Set cache mode
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT

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

        // Load the website
        webView.loadUrl("http://check.torproject.org")
    }
}
