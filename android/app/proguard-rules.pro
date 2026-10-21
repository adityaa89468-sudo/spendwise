# Project specific ProGuard / R8 rules for Capacitor and Native Plugins

# Preserve line numbers and source file names for crash symbolication
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor Core & Plugin Reflection
-keep class com.getcapacitor.** { *; }
-keep @interface com.getcapacitor.annotation.CapacitorPlugin
-keep @interface com.getcapacitor.PluginMethod
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
    public <init>(...);
}

# Native Custom Plugins
-keep class com.adityaproductionspendwise.app.PlayBillingPlugin { *; }

# Google Play Services & AdMob
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }

# Google Play Billing Library
-keep class com.android.billingclient.api.** { *; }
