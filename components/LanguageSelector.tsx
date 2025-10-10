import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, LanguageCode } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  style?: any;
}

export default function LanguageSelector({ style }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [openLangMenu, setOpenLangMenu] = useState(false);

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  const handleLanguageSelect = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setOpenLangMenu(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setOpenLangMenu(!openLangMenu)}
        activeOpacity={0.8}
      >
        <Ionicons name="globe-outline" size={20} color="#6C757D" />
        <Text style={styles.languageText}>{currentLanguage?.name}</Text>
        <Ionicons 
          name={openLangMenu ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#6C757D" 
        />
      </TouchableOpacity>

      {openLangMenu && (
        <View style={styles.langMenu}>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.langItem}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.langText}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  languageText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 8,
  },
  langMenu: {
    position: 'absolute',
    top: 40,
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
    color: '#212529',
    fontSize: 14,
  },
});
