import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  Alert
} from 'react-native';
import { apiClient } from '../../api/client.js';
import { mobileStorage } from '../../services/storage.js';
import { t } from '../../i18n/index.js';

export default function RestaurantDetailScreen({ route, navigation, theme }) {
  const { restaurant, location } = route.params || {};
  const [details, setDetails] = useState(restaurant);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    initDetails();
  }, []);

  const initDetails = async () => {
    const favStatus = await mobileStorage.isFavorite(restaurant.id);
    setIsFav(favStatus);

    try {
      const full = await apiClient.getPlaceDetails(restaurant.id);
      setDetails(prev => ({ ...prev, ...full }));
    } catch (e) {
      console.warn('Could not fetch extra details:', e);
    }
  };

  const handleCall = () => {
    const phone = details?.nationalPhoneNumber || details?.internationalPhoneNumber;
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
    } else {
      Alert.alert(t('restaurant.call'), t('restaurant.noPhone'));
    }
  };

  const handleWebsite = () => {
    if (details?.websiteUri) {
      Linking.openURL(details.websiteUri);
    }
  };

  const handleDirections = () => {
    const userLat = location?.lat || 23.7975;
    const userLng = location?.lng || 90.4234;
    const destLat = details.location.latitude;
    const destLng = details.location.longitude;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}`;
    
    // Set pending visit flag for "Did you go?" prompt next time
    mobileStorage.setItem('pending_visit_place', {
      id: details.id,
      name: details.displayName,
      cuisine: details.cuisine,
      timestamp: Date.now()
    });

    Linking.openURL(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${details.displayName} in Gulshan (${details.cuisine}): ${details.reason}`,
        title: details.displayName
      });
    } catch (e) {}
  };

  const handleToggleFav = async () => {
    const next = await mobileStorage.toggleFavorite(details);
    setIsFav(next);
  };

  const handleDismiss = async () => {
    const currentProfile = await mobileStorage.getTasteProfile();
    await apiClient.postTasteEvent(currentProfile, {
      type: 'dismissed',
      restaurantId: details.id,
      cuisine: details.cuisine
    });
    Alert.alert('Feedback Recorded', 'Your taste profile has been updated to recommend less of this food.');
    navigation.goBack();
  };

  const photoUrl = apiClient.getPhotoUrl(details?.photos?.[0]?.name, 600);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={{ uri: photoUrl }} style={styles.heroPhoto} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{details.displayName}</Text>
            <Text style={[styles.cuisine, { color: theme.colors.secondary }]}>{details.cuisine}</Text>
          </View>
          <TouchableOpacity onPress={handleToggleFav} style={styles.favBtn}>
            <Text style={{ fontSize: 26 }}>{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
            ⭐ {details.rating} ({details.userRatingCount} reviews) • {'৳'.repeat(details.priceLevel || 2)}
          </Text>
          <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
            🕒 {Math.round(details.durationSeconds / 60)} min • {(details.distanceMeters / 1000).toFixed(1)} km
          </Text>
        </View>

        <Text style={[styles.address, { color: theme.colors.textSubtle }]}>
          📍 {details.formattedAddress}
        </Text>

        <View style={[styles.reasonCard, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={styles.reasonIcon}>💡</Text>
          <Text style={[styles.reasonText, { color: theme.colors.text }]}>{details.reason}</Text>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: theme.colors.primary }]}
            onPress={handleCall}
          >
            <Text style={[styles.primaryActionText, { color: theme.colors.onPrimary }]}>📞 {details.nationalPhoneNumber ? t('restaurant.call') : t('restaurant.noPhone')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryAction, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={handleDirections}
          >
            <Text style={[styles.secondaryActionText, { color: theme.colors.text }]}>🧭 {t('restaurant.directions')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.extraActions}>
          {details.websiteUri && (
            <TouchableOpacity style={styles.textBtn} onPress={handleWebsite}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>🌐 {t('restaurant.website')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.textBtn} onPress={handleShare}>
            <Text style={{ color: theme.colors.textMuted, fontWeight: '700' }}>📤 {t('restaurant.share')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textBtn}
            onPress={() => navigation.navigate('CompareOptions', { restaurant: details, location })}
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>🔄 {t('restaurant.compare')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
          <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>
            ✕ {t('restaurant.dismiss')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroPhoto: { width: '100%', height: 240 },
  body: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  cuisine: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  favBtn: { padding: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  metaText: { fontSize: 14, fontWeight: '600' },
  address: { fontSize: 13, marginBottom: 16 },
  reasonCard: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginBottom: 20
  },
  reasonIcon: { fontSize: 18 },
  reasonText: { flex: 1, fontSize: 13, lineHeight: 18 },
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  primaryAction: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryActionText: { fontWeight: '800', fontSize: 15 },
  secondaryAction: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  secondaryActionText: { fontWeight: '800', fontSize: 15 },
  extraActions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
  textBtn: { padding: 8 },
  dismissBtn: { alignSelf: 'center', marginTop: 24, padding: 8 }
});
