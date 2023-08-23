# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

-keep class org.torproject.jni.** { *; }

# -------------------------------------------------------------------------------#
#                                                                                #
#     NOTE: Everything below this line is experimental. The Tor changes broke    #
#           proguard and these are (failed) attempts to fix it.                  #
#                                                                                #
# -------------------------------------------------------------------------------#

-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

-keepclasseswithmembers class * {
    native <methods>;
}

-keep class com.facebook.** { *; }
-keep class com.reactnative.** { *; }

-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-keep class androidx.core.app.** { *; }

-keep class com.facebook.crypto.** {
   *;
}

-keep class android.util.** { *; }

-keep class org.json.** { *; }

-keep class android.app.** { *; }
-keep class android.content.** { *; }
-keep class android.database.** { *; }
-keep class android.os.** { *; }
-keep class android.util.Log { *; }
-keep class android.widget.Toast { *; }

-keep class com.facebook.react.turbomodule.** { *; }

-keep class com.robosats.* { *; }
