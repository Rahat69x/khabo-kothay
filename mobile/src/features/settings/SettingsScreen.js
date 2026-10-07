import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Share,
  Alert
} from 'react-native';
import { mobileStorage } from '../../services/storage.js';
import { scheduleMealNudges, cancelAllNudges } from '../../services/notifications.js';
import { t, setLocale, getLocale } from '../../i18n/index.js';

export default function SettingsScreen({ theme, onThemeChange }) {
  const [currentLang, setCurrentLang] = useState(getLocale());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [learningEnabled, setLearningEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const isLearn = await mobileStorage.isLearningEnabled();
    setLearningEnabled(isLearn);
  };

  const handleLangToggle = (lang) => {
    setCurrentLang(lang);
    setLocale(lang);
  };

  const handleNotificationsToggle = async (val) => {
    setNotificationsEnabled(val);
    if (val) {
      await scheduleMealNudges(true, true);
    } else {
      await cancelAllNudges();
    }
  };

  const handleExportData = async () => {
    const data = await mobileStorage.exportAllData();
    try {
      await Share.share({
        title: 'Khabo Kothay? - Data Export',
        message: JSON.stringify(data, null, 2)
      });
    } catch (e) {}
  };

  const handleDeleteData = () => {
    Alert.alert(
      t('settings.deleteData'),
      t('settings.deleteConfirm'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await mobileStorage.deleteAllData();
            Alert.alert('Data Deleted', 'All local preferences and taste data have been wiped.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Language Selection */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🌐 {t('settings.language')}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                currentLang === 'en' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => handleLangToggle('en')}
            >
              <Text style={[styles.langBtnText, currentLang === 'en' && { color: '#FFFFFF' }]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langBtn,
                currentLang === 'bn' && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => handleLangToggle('bn')}
            >
              <Text style={[styles.langBtnText, currentLang === 'bn' && { color: '#FFFFFF' }]}>
                বাংলা (Bangla)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Appearance Selection */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🎨 {t('settings.theme')}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                theme.isDark && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => onThemeChange && onThemeChange('dark')}
            >
              <Text style={[styles.langBtnText, theme.isDark && { color: '#FFFFFF' }]}>
                {t('settings.themeDark')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langBtn,
                !theme.isDark && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => onThemeChange && onThemeChange('light')}
            >
              <Text style={[styles.langBtnText, !theme.isDark && { color: '#FFFFFF' }]}>
                {t('settings.themeLight')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🔔 {t('settings.notifications')}</Text>
              <Text style={[styles.subText, { color: theme.colors.textMuted }]}>
                {t('settings.lunchNudge')} & {t('settings.dinnerNudge')}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#334155', true: theme.colors.primary }}
            />
          </View>
        </View>

        {/* Privacy & Data Management */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🔒 Privacy & Data</Text>
          <Text style={[styles.privacyNote, { color: theme.colors.textSubtle }]}>
            {t('settings.privacyNote')}
          </Text>

          <TouchableOpacity style={styles.actionBtn} onPress={handleExportData}>
            <Text style={{ color: theme.colors.secondary, fontWeight: '700' }}>
              📥 {t('settings.exportData')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleDeleteData}>
            <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>
              🗑️ {t('settings.deleteData')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Info */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>ℹ️ {t('settings.about')}</Text>
          <Text style={[styles.aboutText, { color: theme.colors.textMuted }]}>
            Khabo Kothay? (খাবো কোথায়?) - Dhaka Traffic-Aware Dining Assistant
          </Text>
          <Text style={[styles.aboutText, { color: theme.colors.textSubtle }]}>
            {t('settings.version')} 1.1.0 • Mobile Client
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  subText: { fontSize: 12, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center'
  },
  langBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  privacyNote: { fontSize: 12, lineHeight: 18, marginBottom: 16 },
  actionBtn: { paddingVertical: 12 },
  aboutText: { fontSize: 13, marginTop: 4 }
});
