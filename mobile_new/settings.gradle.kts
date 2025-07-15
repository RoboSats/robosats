pluginManagement {
    repositories {
        google ()
        mavenCentral()
        gradlePluginPortal()
        jcenter()
        maven("https://mvnrepository.com")
    }
}
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        jcenter()
        maven("https://mvnrepository.com")
    }
}

rootProject.name = "Robosats"
include(":app")
