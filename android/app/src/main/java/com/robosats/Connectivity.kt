package com.robosats

import android.net.NetworkCapabilities
import com.vitorpamplona.ammolite.service.HttpClientManager

class Connectivity {
    companion object {
        var isOnMobileData: Boolean = false
        var isOnWifiData: Boolean = false

        fun updateNetworkCapabilities(networkCapabilities: NetworkCapabilities): Boolean {
            val isOnMobileDataNet = networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
            val isOnWifiNet = networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)

            var changedNetwork = false

            if (isOnMobileData != isOnMobileDataNet) {
                isOnMobileData = isOnMobileDataNet
                changedNetwork = true
            }

            if (isOnWifiData != isOnWifiNet) {
                isOnWifiData = isOnWifiNet
                changedNetwork = true
            }

            if (changedNetwork) {
                if (isOnMobileDataNet) {
                    HttpClientManager.setDefaultTimeout(HttpClientManager.DEFAULT_TIMEOUT_ON_MOBILE)
                } else {
                    HttpClientManager.setDefaultTimeout(HttpClientManager.DEFAULT_TIMEOUT_ON_WIFI)
                }
            }

            return changedNetwork
        }
    }
}
