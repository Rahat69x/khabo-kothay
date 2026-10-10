import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme, ThemeProvider } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme, Text, Platform, Image } from 'react-native';
import { useFonts } from 'expo-font';

import { lightTheme, darkTheme } from './src/config/theme.js';
import { mobileStorage } from './src/services/storage.js';
import { subscribeLocale, t } from './src/i18n/index.js';
import ErrorBoundary from './src/components/ErrorBoundary.js';

import OnboardingScreen from './src/features/onboarding/OnboardingScreen.js';
import HomeScreen from './src/features/home/HomeScreen.js';
import ResultsScreen from './src/features/results/ResultsScreen.js';
import MapTabScreen from './src/features/results/MapTabScreen.js';
import RestaurantDetailScreen from './src/features/restaurant/RestaurantDetailScreen.js';
import CompareOptionsScreen from './src/features/restaurant/CompareOptionsScreen.js';
import TasteScreen from './src/features/taste/TasteScreen.js';
import FavoritesScreen from './src/features/favorites/FavoritesScreen.js';
import HistoryScreen from './src/features/history/HistoryScreen.js';
import SettingsScreen from './src/features/settings/SettingsScreen.js';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs({ theme, onThemeChange }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { fontWeight: '800', color: theme.colors.text },
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          title: t('tabs.home'),
          headerLeft: () => (
            <Image
              source={require('./assets/icon.png')}
              style={{ width: 28, height: 28, borderRadius: 6, marginLeft: 16 }}
              resizeMode="contain"
            />
          ),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏠</Text>
        }}
      >
        {(props) => <HomeScreen {...props} theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Map"
        options={{
          title: t('tabs.map'),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🗺️</Text>
        }}
      >
        {(props) => <MapTabScreen {...props} theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Favorites"
        options={{
          title: t('tabs.favorites'),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>❤️</Text>
        }}
      >
        {(props) => <FavoritesScreen {...props} theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Taste"
        options={{
          title: t('tabs.taste'),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🎯</Text>
        }}
      >
        {(props) => <TasteScreen {...props} theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚙️</Text>
        }}
      >
        {(props) => <SettingsScreen {...props} theme={theme} onThemeChange={onThemeChange} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // follows system setting by default
  const [localeTick, setLocaleTick] = useState(0);
  const [isOnboarded, setIsOnboarded] = useState(null);

  // Load custom fonts using expo-font
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'NotoSansBengali-Regular': require('./assets/fonts/NotoSansBengali-Regular.ttf'),
    'NotoSansBengali-Bold': require('./assets/fonts/NotoSansBengali-Bold.ttf')
  });

  useEffect(() => {
    initApp();
    const unsubLocale = subscribeLocale(() => {
      setLocaleTick((prev) => prev + 1);
    });
    return unsubLocale;
  }, []);

  const initApp = async () => {
    const onboarded = await mobileStorage.isOnboarded();
    setIsOnboarded(onboarded);
    const prefs = await mobileStorage.getPreferences();
    if (prefs.themeMode) {
      setThemeMode(prefs.themeMode);
    }
  };

  const activeTheme = useMemo(() => {
    if (themeMode === 'light') return lightTheme;
    if (themeMode === 'dark') return darkTheme;
    // Default: system setting
    return systemScheme === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemScheme]);

  // Sync Android system UI navigation & background color to eliminate flashes
  useEffect(() => {
    if (Platform.OS === 'android') {
      import('expo-system-ui')
        .then((SystemUI) => {
          if (SystemUI && SystemUI.setBackgroundColorAsync) {
            SystemUI.setBackgroundColorAsync(activeTheme.colors.background).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [activeTheme.colors.background]);

  const navTheme = useMemo(() => {
    const isDark = Boolean(activeTheme.isDark);
    const baseNavTheme = isDark ? DarkTheme : DefaultTheme;

    // React Navigation 7 standard font stack fallback:
    // Guarantees regular, medium, bold, heavy are defined objects
    const defaultFontFamily = fontsLoaded
      ? 'Inter-Regular'
      : (Platform.OS === 'android' ? 'sans-serif' : 'System');
    const boldFontFamily = fontsLoaded
      ? 'PlusJakartaSans-Bold'
      : (Platform.OS === 'android' ? 'sans-serif' : 'System');
    const mediumFontFamily = fontsLoaded
      ? 'Inter-SemiBold'
      : (Platform.OS === 'android' ? 'sans-serif-medium' : 'System');

    const defaultFonts = {
      regular: { fontFamily: defaultFontFamily, fontWeight: 'normal' },
      medium: { fontFamily: mediumFontFamily, fontWeight: '500' },
      bold: { fontFamily: boldFontFamily, fontWeight: 'bold' },
      heavy: { fontFamily: boldFontFamily, fontWeight: '800' }
    };

    return {
      dark: isDark,
      colors: {
        ...(baseNavTheme?.colors || {}),
        primary: activeTheme.colors.primary,
        background: activeTheme.colors.background,
        card: activeTheme.colors.card,
        text: activeTheme.colors.text,
        border: activeTheme.colors.border,
        notification: activeTheme.colors.accent || activeTheme.colors.primary
      },
      fonts: {
        ...defaultFonts,
        ...(baseNavTheme?.fonts || {}),
        ...(activeTheme?.fonts || {}),
        regular: (activeTheme?.fonts?.regular) || defaultFonts.regular,
        medium: (activeTheme?.fonts?.medium) || defaultFonts.medium,
        bold: (activeTheme?.fonts?.bold) || defaultFonts.bold,
        heavy: (activeTheme?.fonts?.heavy) || defaultFonts.heavy
      }
    };
  }, [activeTheme, fontsLoaded]);

  const handleThemeChange = async (mode) => {
    setThemeMode(mode);
    await mobileStorage.savePreferences({ themeMode: mode });
  };

  // Keep splash active until storage preferences resolve and fonts load (or error)
  if (isOnboarded === null || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <ErrorBoundary theme={activeTheme}>
      <StatusBar
        style={activeTheme.isDark ? 'light' : 'dark'}
        backgroundColor={activeTheme.colors.card}
      />
      <ThemeProvider value={navTheme}>
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            initialRouteName={isOnboarded ? 'MainTabs' : 'Onboarding'}
            screenOptions={{
              headerStyle: { backgroundColor: activeTheme.colors.card },
              headerTintColor: activeTheme.colors.primary,
              headerTitleStyle: { fontWeight: '800', color: activeTheme.colors.text }
            }}
          >
            <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
              {(props) => <OnboardingScreen {...props} theme={activeTheme} />}
            </Stack.Screen>

            <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
              {(props) => <BottomTabs {...props} theme={activeTheme} onThemeChange={handleThemeChange} />}
            </Stack.Screen>

            <Stack.Screen
              name="Results"
              options={{ title: 'Ranked Restaurants' }}
            >
              {(props) => <ResultsScreen {...props} theme={activeTheme} />}
            </Stack.Screen>

            <Stack.Screen
              name="RestaurantDetail"
              options={{ title: 'Restaurant Details' }}
            >
              {(props) => <RestaurantDetailScreen {...props} theme={activeTheme} />}
            </Stack.Screen>

            <Stack.Screen
              name="CompareOptions"
              options={{ title: 'Compare Routes & Transport' }}
            >
              {(props) => <CompareOptionsScreen {...props} theme={activeTheme} />}
            </Stack.Screen>

            <Stack.Screen
              name="History"
              options={{ title: 'Search History' }}
            >
              {(props) => <HistoryScreen {...props} theme={activeTheme} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
