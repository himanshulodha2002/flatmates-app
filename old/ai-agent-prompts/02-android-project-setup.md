# Task 2: Android Project Setup

## Metadata
- **Can run in parallel with**: Task 1 (Backend Reliability Fix)
- **Dependencies**: None
- **Estimated time**: 1-2 hours
- **Priority**: HIGH (foundation for all other Android tasks)

---

## Prompt

You are creating a new native Android project using Kotlin and Jetpack Compose for the Flatmates household management app.

### Repository Information
- **Repository**: `/workspaces/flatmates-app`
- **Create new folder**: `/workspaces/flatmates-app/android-app`
- **Do NOT modify**: `/workspaces/flatmates-app/mobile` (existing React Native app)

### Project Specifications

| Setting | Value |
|---------|-------|
| Package name | `com.flatmates.app` |
| Application ID | `com.flatmates.app` |
| Min SDK | 26 (Android 8.0) |
| Target SDK | 34 (Android 14) |
| Compile SDK | 34 |
| Kotlin version | 1.9.22 |
| Compose BOM | 2024.02.00 |
| Gradle | 8.2 |
| AGP | 8.2.2 |

### Tasks

#### 1. Create Project Structure

```
android-app/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── kotlin/
│       │   │   └── com/flatmates/app/
│       │   │       ├── FlatmatesApplication.kt
│       │   │       └── MainActivity.kt
│       │   └── res/
│       │       ├── drawable/
│       │       │   └── ic_launcher_foreground.xml
│       │       ├── mipmap-anydpi-v26/
│       │       │   ├── ic_launcher.xml
│       │       │   └── ic_launcher_round.xml
│       │       ├── mipmap-hdpi/
│       │       ├── mipmap-mdpi/
│       │       ├── mipmap-xhdpi/
│       │       ├── mipmap-xxhdpi/
│       │       ├── mipmap-xxxhdpi/
│       │       ├── values/
│       │       │   ├── colors.xml
│       │       │   ├── strings.xml
│       │       │   └── themes.xml
│       │       └── xml/
│       │           ├── backup_rules.xml
│       │           └── data_extraction_rules.xml
│       ├── test/
│       │   └── kotlin/com/flatmates/app/
│       │       └── ExampleUnitTest.kt
│       └── androidTest/
│           └── kotlin/com/flatmates/app/
│               └── ExampleInstrumentedTest.kt
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── local.properties.example
├── .gitignore
└── gradle/
    ├── libs.versions.toml
    └── wrapper/
        ├── gradle-wrapper.jar
        └── gradle-wrapper.properties
```

#### 2. Create Version Catalog

`gradle/libs.versions.toml`:

```toml
[versions]
agp = "8.2.2"
kotlin = "1.9.22"
ksp = "1.9.22-1.0.17"
compose-bom = "2024.02.00"
compose-compiler = "1.5.8"

# AndroidX
core-ktx = "1.12.0"
lifecycle = "2.7.0"
activity-compose = "1.8.2"
navigation-compose = "2.7.7"

# Room
room = "2.6.1"

# DataStore
datastore = "1.0.0"

# Hilt
hilt = "2.50"
hilt-navigation-compose = "1.1.0"

# Networking
retrofit = "2.9.0"
okhttp = "4.12.0"
kotlinx-serialization = "1.6.2"

# WorkManager
work = "2.9.0"

# Google
play-services-auth = "20.7.0"

# Image Loading
coil = "2.5.0"

# DateTime
kotlinx-datetime = "0.5.0"

# Testing
junit = "4.13.2"
junit-ext = "1.1.5"
espresso = "3.5.1"
coroutines-test = "1.7.3"
turbine = "1.0.0"
mockk = "1.13.9"

[libraries]
# Core
core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "core-ktx" }

# Compose
compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
compose-ui = { group = "androidx.compose.ui", name = "ui" }
compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
compose-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
compose-material3 = { group = "androidx.compose.material3", name = "material3" }
compose-material-icons = { group = "androidx.compose.material", name = "material-icons-extended" }

# Lifecycle
lifecycle-runtime = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycle" }
lifecycle-runtime-compose = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version.ref = "lifecycle" }
lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycle" }

# Activity
activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activity-compose" }

# Navigation
navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigation-compose" }

# Room
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# DataStore
datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore" }

# Hilt
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-android-compiler = { group = "com.google.dagger", name = "hilt-android-compiler", version.ref = "hilt" }
hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version.ref = "hilt-navigation-compose" }
hilt-work = { group = "androidx.hilt", name = "hilt-work", version.ref = "hilt-navigation-compose" }
hilt-compiler = { group = "androidx.hilt", name = "hilt-compiler", version.ref = "hilt-navigation-compose" }

# Networking
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-kotlinx-serialization = { group = "com.squareup.retrofit2", name = "converter-kotlinx-serialization", version.ref = "retrofit" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }
kotlinx-serialization-json = { group = "org.jetbrains.kotlinx", name = "kotlinx-serialization-json", version.ref = "kotlinx-serialization" }

# WorkManager
work-runtime = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "work" }

# Google
play-services-auth = { group = "com.google.android.gms", name = "play-services-auth", version.ref = "play-services-auth" }

# Image Loading
coil-compose = { group = "io.coil-kt", name = "coil-compose", version.ref = "coil" }

# DateTime
kotlinx-datetime = { group = "org.jetbrains.kotlinx", name = "kotlinx-datetime", version.ref = "kotlinx-datetime" }

# Testing
junit = { group = "junit", name = "junit", version.ref = "junit" }
junit-ext = { group = "androidx.test.ext", name = "junit", version.ref = "junit-ext" }
espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espresso" }
coroutines-test = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-test", version.ref = "coroutines-test" }
turbine = { group = "app.cash.turbine", name = "turbine", version.ref = "turbine" }
mockk = { group = "io.mockk", name = "mockk", version.ref = "mockk" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
android-library = { id = "com.android.library", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
```

