package com.robosats.models

import android.content.res.Configuration
import android.content.res.Resources
import android.os.Build
import android.os.LocaleList
import android.util.Log
import com.robosats.MainActivity
import java.util.Locale

/**
 * Manages the app's language settings
 * Uses the system's default language if it's one of the supported languages,
 * otherwise defaults to English
 */
object LanguageManager {
    lateinit var resources: Resources
    private val TAG = "LanguageManager"
    private val SETTINGS_KEY = "settings_language"

    // List of supported language codes based on the app's supported languages
    private val SUPPORTED_LANGUAGES = setOf(
        "en",    // English
        "es",    // Spanish
        "de",    // German
        "pl",    // Polish
        "fr",    // French
        "sw",    // Swahili
        "ru",    // Russian
        "ja",    // Japanese
        "it",    // Italian
        "pt",    // Portuguese
        "zh-si", // Simplified Chinese (special handling required)
        "zh-tr", // Traditional Chinese (special handling required)
        "sv",    // Swedish
        "cs",    // Czech
        "th",    // Thai
        "ca",    // Catalan
        "eu"     // Basque
    )

    fun init(context: MainActivity) {
        resources = context.resources
        applySystemLanguage()
    }

    /**
     * Apply the system's default language to the app if it's supported,
     * otherwise use English as the default language
     * This is called only once during app initialization
     */
    fun applySystemLanguage() {
        // Get system locale
        val systemLocale =
            Resources.getSystem().configuration.locales.get(0)

        // Determine the locale to use
        val localeToUse = getValidatedLocale(systemLocale)
        Log.d(TAG, "System locale: ${systemLocale.language}, Using locale: ${localeToUse.language}")

        val lang = systemLocale.language
        if (EncryptedStorage.getEncryptedStorage(SETTINGS_KEY) == "" && SUPPORTED_LANGUAGES.contains(lang)) {
            EncryptedStorage.setEncryptedStorage(SETTINGS_KEY, lang)
        }

        // Create configuration with the validated locale
        val config = Configuration(resources.configuration)

        val localeList = LocaleList(localeToUse)
        LocaleList.setDefault(localeList)
        config.setLocales(localeList)

        // Update the configuration
        @Suppress("DEPRECATION")
        resources.updateConfiguration(config, resources.displayMetrics)
    }

    /**
     * Validates if the system locale is supported by the app
     * If not, returns the English locale as default
     */
    private fun getValidatedLocale(systemLocale: Locale): Locale {
        val languageCode = systemLocale.language

        // Handle Chinese special cases
        if (languageCode == "zh") {
            val country = systemLocale.country
            // Check if it's Simplified (China, Singapore) or Traditional (Taiwan, Hong Kong)
            return when (country) {
                "CN", "SG" -> Locale.SIMPLIFIED_CHINESE
                "TW", "HK" -> Locale.TRADITIONAL_CHINESE
                else -> Locale.ENGLISH // Default to English for other Chinese variants
            }
        }

        // For other languages, check if they're in our supported list
        return if (SUPPORTED_LANGUAGES.contains(languageCode.lowercase())) {
            systemLocale
        } else {
            Locale.ENGLISH // Default to English if language not supported
        }
    }
}
