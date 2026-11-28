package com.robosats

import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import java.net.MalformedURLException
import java.net.URL

/**
 * Validates that a URL is safe to request from the native HTTP client.
 * Accepts only http/https/ws/wss schemes and rejects private/loopback addresses
 * (which would enable SSRF against local services on the device or local network).
 * All coordinator traffic is routed through the Tor SOCKS proxy, so .onion hosts
 * with http/https are legitimate.
 *
 * Returns the HttpUrl built from the ws→http / wss→https normalised string.
 * okhttp's HttpUrl only parses http/https, so the raw ws(s):// string would
 * always yield null from toHttpUrlOrNull() and every relay WebSocket open
 * would be rejected. okhttp's WebSocket stack treats the request as HTTP
 * with an Upgrade header, so the normalised URL is the correct wire form.
 * The scheme allowlist check (ws/wss allowed) is still performed on the
 * original string beforehand, so SSRF protections are fully preserved.
 */
internal fun parseValidatedUrl(rawUrl: String?): HttpUrl? {
    if (rawUrl.isNullOrBlank()) return null
    return try {
        val trimmed = rawUrl.trim()
        val scheme = trimmed.substringBefore("://").lowercase()
        if (scheme !in setOf("http", "https", "ws", "wss")) return null
        val normalized = when (scheme) {
            "ws" -> "http://" + trimmed.removePrefix("ws://")
            "wss" -> "https://" + trimmed.removePrefix("wss://")
            else -> trimmed
        }
        val javaUrl = URL(normalized)
        val host = javaUrl.host.lowercase()
        if (host == "localhost") return null
        val ipv4Loopback = Regex("""^127\.\d+\.\d+\.\d+$""")
        val ipv4Private = Regex("""^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)""")
        val ipv4LinkLocal = Regex("""^169\.254\.""")
        if (ipv4Loopback.containsMatchIn(host)) return null
        if (ipv4Private.containsMatchIn(host)) return null
        if (ipv4LinkLocal.containsMatchIn(host)) return null
        if (host == "::1" || host == "[::1]") return null
        normalized.toHttpUrlOrNull()
    } catch (e: MalformedURLException) {
        null
    } catch (e: IllegalArgumentException) {
        null
    }
}
