import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert
} from 'react-native';
import { mobileStorage } from '../../services/storage.js';
import { apiClient } from '../../api/client.js';
import { t } from '../../i18n/index.js';

export default function TasteScreen({ theme }) {
  const [profile, setProfile] = useState({});
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [banditProfile, setBanditProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const p = await mobileStorage.getTasteProfile();
    const l = await mobileStorage.isLearningEnabled();
    setProfile(p);
    setLearningEnabled(l);

    try {
      const b = await apiClient.getBanditWeights();
      if (b) setBanditProfile(b);
    } catch (e) {}
  };

  const handleToggleLearning = async (val) => {
    setLearningEnabled(val);
    await mobileStorage.setLearningEnabled(val);
  };

  const handleReset = async () => {
    Alert.alert(
      t('taste.resetBtn'),
      t('taste.resetConfirm'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const def = {
              Japanese: 50, Bangladeshi: 50, Indian: 50, Chinese: 50, Korean: 50,
              'Fast Food': 50, Cafe: 50, Kabab: 50, Biriyani: 50, Dessert: 50, Coffee: 50, Burger: 50
            };
            await mobileStorage.saveTasteProfile(def);
            setProfile(def);
          }
        }
      ]
    );
  };

  const adjustScore = async (cuisine, delta) => {
    const cur = profile[cuisine] || 50;
    const next = Math.max(0, Math.min(100, cur + delta));
    const updated = { ...profile, [cuisine]: next };
    setProfile(updated);
    await mobileStorage.saveTasteProfile(updated);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.desc, { color: theme.colors.textMuted }]}>
          {t('taste.desc')}
        </Text>

        <View style={[styles.learningCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.learningText, { color: theme.colors.text }]}>
            {t('taste.learningToggle')}
          </Text>
          <Switch
            value={learningEnabled}
            onValueChange={handleToggleLearning}
            trackColor={{ false: theme.colors.skeleton, true: theme.colors.primary }}
          />
        </View>

        {/* Bandit Personal Factor Weights Card */}
        {banditProfile && (
          <View style={[styles.banditCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.banditHeader}>
              <Text style={[styles.banditTitle, { color: theme.colors.text }]}>
                🎯 Personal Decision Weights
              </Text>
              <Switch
                value={banditProfile.enabled}
                onValueChange={async (val) => {
                  const updated = await apiClient.toggleBandit(val);
                  setBanditProfile(updated.profile);
                }}
                trackColor={{ false: theme.colors.skeleton, true: theme.colors.primary }}
              />
            </View>

            <Text style={[styles.banditNote, { color: theme.colors.primary }]}>
              {banditProfile.explanationNote || "Learning your personal balance between speed, rating, cost, and distance."}
            </Text>

            <View style={styles.weightsGrid}>
              {banditProfile.weights && Object.entries(banditProfile.weights).map(([k, w]) => (
                <View key={k} style={styles.weightBadge}>
                  <Text style={[styles.weightKey, { color: theme.colors.textMuted }]}>{k}</Text>
                  <Text style={[styles.weightVal, { color: theme.colors.text }]}>{Math.round(w * 100)}%</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.banditResetBtn}
              onPress={async () => {
                const res = await apiClient.resetBanditWeights();
                setBanditProfile(res.profile);
              }}
            >
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>
                🔄 Reset Personal Weights
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>
            🔄 {t('taste.resetBtn')}
          </Text>
        </TouchableOpacity>

        <View style={styles.list}>
          {Object.entries(profile).map(([cuisine, score]) => (
            <View key={cuisine} style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.cuisineName, { color: theme.colors.text }]}>{cuisine}</Text>
                <Text style={[styles.scoreVal, { color: theme.colors.primary }]}>{score}%</Text>
              </View>

              <View style={[styles.barTrack, { backgroundColor: theme.colors.primaryTint }]}>
                <View style={[styles.barFill, { width: `${score}%`, backgroundColor: theme.colors.primary }]} />
              </View>

              <View style={styles.controls}>
                <TouchableOpacity style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={() => adjustScore(cuisine, -10)}>
                  <Text style={[styles.stepBtnText, { color: theme.colors.text }]}>-10%</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.stepBtn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={() => adjustScore(cuisine, 10)}>
                  <Text style={[styles.stepBtnText, { color: theme.colors.text }]}>+10%</Text>
                </TouchableOpacity>
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
  content: { padding: 16 },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  learningCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12
  },
  learningText: { fontSize: 14, fontWeight: '700' },
  resetBtn: { alignSelf: 'flex-end', marginBottom: 16 },
  list: { gap: 12 },
  itemCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cuisineName: { fontSize: 15, fontWeight: '700' },
  scoreVal: { fontSize: 14, fontWeight: '800' },
  barTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 9999 },
  controls: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8
  },
  stepBtnText: { fontWeight: '700', fontSize: 12 },
  banditCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16
  },
  banditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  banditTitle: { fontSize: 15, fontWeight: '800' },
  banditNote: { fontSize: 13, lineHeight: 18, marginBottom: 12, fontWeight: '600' },
  weightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  weightBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center'
  },
  weightKey: { fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  weightVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  banditResetBtn: { alignSelf: 'flex-start', paddingVertical: 4 }
});
