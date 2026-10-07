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

  const renderItem = ({ item, index }) => {
    const mins = Math.max(1, Math.round(item.durationSeconds / 60));
    const km = (item.distanceMeters / 1000).toFixed(1);
    const trafficColor = item.trafficLevel === 'Low' ? theme.colors.trafficLow : (item.trafficLevel === 'Moderate' ? theme.colors.trafficModerate : theme.colors.trafficHeavy);
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
            <View style={[styles.scoreBadge, { backgroundColor: theme.colors.primaryGlow }]}>
              <Text style={[styles.scoreText, { color: theme.colors.primary }]}>{item.score}</Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            {item.badges?.map((b) => (
              <View key={b} style={styles.badgePill}>
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
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
            <View style={[styles.trafficChip, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={[styles.trafficText, { color: trafficColor }]}>
                🚦 {item.trafficLevel} Traffic
              </Text>
            </View>
            <View style={styles.transitBox}>
              <Text style={styles.transitText}>
                ~৳{item.transport?.cheapestEstimatedCostBdt} ({item.transport?.cheapestFeasibleMode}) <Text style={styles.estLabel}>estimated</Text>
              </Text>
            </View>
          </View>

          {item.departurePredictions?.bestSuggestion && (
            <View style={[styles.predictionPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)', alignSelf: 'flex-start', marginVertical: 4 }]}>
              <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 11 }}>
                ⏱️ {item.departurePredictions.bestSuggestion.message}
              </Text>
            </View>
          )}

          {item.counterfactual && (
            <View style={[styles.counterfactualBox, { backgroundColor: 'rgba(234, 179, 8, 0.12)', borderColor: 'rgba(234, 179, 8, 0.3)' }]}>
              <Text style={[styles.counterfactualText, { color: '#FACC15' }]}>
                💡 {item.counterfactual}
              </Text>
            </View>
          )}

          <View style={styles.reasonBox}>
            <Text style={styles.reasonText} numberOfLines={2}>
              💡 {item.reason}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setExplainItem(item)}
            >
              <Text style={[styles.actionBtnText, { color: theme.colors.secondary }]}>
                📊 {t('restaurant.explain')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtnPrimary, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('CompareOptions', { restaurant: item, location })}
            >
              <Text style={styles.actionBtnPrimaryText}>
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
            <Text style={styles.emptyText}>{t('common.emptyDesc')}</Text>
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
  badgePill: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#E2E8F0' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaText: { fontSize: 13, fontWeight: '600' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  trafficChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trafficText: { fontSize: 12, fontWeight: '800' },
  transitBox: { flex: 1 },
  transitText: { fontSize: 12, fontWeight: '700', color: '#38BDF8' },
  estLabel: { fontSize: 10, color: '#94A3B8' },
  reasonBox: { backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: 10, borderRadius: 8, marginBottom: 12 },
  reasonText: { fontSize: 12, color: '#E2E8F0', lineHeight: 16 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  actionBtnPrimary: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  actionBtnPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', textAlign: 'center' },
  predictionPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  counterfactualBox: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8
  },
  counterfactualText: { fontSize: 11, fontWeight: '700', lineHeight: 15 }
});