#### 3. Create Project-Level build.gradle.kts

```kotlin
// Top-level build file
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}
```

#### 4. Create App-Level build.gradle.kts

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

android {
    namespace = "com.flatmates.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.flatmates.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        vectorDrawables {
            useSupportLibrary = true
        }

        // Build config for API URL
        buildConfigField("String", "API_BASE_URL", "\"https://your-api.azurecontainerapps.io/api/v1/\"")
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:8000/api/v1/\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core
    implementation(libs.core.ktx)
    
    // Compose
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    
    // Lifecycle
    implementation(libs.lifecycle.runtime)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    
    // Activity
    implementation(libs.activity.compose)
    
    // Navigation
    implementation(libs.navigation.compose)
    
    // Room
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
    
    // DataStore
    implementation(libs.datastore.preferences)
    
    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.android.compiler)
    implementation(libs.hilt.navigation.compose)
    implementation(libs.hilt.work)
    ksp(libs.hilt.compiler)
    
    // Networking
    implementation(libs.retrofit)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)
    
    // WorkManager
    implementation(libs.work.runtime)
    
    // Google Sign-In
    implementation(libs.play.services.auth)
    
    // Image Loading
    implementation(libs.coil.compose)
    
    // DateTime
    implementation(libs.kotlinx.datetime)
    
    // Testing
    testImplementation(libs.junit)
    testImplementation(libs.coroutines.test)
    testImplementation(libs.turbine)
    testImplementation(libs.mockk)
    
    androidTestImplementation(libs.junit.ext)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.compose.ui.test.junit4)
    
    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)
}
```

#### 5. Create settings.gradle.kts

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Flatmates"
include(":app")
```

#### 6. Create gradle.properties

```properties
# Project-wide Gradle settings
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true

# AndroidX
android.useAndroidX=true

# Kotlin
kotlin.code.style=official

# Non-transitive R classes
android.nonTransitiveRClass=true

# Enable build config
android.defaults.buildfeatures.buildconfig=true
```

#### 7. Create AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:name=".FlatmatesApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Flatmates"
        tools:targetApi="34">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.Flatmates">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>

</manifest>
```

#### 8. Create FlatmatesApplication.kt

```kotlin
package com.flatmates.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class FlatmatesApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        // Initialize any app-wide dependencies here
    }
}
```

#### 9. Create MainActivity.kt

```kotlin
package com.flatmates.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        setContent {
            // Temporary placeholder - will be replaced with theme
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    PlaceholderScreen()
                }
            }
        }
    }
}

@Composable
fun PlaceholderScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "Flatmates App",
            style = MaterialTheme.typography.headlineLarge
        )
    }
}

@Preview(showBackground = true)
@Composable
fun PlaceholderScreenPreview() {
    MaterialTheme {
        PlaceholderScreen()
    }
}
```

#### 10. Create Resource Files

`res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">Flatmates</string>
</resources>
```

`res/values/colors.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#4772FA</color>
    <color name="white">#FFFFFF</color>
    <color name="black">#000000</color>
</resources>
```

`res/values/themes.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.Flatmates" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">@color/primary</item>
    </style>
</resources>
```

#### 11. Create .gitignore

```gitignore
# Built application files
*.apk
*.aar
*.ap_
*.aab

# Files for the ART/Dalvik VM
*.dex

# Java class files
*.class

# Generated files
bin/
gen/
out/
build/

# Gradle files
.gradle/
build/

# Local configuration file
local.properties

# Android Studio
*.iml
.idea/
.DS_Store

# NDK
obj/

# Logs
*.log

# Keystore files
*.jks
*.keystore

# Google Services
google-services.json

# Test output
test-results/
```

### Success Criteria

- [ ] Project builds successfully with `./gradlew build`
- [ ] App launches on emulator showing "Flatmates App" text
- [ ] All dependencies resolve correctly (no version conflicts)
- [ ] Hilt is properly configured (@HiltAndroidApp compiles)
- [ ] KSP processes Room and Hilt annotations
- [ ] Compose preview works in Android Studio

### Do NOT

- Add any UI screens yet (just placeholder)
- Add any business logic
- Connect to backend API
- Implement navigation
- Add database entities

### Verification

```bash
cd /workspaces/flatmates-app/android-app

# Build the project
./gradlew build

# Run unit tests
./gradlew test

# Check for lint issues
./gradlew lint

# Assemble debug APK
./gradlew assembleDebug
```

The APK will be at: `app/build/outputs/apk/debug/app-debug.apk`
