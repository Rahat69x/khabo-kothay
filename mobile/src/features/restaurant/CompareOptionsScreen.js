import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { apiClient } from '../../api/client.js';
import { t } from '../../i18n/index.js';

export default function CompareOptionsScreen({ route, theme }) {
  const { restaurant, location } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      const res = await apiClient.compareRoutes(
        { lat: location?.lat || 23.7975, lng: location?.lng || 90.4234 },
        { lat: restaurant.location.latitude, lng: restaurant.location.longitude }
      );
      setData(res);
    } catch (e) {
      console.warn('Compare routes error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textMuted }}>Unable to compare routes right now.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Recommended Highlight */}
        <View style={[styles.recommendBox, { backgroundColor: theme.colors.primaryTint, borderLeftColor: theme.colors.primary }]}>
          <Text style={[styles.recTitle, { color: theme.colors.primary }]}>★ {t('compare.recommendedRoute')}</Text>
          <Text style={[styles.recText, { color: theme.colors.text }]}>{data.recommendationReason}</Text>
        </View>

        {/* Alternative Routes Grid */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('compare.alternativeRoutes')}
        </Text>
        {data.routes?.map((r, idx) => (
          <View
            key={idx}
            style={[
              styles.routeCard,
              { backgroundColor: theme.colors.card, borderColor: idx === data.recommendedRouteIndex ? theme.colors.primary : theme.colors.border }
            ]}
          >
            <View style={styles.routeHeader}>
              <Text style={[styles.routeName, { color: theme.colors.text }]}>{r.name}</Text>
              {idx === data.recommendedRouteIndex && (
                <View style={[styles.recBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.recBadgeText, { color: theme.colors.onPrimary }]}>Recommended</Text>
                </View>
              )}
            </View>
            <View style={styles.routeStats}>
              <Text style={[styles.statText, { color: theme.colors.textMuted }]}>⏱️ {Math.round(r.durationSeconds / 60)} min</Text>
              <Text style={[styles.statText, { color: theme.colors.textMuted }]}>🛣️ {(r.distanceMeters / 1000).toFixed(1)} km</Text>
              <Text
                style={[
                  styles.trafficTag,
                  {
                    color: r.trafficLevel === 'Low'
                      ? theme.colors.trafficLow
                      : (r.trafficLevel === 'Moderate' ? theme.colors.trafficModerate : theme.colors.trafficHeavy)
                  }
                ]}
              >
                {r.trafficLevel} Traffic
              </Text>
            </View>
          </View>
        ))}

        {/* Transport Mode Table */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
          {t('compare.transportModes')}
        </Text>
        <Text style={[styles.disclaimer, { color: theme.colors.textSubtle }]}>
          All costs are estimated based on Dhaka standard rates &amp; congestion.
        </Text>

        <View style={[styles.table, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {data.transportModes?.map((m, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeName, { color: theme.colors.text }]}>{m.modeName}</Text>
                <Text style={[styles.modeCalc, { color: theme.colors.textSubtle }]}>{m.breakdown.calculation}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.costVal, { color: theme.colors.primary }]}>~৳{m.estimatedCostBdt}</Text>
                <Text style={[styles.feasibleText, { color: theme.colors.textMuted }]}>{m.feasible ? '✅ Feasible' : '⚠️ Long'}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  recommendBox: {
    borderLeftWidth: 4,
    padding: 14,
    borderRadius: 8,
    marginBottom: 20
  },
  recTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  recText: { fontSize: 14, marginTop: 4, lineHeight: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  disclaimer: { fontSize: 12, marginBottom: 12 },
  routeCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  routeName: { fontSize: 15, fontWeight: '700' },
  recBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  recBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  routeStats: { flexDirection: 'row', gap: 12 },
  statText: { fontSize: 13 },
  trafficTag: { fontSize: 13, fontWeight: '700' },
  table: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modeName: { fontSize: 14, fontWeight: '700' },
  modeCalc: { fontSize: 11, marginTop: 2 },
  costVal: { fontSize: 14, fontWeight: '800' },
  feasibleText: { fontSize: 11, marginTop: 2 }
});
