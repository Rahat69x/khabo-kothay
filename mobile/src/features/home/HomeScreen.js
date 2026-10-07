import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { apiClient } from '../../api/client.js';
import { mobileStorage } from '../../services/storage.js';
import { getCurrentOrFallbackLocation, PRESET_LOCATIONS } from '../../services/location.js';
import { t } from '../../i18n/index.js';

const MOODS = [
  'Something spicy', 'Something light', 'Comfort food', 'Fast food',
  'Healthy food', 'Something new', 'Sweet', 'Coffee', 'Fine dining', 'Budget friendly'
];

const CUISINES = [
  'All', 'Japanese', 'Bangladeshi', 'Indian', 'Chinese', 'Korean',
  'Fast Food', 'Cafe', 'Kabab', 'Biriyani', 'Dessert', 'Coffee', 'Burger'
];

const PRIORITIES = [
  'Best Overall', 'Fastest', 'Closest', 'Cheapest', 'Best Rated', 'Best Value', 'Personalized'
];

export default function HomeScreen({ navigation, theme }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(PRESET_LOCATIONS['Notun Bazar']);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('Best Overall');
  const [selectedBudget, setSelectedBudget] = useState(2);
  const [topPicks, setTopPicks] = useState(null);
  const [results, setResults] = useState([]);
  const [weather, setWeather] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCachedData, setIsCachedData] = useState(false);
  const [serverWakingMsg, setServerWakingMsg] = useState(null);

  useEffect(() => {
    initHome();
  }, []);

  const initHome = async () => {
    const loc = await getCurrentOrFallbackLocation();
    setLocation(loc);
    const prefs = await mobileStorage.getPreferences();
    if (prefs.cuisine) setSelectedCuisine(prefs.cuisine);
    if (prefs.priority) setSelectedPriority(prefs.priority);
    if (prefs.budget) setSelectedBudget(prefs.budget);

    // Warm-up ping to wake sleeping Render instance if needed
    apiClient.pingWarmUp((statusObj) => {
      if (statusObj.status === 'waking') {
        setServerWakingMsg(statusObj.message);
      } else {
        setServerWakingMsg(null);
      }
    });

    // Weather
    try {
      const w = await apiClient.getWeather(loc.lat, loc.lng);
      setWeather(w);
    } catch (e) {}

    loadRecommendations(loc, prefs.cuisine || 'All', prefs.priority || 'Best Overall', prefs.budget || 2);
  };

  const loadRecommendations = async (loc = location, cuisine = selectedCuisine, priority = selectedPriority, budget = selectedBudget, mood = selectedMood, surpriseMe = false) => {
    setLoading(true);
    setIsCachedData(false);

    let attempt = 0;
    const maxRetries = 6;
    let delayMs = 2000;

    while (attempt <= maxRetries) {
      try {
        const tasteProfile = await mobileStorage.getTasteProfile();
        const data = await apiClient.getRecommendations({
          lat: loc.lat,
          lng: loc.lng,
          cuisine,
          priority,
          budget,
          mood,
          tasteProfile,
          weatherContext: weather,
          surpriseMe
        });

        setServerWakingMsg(null);
        setResults(data.results || []);
        setTopPicks(data.topPicks || null);
        setLastUpdated(Date.now());

        // Cache for offline/poor network (30 min cache)
        await mobileStorage.setCachedResults(data);

        // Save search history
        await mobileStorage.addSearchHistory({
          locationName: loc.name,
          cuisine,
          priority,
          budget
        });
        break;
      } catch (err) {
        attempt++;
        const isNetworkOrSleepError = err.message?.includes('Network') ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('502') ||
          err.message?.includes('503') ||
          err.message?.includes('504') ||
          err.message?.includes('timeout');

        if (attempt <= maxRetries && isNetworkOrSleepError) {
          setServerWakingMsg(`Waking up the server... Please hold on (${attempt * 5}s)`);
          await new Promise(r => setTimeout(r, delayMs));
          delayMs = Math.min(delayMs * 1.5, 8000);
          continue;
        }

        console.warn('Network recommendation request failed. Checking offline cache...', err);
        setServerWakingMsg(null);
        const cached = await mobileStorage.getCachedResults();
        if (cached && (Date.now() - cached.cachedAt < 30 * 60 * 1000)) {
          setResults(cached.results || []);
          setTopPicks(cached.topPicks || null);
          setLastUpdated(cached.cachedAt);
          setIsCachedData(true);
        } else {
          Alert.alert(t('common.error'), err.message || 'Unable to connect to server');
        }
        break;
      }
    }

    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRecommendations();
  }, [location, selectedCuisine, selectedPriority, selectedBudget, selectedMood]);

  const handleEatNow = () => {
    if (results.length > 0) {
      const best = results[0];
      Alert.alert(
        `⚡ Eat Now: ${best.displayName}`,
        `${best.reason}\n\nTravel time: ${Math.round(best.durationSeconds / 60)} min (${(best.distanceMeters / 1000).toFixed(1)} km) • ~৳${best.transport.cheapestEstimatedCostBdt}`,
        [
          { text: 'View Details', onPress: () => navigation.navigate('RestaurantDetail', { restaurant: best }) },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } else {
      loadRecommendations();
    }
  };

  const getUpdatedMinutesAgo = () => {
    if (!lastUpdated) return 0;
    return Math.max(0, Math.round((Date.now() - lastUpdated) / 60000));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Weather Banner */}
      {weather?.isRaining && (
        <View style={styles.rainBanner}>
          <Text style={styles.rainText}>{t('home.rainBanner')}</Text>
        </View>
      )}

      {/* Offline Cache Banner */}
      {isCachedData && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {t('home.offlineBanner', { mins: getUpdatedMinutesAgo() })}
          </Text>
        </View>
      )}

      {/* Server Cold-Start Warm-up Banner */}
      {serverWakingMsg && (
        <View style={styles.wakeUpBanner}>
          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.wakeUpText}>{serverWakingMsg}</Text>
        </View>
      )}

      {/* Location Selector Bar */}
      <View style={[styles.locationCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.locationInfo}>
          <Text style={[styles.locPrompt, { color: theme.colors.textMuted }]}>{t('home.locationPrompt')}</Text>
          <Text style={[styles.locName, { color: theme.colors.text }]}>📍 {location.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.gpsBtn, { backgroundColor: theme.colors.surface }]}
          onPress={async () => {
            const loc = await getCurrentOrFallbackLocation();
            setLocation(loc);
            loadRecommendations(loc);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('home.useGps')}
        >
          <Text style={[styles.gpsBtnText, { color: theme.colors.primary }]}>📡 GPS</Text>
        </TouchableOpacity>
      </View>

      {/* Big "Eat Now" Button */}
      <TouchableOpacity
        style={[styles.eatNowBtn, { backgroundColor: theme.colors.primary }]}
        onPress={handleEatNow}
        accessibilityRole="button"
        accessibilityLabel={t('home.eatNow')}
      >
        <Text style={styles.eatNowText}>{t('home.eatNow')}</Text>
      </TouchableOpacity>

      {/* "For You Right Now" Top Picks Section */}
      {topPicks && (
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>✨ {t('home.forYouRightNow')}</Text>
            {lastUpdated && (
              <Text style={[styles.updatedText, { color: theme.colors.textSubtle }]}>
                {t('home.updatedAgo', { mins: getUpdatedMinutesAgo() })}
              </Text>
            )}
          </View>
          <Text style={[styles.whySummary, { color: theme.colors.secondary }]}>{topPicks.summary}</Text>

          {topPicks.bestMatch && (
            <TouchableOpacity
              style={styles.pickItem}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurant: topPicks.bestMatch })}
            >
              <View style={[styles.badgePill, { backgroundColor: theme.colors.primaryGlow }]}>
                <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 12 }}>
                  🌟 {t('picks.bestMatch')}
                </Text>
              </View>
              <Text style={[styles.pickName, { color: theme.colors.text }]}>{topPicks.bestMatch.displayName}</Text>
              <Text style={[styles.pickReason, { color: theme.colors.textMuted }]}>{topPicks.bestMatch.reason}</Text>
            </TouchableOpacity>
          )}

          {topPicks.fastestOrNearest && (
            <TouchableOpacity
              style={styles.pickItem}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurant: topPicks.fastestOrNearest })}
            >
              <View style={[styles.badgePill, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 12 }}>
                  ⚡ {t('picks.fastestOption')}
                </Text>
              </View>
              <Text style={[styles.pickName, { color: theme.colors.text }]}>{topPicks.fastestOrNearest.displayName}</Text>
              <Text style={[styles.pickReason, { color: theme.colors.textMuted }]}>{topPicks.fastestOrNearest.reason}</Text>
            </TouchableOpacity>
          )}

          {topPicks.trySomethingNew && (
            <TouchableOpacity
              style={styles.pickItem}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurant: topPicks.trySomethingNew })}
            >
              <View style={[styles.badgePill, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                <Text style={{ color: '#EC4899', fontWeight: '800', fontSize: 12 }}>
                  🎲 {t('picks.trySomethingNew')}
                </Text>
              </View>
              <Text style={[styles.pickName, { color: theme.colors.text }]}>{topPicks.trySomethingNew.displayName}</Text>
              <Text style={[styles.pickReason, { color: theme.colors.textMuted }]}>{topPicks.trySomethingNew.reason}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Mood Selector Chips */}
      <View style={styles.chipSection}>
        <Text style={[styles.filterTitle, { color: theme.colors.textMuted }]}>{t('home.moodPrompt')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
          {MOODS.map(m => {
            const active = selectedMood === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.chip,
                  active && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
                ]}
                onPress={() => {
                  const nextMood = active ? null : m;
                  setSelectedMood(nextMood);
                  loadRecommendations(location, selectedCuisine, selectedPriority, selectedBudget, nextMood);
                }}
              >
                <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Cuisine Selector Chips */}
      <View style={styles.chipSection}>
        <Text style={[styles.filterTitle, { color: theme.colors.textMuted }]}>{t('home.cuisinePrompt')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
          {CUISINES.map(c => {
            const active = selectedCuisine === c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  active && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => {
                  setSelectedCuisine(c);
                  setSelectedMood(null);
                  loadRecommendations(location, c, selectedPriority, selectedBudget, null);
                }}
              >
                <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Priority Selector Chips */}
      <View style={styles.chipSection}>
        <Text style={[styles.filterTitle, { color: theme.colors.textMuted }]}>{t('home.priorityPrompt')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
          {PRIORITIES.map(p => {
            const active = selectedPriority === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.chip,
                  active && { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }
                ]}
                onPress={() => {
                  setSelectedPriority(p);
                  loadRecommendations(location, selectedCuisine, p, selectedBudget, selectedMood);
                }}
              >
                <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Budget Selector */}
      <View style={styles.budgetRow}>
        <Text style={[styles.filterTitle, { color: theme.colors.textMuted }]}>{t('home.budgetPrompt')}</Text>
        <View style={styles.budgetChips}>
          {[1, 2, 3, 4].map(b => (
            <TouchableOpacity
              key={b}
              style={[
                styles.budgetBtn,
                selectedBudget === b && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => {
                setSelectedBudget(b);
                loadRecommendations(location, selectedCuisine, selectedPriority, b, selectedMood);
              }}
            >
              <Text style={[styles.budgetText, selectedBudget === b && { color: '#FFFFFF' }]}>
                {'৳'.repeat(b)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Find My Best Option Button */}
      <TouchableOpacity
        style={[styles.mainCtaBtn, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Results', { results, location })}
      >
        <Text style={styles.mainCtaText}>
          {t('home.findBestOption')} ({results.length} found) →
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  wakeUpBanner: {
    backgroundColor: '#E05326',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  wakeUpText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flex: 1 },
  rainBanner: { backgroundColor: 'rgba(56, 189, 248, 0.2)', padding: 12, borderRadius: 12, marginBottom: 12 },
  rainText: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
  offlineBanner: { backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: 10, borderRadius: 12, marginBottom: 12 },
  offlineText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16
  },
  locationInfo: { flex: 1 },
  locPrompt: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  locName: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  gpsBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  gpsBtnText: { fontWeight: '800', fontSize: 13 },
  eatNowBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  eatNowText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  sectionCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  updatedText: { fontSize: 12 },
  whySummary: { fontSize: 13, fontWeight: '600', marginVertical: 8, lineHeight: 18 },
  pickItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  badgePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  pickName: { fontSize: 15, fontWeight: '700' },
  pickReason: { fontSize: 13, marginTop: 2 },
  chipSection: { marginBottom: 16 },
  filterTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  scrollRow: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: 8,
    minHeight: 40,
    justifyContent: 'center'
  },
  chipText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  budgetChips: { flexDirection: 'row', gap: 6 },
  budgetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  budgetText: { color: '#94A3B8', fontWeight: '800', fontSize: 14 },
  mainCtaBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  mainCtaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});
