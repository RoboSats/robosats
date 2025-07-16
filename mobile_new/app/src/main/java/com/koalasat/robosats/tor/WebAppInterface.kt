package com.koalasat.robosats.tor

import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast

class WebAppInterface(private val context: Context, private val webView: WebView) {
    @JavascriptInterface
    fun generateRoboname(uuid: String, message: String) {
        // Handle the message received from JavaScript
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()

        webView.post {
            webView.evaluateJavascript("javascript:window.AndroidRobosats.onResolvePromise('${uuid}', '${message}')", null)
        }
    }
}
