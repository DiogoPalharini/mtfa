import React, { useMemo, useState } from 'react';
import { Platform, StatusBar as RNStatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';

const PRIMARY = '#0052CC';
const TEXT_ON_PRIMARY = '#FFFFFF';
const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;

interface AppHeaderProps {
  projectName?: string;
  showBack?: boolean;
  showSync?: boolean;
  isSyncing?: boolean;
  onSyncPress?: () => void;
}

export default function AppHeader({ 
  projectName = 'MTFA', 
  showBack = false, 
  showSync = false, 
  isSyncing = false, 
  onSyncPress 
}: AppHeaderProps) {
  const { language, setLanguage } = useLanguage();
  const [openLangMenu, setOpenLangMenu] = useState(false);

  const languageLabel = useMemo(() => {
    switch (language) {
      case 'pt':
        return 'Português';
      case 'en':
        return 'English';
      case 'de':
        return 'Deutsch';
      default:
        return 'Português';
    }
  }, [language]);

  const handleChangeLanguage = (lang: 'pt' | 'en' | 'de') => {
    setLanguage(lang);
    setOpenLangMenu(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={24} color={TEXT_ON_PRIMARY} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>{projectName}</Text>

        <View style={styles.right}>
          <View style={styles.rightButtons}>
            {showSync && (
              <TouchableOpacity 
                style={styles.syncButton} 
                onPress={onSyncPress}
                disabled={isSyncing}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isSyncing ? "sync" : "cloud-upload-outline"} 
                  size={24} 
                  color={TEXT_ON_PRIMARY} 
                />
              </TouchableOpacity>
            )}
            
            <View style={{ position: 'relative' }}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setOpenLangMenu((v) => !v)}>
                <Ionicons name="globe-outline" size={24} color={TEXT_ON_PRIMARY} />
              </TouchableOpacity>

              {openLangMenu && (
                <View style={styles.langMenu}>
                  <TouchableOpacity style={styles.langItem} onPress={() => handleChangeLanguage('pt')}>
                    <Text style={styles.langText}>Português</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.langItem} onPress={() => handleChangeLanguage('en')}>
                    <Text style={styles.langText}>English</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.langItem} onPress={() => handleChangeLanguage('de')}>
                    <Text style={styles.langText}>Deutsch</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: PRIMARY,
    paddingTop: STATUS_BAR_HEIGHT + 12,
    position: 'relative',
    zIndex: 1000,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    width: 40,
    alignItems: 'flex-start',
  },
  right: {
    alignItems: 'flex-end',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncButton: {
    padding: 4,
    opacity: 1,
  },
  title: {
    color: TEXT_ON_PRIMARY,
    fontSize: 20,
    fontWeight: 'bold',
  },
  langMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 16,
    zIndex: 2000,
  },
  langItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  langText: {
    color: TEXT,
    fontSize: 14,
  },
});
