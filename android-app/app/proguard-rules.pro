# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Keep Kotlin serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

-keep,includedescriptorclasses class com.flatmates.app.**$$serializer { *; }
-keepclassmembers class com.flatmates.app.** {
    *** Companion;
}
-keepclasseswithmembers class com.flatmates.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Retrofit
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn retrofit2.KotlinExtensions
-dontwarn retrofit2.KotlinExtensions$*
-if interface * { @retrofit2.http.* <methods>; }
-keep,allowobfuscation interface <1>

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.android.internal.managers.ComponentSupplier { *; }

# Room entities and DAOs
-keep class com.flatmates.app.data.local.entity.** { *; }
-keep class com.flatmates.app.data.local.dao.** { *; }

# Remote DTOs
-keep class com.flatmates.app.data.remote.dto.** { *; }

# Domain models
-keep class com.flatmates.app.domain.model.** { *; }
-keep class com.flatmates.app.domain.model.enums.** { *; }

# Google Sign-In
-keep class com.google.android.gms.** { *; }
-keep class com.google.android.gms.auth.** { *; }

# Keep source file and line number information for better stack traces
-keepattributes SourceFile,LineNumberTable

# Rename source file attribute to hide actual file names
-renamesourcefileattribute SourceFile

# WorkManager
-keep class androidx.work.** { *; }

# Navigation Compose
-keep class * implements androidx.navigation.NavArgs { *; }

# Kotlinx DateTime
-keep class kotlinx.datetime.** { *; }
