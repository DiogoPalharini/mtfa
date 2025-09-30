import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { createI18n } from '../i18n/create';
import { commonI18n } from '../i18n/common';

const PRIMARY = '#0052CC';
const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';
const SURFACE = '#FFFFFF';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (itemName: string) => void;
  title?: string;
  placeholder?: string;
}

export default function AddItemModal({ 
  visible, 
  onClose, 
  onAdd, 
  title, 
  placeholder 
}: AddItemModalProps) {
  const { language } = useLanguage();
  const t = createI18n[language];
  const common = commonI18n[language];
  
  const [newItemText, setNewItemText] = useState('');

  const handleAdd = () => {
    if (newItemText.trim()) {
      onAdd(newItemText.trim());
      setNewItemText('');
      onClose();
    }
  };

  const handleClose = () => {
    setNewItemText('');
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {title || t.adicionarNovoItem}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color={TEXT} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.textInput}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder={placeholder || t.novoItemPlaceholder}
              placeholderTextColor={TEXT_SECONDARY}
              autoFocus
            />
          </View>
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleClose}
            >
              <Text style={styles.secondaryButtonText}>{common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, !newItemText.trim() && styles.disabledButton]} 
              onPress={handleAdd}
              disabled={!newItemText.trim()}
            >
              <Text style={styles.primaryButtonText}>{t.adicionar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    marginVertical: 16,
  },
  textInput: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: TEXT,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...CARD_SHADOW,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    color: TEXT,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
});
