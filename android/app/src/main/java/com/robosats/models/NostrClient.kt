package com.robosats.models

import android.util.Log
import com.vitorpamplona.ammolite.relays.COMMON_FEED_TYPES
import com.vitorpamplona.ammolite.relays.Client
import com.vitorpamplona.ammolite.relays.Relay
import com.vitorpamplona.ammolite.relays.RelayPool
import com.vitorpamplona.ammolite.relays.TypedFilter
import com.vitorpamplona.ammolite.relays.filters.SincePerRelayFilter

object NostrClient {
    private var subscriptionNotificationId = "robosatsNotificationId"

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

    private fun connectRelays() {
        val relays = emptyList<String>()

        relays.forEach {
            Client.sendFilterOnlyIfDisconnected()
            if (RelayPool.getRelays(it).isEmpty()) {
                RelayPool.addRelay(
                    Relay(
                        it,
                        read = true,
                        write = false,
                        forceProxy = false,
                        activeTypes = COMMON_FEED_TYPES,
                    ),
                )
            }
        }
    }

    private fun subscribeToInbox() {
        val authors = emptyList<String>()

        if (authors.isNotEmpty()) {
            Client.sendFilter(
                subscriptionNotificationId,
                listOf(
                    TypedFilter(
                        types = COMMON_FEED_TYPES,
                        filter = SincePerRelayFilter(
                            kinds = listOf(1, 4, 6, 7, 9735),
                            tags = mapOf("p" to authors),
                        ),
                    ),
                ),
            )
        }
    }
}
