package com.robosats.services
import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.IBinder
import android.util.Log
import androidx.annotation.RequiresPermission
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationChannelGroupCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.robosats.Connectivity
import com.robosats.R
import com.robosats.models.NostrClient
import com.vitorpamplona.ammolite.relays.Client
import com.vitorpamplona.ammolite.relays.Relay
import com.vitorpamplona.quartz.events.Event
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Timer
import java.util.TimerTask
import java.util.concurrent.ConcurrentHashMap

class NotificationsService : Service() {
    private var channelRelaysId = "RelaysConnections"
    private var channelNotificationsId = "Notifications"

    private lateinit var notificationGroup: NotificationChannelGroupCompat

    private val timer = Timer()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val processedEvents = ConcurrentHashMap<String, Boolean>()

    private val clientNotificationListener =
        object : Client.Listener {
            override fun onEvent(
                event: Event,
                subscriptionId: String,
                relay: Relay,
                afterEOSE: Boolean,
            ) {
                if (processedEvents.putIfAbsent(event.id, true) == null) {
                    Log.d("RobosatsNotifications", "Relay Event: ${relay.url} - $subscriptionId - ${event.toJson()}")
                    val notify = true

                    if (notify) {
                        Log.d("RobosatsNotifications", "Relay Event: ${relay.url} - $subscriptionId - Broadcast")
                    }
                }
            }
        }

    private val networkCallback =
        object : ConnectivityManager.NetworkCallback() {
            var lastNetwork: Network? = null

            override fun onAvailable(network: Network) {
                super.onAvailable(network)

                if (lastNetwork != null && lastNetwork != network) {
                    scope.launch(Dispatchers.IO) {
                        stopSubscription()
                        delay(1000)
                        startSubscription()
                    }
                }

                lastNetwork = network
            }

            // Network capabilities have changed for the network
            override fun onCapabilitiesChanged(
                network: Network,
                networkCapabilities: NetworkCapabilities,
            ) {
                super.onCapabilitiesChanged(network, networkCapabilities)

                scope.launch(Dispatchers.IO) {
                    Log.d(
                        "RobosatsNotifications",
                        "onCapabilitiesChanged: ${network.networkHandle} hasMobileData ${Connectivity.isOnMobileData} hasWifi ${Connectivity.isOnWifiData}",
                    )
                    if (Connectivity.updateNetworkCapabilities(networkCapabilities)) {
                        stopSubscription()
                        delay(1000)
                        startSubscription()
                    }
                }
            }
        }

    override fun onBind(intent: Intent): IBinder {
        return null!!
    }

    override fun onCreate() {
        val connectivityManager =
            (getSystemService(ConnectivityManager::class.java) as ConnectivityManager)
        connectivityManager.registerDefaultNetworkCallback(networkCallback)
        NostrClient.init()
        super.onCreate()
    }

    @RequiresPermission(Manifest.permission.POST_NOTIFICATIONS)
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startService()

        return START_STICKY
    }

    override fun onDestroy() {
        timer.cancel()
        stopSubscription()

        try {
            val connectivityManager =
                (getSystemService(ConnectivityManager::class.java) as ConnectivityManager)
            connectivityManager.unregisterNetworkCallback(networkCallback)
        } catch (e: Exception) {
            Log.d("RobosatsNotifications", "Failed to unregisterNetworkCallback", e)
        }

        super.onDestroy()
    }

    @RequiresPermission(Manifest.permission.POST_NOTIFICATIONS)
    private fun startService() {
        try {
            Log.d("RobosatsNotifications", "Starting foreground service...")
            startForeground(1, createNotification())
            keepAlive()

            startSubscription()

            val connectivityManager =
                (getSystemService(ConnectivityManager::class.java) as ConnectivityManager)
            connectivityManager.registerDefaultNetworkCallback(networkCallback)
        } catch (e: Exception) {
            Log.e("NotificationsService", "Error in service", e)
        }
    }

    private fun startSubscription() {
        if (!Client.isSubscribed(clientNotificationListener)) Client.subscribe(clientNotificationListener)

        CoroutineScope(Dispatchers.IO).launch {
            NostrClient.start()
        }
    }

    private fun stopSubscription() {
        Client.unsubscribe(clientNotificationListener)
        NostrClient.stop()
    }

    private fun keepAlive() {
        timer.schedule(
            object : TimerTask() {
                override fun run() {
                    NostrClient.checkRelaysHealth()
                }
            },
            5000,
            61000,
        )
    }

    @RequiresPermission(Manifest.permission.POST_NOTIFICATIONS)
    private fun createNotification(): Notification {
        val notificationManager = NotificationManagerCompat.from(this)

        Log.d("RobosatsNotifications", "Building groups...")
        notificationGroup = NotificationChannelGroupCompat.Builder("ServiceGroup")
            .setName(getString(R.string.notifications))
            .setDescription(getString(R.string.robosats_is_running_in_background))
            .build()

        notificationManager.createNotificationChannelGroup(notificationGroup)

        Log.d("RobosatsNotifications", "Building channels...")
        val channelRelays = NotificationChannelCompat.Builder(channelRelaysId, NotificationManager.IMPORTANCE_DEFAULT)
            .setName(getString(R.string.service))
            .setGroup(notificationGroup.id)
            .build()

        val channelNotification = NotificationChannelCompat.Builder(channelNotificationsId, NotificationManager.IMPORTANCE_HIGH)
            .setName(getString(R.string.notifications))
            .setGroup(notificationGroup.id)
            .build()

        notificationManager.createNotificationChannel(channelRelays)
        notificationManager.createNotificationChannel(channelNotification)

        Log.d("RobosatsNotifications", "Building notification...")
        val notificationBuilder =
            NotificationCompat.Builder(this, channelRelaysId)
                .setContentTitle(getString(R.string.robosats_is_running_in_background))
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setGroup(notificationGroup.id)
                .setSmallIcon(R.drawable.ic_notification)

        val build = notificationBuilder.build()
        notificationManager.notify(1, build)
        return build
    }
}
