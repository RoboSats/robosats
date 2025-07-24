import com.android.build.api.dsl.Packaging

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.robosats"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.robosats"
        minSdk = 26
        targetSdk = 36
        versionCode = 15
        versionName = "0.8.1-alpha"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }

    splits {

        // Configures multiple APKs based on ABI. This helps keep the size
        // down, since PT binaries can be large.
        abi {

            // Enables building multiple APKs per ABI.
            isEnable = true

            // By default, all ABIs are included, so use reset() and include to specify
            // that we only want APKs for x86 and x86_64, armeabi-v7a, and arm64-v8a.

            // Resets the list of ABIs that Gradle should create APKs for to none.
            reset()

            // Specifies a list of ABIs that Gradle should create APKs for.
            include("x86", "armeabi-v7a", "arm64-v8a", "x86_64")

            // Specify whether you wish to also generate a universal APK that
            // includes _all_ ABIs.
            isUniversalApk = true
        }
    }

    packaging {
        jniLibs.useLegacyPackaging = true
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.okhttp)
    implementation(libs.kmp.tor)
    implementation(libs.quartz)
    implementation(libs.ammolite)
    // Add the KMP Tor binary dependency (contains the native .so files)
    implementation(libs.kmp.tor.binary)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
