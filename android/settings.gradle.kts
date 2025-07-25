pluginManagement {
    repositories {
        google ()
        mavenCentral()
        gradlePluginPortal()
        maven("https://mvnrepository.com")
        maven("https://jitpack.io")
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven("https://mvnrepository.com")
        maven("https://jitpack.io")
    }
}

rootProject.name = "Robosats"
include(":app")
