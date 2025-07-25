package com.robosats.models

import android.util.Log
import com.vitorpamplona.ammolite.relays.COMMON_FEED_TYPES
import com.vitorpamplona.ammolite.relays.Client
import com.vitorpamplona.ammolite.relays.Relay
import com.vitorpamplona.ammolite.relays.RelayPool
import com.vitorpamplona.ammolite.relays.TypedFilter
import com.vitorpamplona.ammolite.relays.filters.SincePerRelayFilter
import com.vitorpamplona.quartz.crypto.KeyPair
import com.vitorpamplona.quartz.encoders.Hex
import org.json.JSONArray
import org.json.JSONObject

object NostrClient {
    private var subscriptionNotificationId = "robosatsNotificationId"
    private var authors = garagePubKeys()

    fun init() {
        RelayPool.register(Client)
    }

    fun stop() {
        RelayPool.unloadRelays()
    }

    fun start() {
        connectRelays()
        subscribeToInbox()
    }

    fun refresh() {
        val pubKeys = garagePubKeys()
        if (authors.toSet() != pubKeys.toSet()) {
            subscribeToInbox()
        }
    }

    fun checkRelaysHealth() {
        if (RelayPool.getAll().isEmpty()) {
            stop()
            start()
        }
        RelayPool.getAll().forEach {
            if (!it.isConnected()) {
                Log.d(
                    "RobosatsNostrClient",
                    "Relay ${it.url} is not connected, reconnecting...",
                )
                it.connectAndSendFiltersIfDisconnected()
            }
        }
    }

    fun garagePubKeys(): List<String> {
        val garageString = EncryptedStorage.getEncryptedStorage("garage_slots")
        var pubKeys = emptyList<String>()

        if (garageString.isNotEmpty()) {
            val garage = JSONObject(garageString)

            val keys = garage.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val slot = garage.getJSONObject(key) // Get the value associated with the key
                val hexPubKey = slot.getString("nostrPubKey")
                if (hexPubKey.isNotEmpty()) {
                    pubKeys = pubKeys.plus(hexPubKey)
                }
            }
        }

        return pubKeys
    }

    fun getRobotKeyPair(hexPubKey: String): KeyPair {
        val garageString = EncryptedStorage.getEncryptedStorage("garage_slots")
        var privKey = ""
        var pubKey = ""

        if (garageString.isNotEmpty()) {
            val garage = JSONObject(garageString)

            val keys = garage.keys()
            while (keys.hasNext() && privKey == "") {
                val key = keys.next()
                val slot = garage.getJSONObject(key)
                val slotPubKey = slot.getString("nostrPubKey")
                if (slotPubKey == hexPubKey) {
                    pubKey = slotPubKey
                    val nostrSecKeyJson = slot.getJSONObject("nostrSecKey")
                    val byteArray = ByteArray(nostrSecKeyJson.length()) { index ->
                        nostrSecKeyJson.getInt(index.toString()).toByte()
                    }
                    privKey = byteArray.joinToString("") { byte -> "%02x".format(byte) }
                }
            }
        }

        return KeyPair(
            Hex.decode(privKey),
            Hex.decode(pubKey),
        )
    }

    private fun connectRelays() {
        val federationRelays = EncryptedStorage.getEncryptedStorage("federation_relays")

        if (federationRelays.isNotEmpty()) {
            val relaysUrls = JSONArray(federationRelays)

            val relayList = (0 until relaysUrls.length()).map { relaysUrls.getString(it) }
            val randomRelays = relayList.shuffled().take(3)

            for (url in randomRelays) {
                Client.sendFilterOnlyIfDisconnected()
                if (RelayPool.getRelays(url).isEmpty()) {
                    RelayPool.addRelay(
                        Relay(
                            url,
                            read = true,
                            write = false,
                            forceProxy = true,
                            activeTypes = COMMON_FEED_TYPES,
                        ),
                    )
                }
            }
        }

    }

    private fun subscribeToInbox() {
        val garageString = EncryptedStorage.getEncryptedStorage("garage_slots")

        if (garageString.isNotEmpty()) {
            authors = garagePubKeys()

            if (authors.isNotEmpty()) {
                Log.d(
                    "RobosatsNostrClient",
                    "Relay subscription authors: ${authors.size}",
                )
                Client.sendFilter(
                    subscriptionNotificationId,
                    listOf(
                        TypedFilter(
                            types = COMMON_FEED_TYPES,
                            filter = SincePerRelayFilter(
                                kinds = listOf(1059),
                                tags = mapOf("p" to authors),
                            ),
                        ),
                    ),
                )
            }
        }
    }
}
