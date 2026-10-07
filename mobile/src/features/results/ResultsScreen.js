import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image
} from 'react-native';
import { apiClient } from '../../api/client.js';
import { mobileStorage } from '../../services/storage.js';
import ExplainBottomSheet from './ExplainBottomSheet.js';
import { t } from '../../i18n/index.js';

export default function ResultsScreen({ route, navigation, theme }) {
  const { results = [], location } = route.params || {};
  const [explainItem, setExplainItem] = useState(null);

  const getBadgeStyle = (badgeName) => {
    const lower = String(badgeName).toLowerCase();
    if (lower.includes('best overall') || lower.includes('top pick') || lower.includes('best match')) {
      return {
        bg: theme.colors.badgeBest,
        text: theme.colors.badgeBestText,
        border: 'transparent'
      };
    }
    if (lower.includes('price') || lower.includes('fastest') || lower.includes('nearest')) {
      return {
        bg: theme.colors.badgeFast,
        text: theme.colors.badgeFastText,
        border: 'transparent'
      };
    }
    if (lower.includes('new') || lower.includes('try something new')) {
      return {
        bg: 'transparent',
        text: theme.colors.badgeNewText,
        border: theme.colors.badgeNewBorder
      };
    }
    if (lower.includes('verified') || lower.includes('community')) {
      return {
        bg: theme.colors.badgeVerified,
        text: theme.colors.badgeVerifiedText,
        border: 'transparent'
      };
    }
    return {
      bg: theme.colors.surfaceAlt,
      text: theme.colors.textMuted,
      border: 'transparent'
    };
  };

  const renderItem = ({ item, index }) => {
    const mins = Math.max(1, Math.round(item.durationSeconds / 60));
    const km = (item.distanceMeters / 1000).toFixed(1);
    const trafficColor = item.trafficLevel === 'Low'
      ? theme.colors.trafficLow
      : (item.trafficLevel === 'Moderate' ? theme.colors.trafficModerate : theme.colors.trafficHeavy);
    const trafficBg = item.trafficLevel === 'Low'
      ? theme.colors.trafficLowTint
      : (item.trafficLevel === 'Moderate' ? theme.colors.trafficModerateTint : theme.colors.trafficHeavyTint);
    const photoUrl = apiClient.getPhotoUrl(item.photos?.[0]?.name, 400);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item, location })}
        activeOpacity={0.85}
      >
        <Image source={{ uri: photoUrl }} style={styles.cardPhoto} resizeMode="cover" />

        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <View style={styles.titleWrap}>
              <Text style={[styles.rank, { color: theme.colors.primary }]}>#{index + 1}</Text>
              <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                {item.displayName}
              </Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: theme.colors.primaryTint }]}>
              <Text style={[styles.scoreText, { color: theme.colors.primary }]}>{item.score}</Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            {item.badges?.map((b) => {
              const bStyle = getBadgeStyle(b);
              return (
                <View
                  key={b}
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: bStyle.bg,
                      borderWidth: bStyle.border !== 'transparent' ? 1 : 0,
                      borderColor: bStyle.border
                    }
                  ]}
                >
                  <Text style={[styles.badgeText, { color: bStyle.text }]}>{b}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              ⭐ {item.rating} ({item.userRatingCount}) • {'৳'.repeat(item.priceLevel || 2)}
            </Text>
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              🕒 {mins} min ({km} km)
            </Text>
          </View>

          <View style={styles.chipRow}>
            <View style={[styles.trafficChip, { backgroundColor: trafficBg }]}>
              <Text style={[styles.trafficText, { color: trafficColor }]}>
                🚦 {item.trafficLevel} Traffic
              </Text>
            </View>
            <View style={styles.transitBox}>
              <Text style={[styles.transitText, { color: theme.colors.primary }]}>
                ~৳{item.transport?.cheapestEstimatedCostBdt} ({item.transport?.cheapestFeasibleMode}) <Text style={[styles.estLabel, { color: theme.colors.textMuted }]}>estimated</Text>
              </Text>
            </View>
          </View>

          {item.departurePredictions?.bestSuggestion && (
            <View style={[styles.predictionPill, { backgroundColor: theme.colors.badgeVerified, alignSelf: 'flex-start', marginVertical: 4 }]}>
              <Text style={{ color: theme.colors.badgeVerifiedText, fontWeight: '800', fontSize: 11 }}>
                ⏱️ {item.departurePredictions.bestSuggestion.message}
              </Text>
            </View>
          )}

          {item.counterfactual && (
            <View style={[styles.counterfactualBox, { backgroundColor: theme.colors.warningTint, borderColor: theme.colors.warning }]}>
              <Text style={[styles.counterfactualText, { color: theme.colors.warning }]}>
                💡 {item.counterfactual}
              </Text>
            </View>
          )}

          <View style={[styles.reasonBox, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={[styles.reasonText, { color: theme.colors.text }]} numberOfLines={2}>
              💡 {item.reason}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setExplainItem(item)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>
                📊 {t('restaurant.explain')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtnPrimary, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('CompareOptions', { restaurant: item, location })}
            >
              <Text style={[styles.actionBtnPrimaryText, { color: theme.colors.onPrimary }]}>
                🔄 {t('restaurant.compare')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{t('common.emptyDesc')}</Text>
          </View>
        }
      />

      <ExplainBottomSheet
        visible={Boolean(explainItem)}
        onClose={() => setExplainItem(null)}
        restaurant={explainItem}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 16 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  cardPhoto: { width: '100%', height: 160 },
  cardContent: { padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  rank: { fontSize: 16, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '800', flex: 1 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { fontWeight: '800', fontSize: 14 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  trafficChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trafficText: { fontSize: 12, fontWeight: '800' },
  transitBox: { flex: 1 },
  transitText: { fontSize: 12, fontWeight: '700' },
  estLabel: { fontSize: 10 },
  reasonBox: { padding: 10, borderRadius: 8, marginBottom: 12 },
  reasonText: { fontSize: 12, lineHeight: 16 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  actionBtnPrimary: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center' },
  predictionPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  counterfactualBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8
  },
  counterfactualText: { fontSize: 11, fontWeight: '700', lineHeight: 15 }
});
