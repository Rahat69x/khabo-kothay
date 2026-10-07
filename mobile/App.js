import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme, Text } from 'react-native';

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
        headerTintColor: theme.colors.text,
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
  const [themeMode, setThemeMode] = useState('dark'); // dark by default
  const [localeTick, setLocaleTick] = useState(0);
  const [isOnboarded, setIsOnboarded] = useState(null);

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

  const activeTheme = themeMode === 'light' ? lightTheme : darkTheme;

  const handleThemeChange = async (mode) => {
    setThemeMode(mode);
    await mobileStorage.savePreferences({ themeMode: mode });
  };

  if (isOnboarded === null) {
    return null; // Brief splash load
  }

  return (
    <ErrorBoundary>
      <StatusBar style={activeTheme.isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isOnboarded ? 'MainTabs' : 'Onboarding'}
          screenOptions={{
            headerStyle: { backgroundColor: activeTheme.colors.card },
            headerTintColor: activeTheme.colors.text,
            headerTitleStyle: { fontWeight: '800' }
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
    </ErrorBoundary>
  );
}
