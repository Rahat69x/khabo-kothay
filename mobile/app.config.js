module.exports = {
  expo: {
    name: "Khabo Kothay?",
    slug: "khabo-kothay",
    scheme: "khabokothay",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#3B3FA8",
      dark: {
        image: "./assets/splash-dark.png",
        resizeMode: "contain",
        backgroundColor: "#11122B"
      }
    },
    assetBundlePatterns: ["**/*"],
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/00000000-0000-0000-0000-000000000000",
      fallbackToCacheTimeout: 0
    },
    locales: {
      bn: "./src/i18n/app-name-bn.json"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.khabokothay.app"
    },
    android: {
      package: "com.khabokothay.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundImage: "./assets/adaptive-icon-background.png",
        backgroundColor: "#3B3FA8",
        monochromeImage: "./assets/adaptive-icon-monochrome.png"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "POST_NOTIFICATIONS"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || ""
        }
      }
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Khabo Kothay? to access your location to calculate real-time traffic travel times to restaurants."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#3B3FA8"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "00000000-0000-0000-0000-000000000000"
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "https://khabo-kothay.onrender.com",
      appClientToken: process.env.EXPO_PUBLIC_APP_CLIENT_TOKEN || "gulshan_app_secret_token_2026"
    }
  }
};
