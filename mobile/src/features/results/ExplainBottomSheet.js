import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

export default function ExplainBottomSheet({ visible, onClose, restaurant, theme }) {
  if (!restaurant) return null;
  const b = restaurant.factorBreakdown || {};

  const renderBar = (label, val, color) => (
    <View style={styles.barItem} key={label}>
      <View style={styles.barHeader}>
        <Text style={[styles.barLabel, { color: theme.colors.textMuted }]}>{label}</Text>
        <Text style={[styles.barVal, { color: theme.colors.text }]}>{val || 50}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${val || 50}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.colors.text }]}>Recommendation Factors</Text>
              <Text style={[styles.sub, { color: theme.colors.primary }]}>{restaurant.displayName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 20, color: theme.colors.textMuted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={[styles.reason, { color: theme.colors.textMuted }]}>{restaurant.reason}</Text>

            <View style={styles.barsContainer}>
              {renderBar('Taste Match', b.taste, '#8B5CF6')}
              {renderBar('Travel Time (Traffic Aware)', b.time, '#10B981')}
              {renderBar('Traffic Smoothness', b.traffic, '#3B82F6')}
              {renderBar('User Rating', b.rating, '#F59E0B')}
              {renderBar('Restaurant Price Level', b.price, '#EC4899')}
              {renderBar('Transport Transit Cost', b.cost, '#14B8A6')}
              {renderBar('Proximity Distance', b.distance, '#6366F1')}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  closeBtn: { padding: 8 },
  body: { marginVertical: 8 },
  reason: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  barsContainer: { gap: 14, paddingBottom: 24 },
  barItem: { marginBottom: 10 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 12, fontWeight: '600' },
  barVal: { fontSize: 12, fontWeight: '800' },
  barTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 9999 }
});
