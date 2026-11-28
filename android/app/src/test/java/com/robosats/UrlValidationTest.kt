package com.robosats

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class UrlValidationTest {

    private fun url(rawUrl: String?): okhttp3.HttpUrl? = parseValidatedUrl(rawUrl)

    @Test
    fun parsesOnionWebSocketUrlToHttpUrl() {
        val parsed = url("ws://qwertyuiop.onion/relay/")
        assertEquals("http", parsed?.scheme)
        assertEquals("qwertyuiop.onion", parsed?.host)
        assertEquals("/relay/", parsed?.encodedPath)
    }

    @Test
    fun parsesSecureWebSocketUrlToHttpsUrl() {
        val parsed = url("wss://relay.example.com/relay/")
        assertEquals("https", parsed?.scheme)
        assertEquals("relay.example.com", parsed?.host)
        assertEquals("/relay/", parsed?.encodedPath)
    }

    @Test
    fun parsesPlainHttpUrlUnchanged() {
        val parsed = url("http://qwertyuiop.onion/api/info/")
        assertEquals("http", parsed?.scheme)
        assertEquals("qwertyuiop.onion", parsed?.host)
        assertEquals("/api/info/", parsed?.encodedPath)
    }

    @Test
    fun parsesHttpsUrlUnchanged() {
        val parsed = url("https://relay.example.com/relay/")
        assertEquals("https", parsed?.scheme)
        assertEquals("relay.example.com", parsed?.host)
    }

    @Test
    fun keepsExplicitPort() {
        val parsed = url("ws://qwertyuiop.onion:8080/relay/")
        assertEquals("http", parsed?.scheme)
        assertEquals(8080, parsed?.port)
    }

    @Test
    fun rejectsUnsupportedScheme() {
        assertNull(url("ftp://relay.example.com/relay/"))
    }

    @Test
    fun rejectsMissingScheme() {
        assertNull(url("relay.example.com/relay/"))
    }

    @Test
    fun rejectsNullAndBlank() {
        assertNull(url(null))
        assertNull(url(""))
        assertNull(url("   "))
    }

    @Test
    fun rejectsLoopbackHosts() {
        assertNull(url("http://localhost/relay/"))
        assertNull(url("ws://127.0.0.1/relay/"))
        assertNull(url("ws://127.10.0.1/relay/"))
        assertNull(url("http://[::1]/relay/"))
    }

    @Test
    fun rejectsPrivateAndLinkLocalAddresses() {
        assertNull(url("http://10.0.0.1/relay/"))
        assertNull(url("http://172.16.0.1/relay/"))
        assertNull(url("http://172.31.255.255/relay/"))
        assertNull(url("http://192.168.1.1/relay/"))
        assertNull(url("http://169.254.1.1/relay/"))
    }

    @Test
    fun allowsPublicIpv4AndPortsAbovePrivateRanges() {
        assertEquals("1.2.3.4", url("http://1.2.3.4/relay/")?.host)
        assertEquals("172.32.0.1", url("http://172.32.0.1/relay/")?.host)
        assertEquals("192.169.0.1", url("http://192.169.0.1/relay/")?.host)
    }

    @Test
    fun acceptsSurroundingWhitespace() {
        val parsed = url("  ws://qwertyuiop.onion/relay/  ")
        assertEquals("http", parsed?.scheme)
        assertEquals("qwertyuiop.onion", parsed?.host)
    }

    @Test
    fun rejectsMalformedUrl() {
        assertNull(url("ws://:bad url with spaces/relay/"))
    }
}
