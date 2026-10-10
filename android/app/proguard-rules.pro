# Khabo Kothay? R8 Keep Rules
-keep class com.khabokothay.app.data.models.** { *; }
-keep class com.khabokothay.app.data.local.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
