package com.robosats.models

import android.content.res.Configuration
import android.content.res.Resources
import android.os.Build
import android.os.LocaleList
import com.robosats.MainActivity
import java.util.Locale

object LanguageManager {
    lateinit var resources: Resources

    val LANGUAGE_KEY = "settings_language"

    fun init(context: MainActivity) {
        val value = EncryptedStorage.getEncryptedStorage(LANGUAGE_KEY)
        applyLanguage(value)

        resources = context.resources
    }

    /**
     * Apply the selected language to the app
     * @param languageCode The language code to apply, or "system" for system default
     * @return true if language was changed, false otherwise
     */
    fun applyLanguage(languageCode: String): Boolean {
        val locale = when {
            languageCode == "system" -> {
                // Use system default
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    Resources.getSystem().configuration.locales.get(0)
                } else {
                    @Suppress("DEPRECATION")
                    Resources.getSystem().configuration.locale
                }
            }
            languageCode == "zh-si" -> Locale.SIMPLIFIED_CHINESE
            languageCode == "zh-tr" -> Locale.TRADITIONAL_CHINESE
            else -> Locale(languageCode)
        }

        // Create configuration with the selected locale
        val config = Configuration(resources.configuration)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val localeList = LocaleList(locale)
            LocaleList.setDefault(localeList)
            config.setLocales(localeList)
        } else {
            config.locale = locale
            @Suppress("DEPRECATION")
            Locale.setDefault(locale)
        }

        // Update the configuration
        @Suppress("DEPRECATION")
        resources.updateConfiguration(config, resources.displayMetrics)

        EncryptedStorage.setEncryptedStorage(LANGUAGE_KEY, languageCode)

        return true
    }
}
