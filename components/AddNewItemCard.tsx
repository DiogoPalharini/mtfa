import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { syncService } from '../services/syncService';
import { commonI18n } from '../i18n/common';

interface AddNewItemCardProps {
  fieldType: 'truck' | 'farm' | 'field' | 'variety' | 'driver' | 'destination' | 'agreement';
  onItemAdded: (newItem: string) => void;
  onClose: () => void;
}

// Mapeamento dos tipos do formulário para os tipos do banco (usando singular)
const FIELD_TYPE_MAPPING: Record<string, string> = {
  'truck': 'truck',
  'farm': 'farm', 
  'field': 'field',
  'variety': 'variety',
  'driver': 'driver',
  'destination': 'destination',
  'agreement': 'agreement'
};

export default function AddNewItemCard({ fieldType, onItemAdded, onClose }: AddNewItemCardProps) {
  const { language } = useLanguage();
  const commonT = commonI18n[language];
  const [newItemText, setNewItemText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNew = () => {
    setIsModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!newItemText.trim()) {
      Alert.alert(commonT.error, 'Por favor, digite um valor válido.');
      return;
    }

    try {
      setIsSaving(true);
      
      // Mapear o tipo do formulário para o tipo do banco
      const dbType = FIELD_TYPE_MAPPING[fieldType] || fieldType;
      
      
      // Salvar diretamente no banco SQLite
      const saved = await syncService.saveDropdownData(dbType, newItemText.trim());
      
      if (saved) {
        
        // Notificar o componente pai que um novo item foi adicionado
        onItemAdded(newItemText.trim());
        
        // Limpar o campo e fechar o modal
        setNewItemText('');
        setIsModalVisible(false);
        
        Alert.alert(commonT.success, 'Item adicionado com sucesso!');
      } else {
        Alert.alert(commonT.error, commonT.addItemError);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar item:', error);
      Alert.alert(commonT.error, commonT.unexpectedError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewItemText('');
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Botão de adicionar */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
        <Text style={styles.addButtonIcon}>+</Text>
        <Text style={styles.addButtonText}>Adicionar novo</Text>
      </TouchableOpacity>

      {/* Modal para adicionar item */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Novo Item</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>
                {fieldType === 'truck' && 'Caminhão'}
                {fieldType === 'farm' && 'Fazenda'}
                {fieldType === 'field' && 'Campo'}
                {fieldType === 'variety' && 'Variedade'}
                {fieldType === 'driver' && 'Motorista'}
                {fieldType === 'destination' && 'Destino'}
                {fieldType === 'agreement' && 'Acordo'}
              </Text>
              
              <TextInput
                style={styles.textInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="Digite o novo item..."
                placeholderTextColor="#999"
                autoFocus={true}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{commonT.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, !newItemText.trim() && styles.disabledButton]} 
                onPress={handleSaveItem}
                disabled={!newItemText.trim() || isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Salvando...' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  addButtonIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#007bff',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
