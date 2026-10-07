import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { getCurrentOrFallbackLocation } from '../../services/location.js';
import { apiClient } from '../../api/client.js';
import { darkMapStyle } from '../../config/mapStyleDark.js';

const { width, height } = Dimensions.get('window');

export default function MapTabScreen({ navigation, theme }) {
  const [location, setLocation] = useState({ lat: 23.7925, lng: 90.4150, name: 'Gulshan' });
  const [restaurants, setRestaurants] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    const loc = await getCurrentOrFallbackLocation();
    setLocation(loc);
    try {
      const data = await apiClient.getRecommendations({
        lat: loc.lat,
        lng: loc.lng,
        cuisine: 'All',
        priority: 'Best Overall'
      });
      setRestaurants(data.results || []);
      if (data.results?.length > 0) {
        setSelectedPlace(data.results[0]);
      }
    } catch (e) {
      console.warn('Map data load error:', e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={theme.isDark ? darkMapStyle : []}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04
        }}
      >
        {/* User Location Marker: Primary dot */}
        <Marker
          coordinate={{ latitude: location.lat, longitude: location.lng }}
          title="You are here"
          pinColor={theme.colors.primary}
        />

        {/* Restaurant Markers: Primary numbered pins, selected is saffron */}
        {restaurants.map((r, idx) => (
          <Marker
            key={r.id}
            coordinate={{
              latitude: r.location.latitude,
              longitude: r.location.longitude
            }}
            title={`${idx + 1}. ${r.displayName}`}
            description={`${r.rating}★ • ${Math.round(r.durationSeconds / 60)} min`}
            onPress={() => setSelectedPlace(r)}
            pinColor={selectedPlace?.id === r.id ? theme.colors.accent : theme.colors.primary}
          />
        ))}
      </MapView>

      {/* Selected Card Popup at Bottom */}
      {selectedPlace && (
        <View style={[styles.calloutCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: theme.colors.scrim }]}>
          <View style={styles.calloutHeader}>
            <Text style={[styles.calloutTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {selectedPlace.displayName}
            </Text>
            <Text style={[styles.calloutRating, { color: theme.colors.primary }]}>
              {selectedPlace.rating}★ ({selectedPlace.userRatingCount})
            </Text>
          </View>
          <Text style={[styles.calloutReason, { color: theme.colors.textMuted }]} numberOfLines={2}>
            {selectedPlace.reason}
          </Text>
          <View style={styles.calloutActions}>
            <TouchableOpacity
              style={[styles.calloutBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurant: selectedPlace, location })}
            >
              <Text style={[styles.calloutBtnText, { color: theme.colors.onPrimary }]}>View Restaurant →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  calloutCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  calloutHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calloutTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  calloutRating: { fontSize: 14, fontWeight: '800' },
  calloutReason: { fontSize: 12, lineHeight: 16, marginBottom: 12 },
  calloutActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  calloutBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  calloutBtnText: { fontWeight: '800', fontSize: 13 }
});
