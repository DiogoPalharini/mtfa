import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LoadItem } from './LoadCard';

const SURFACE = '#FFFFFF';
const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';
const PRIMARY = '#0052CC';

interface Props {
  visible: boolean;
  item?: LoadItem | null;
  onClose: () => void;
}

export default function LoadDetailsModal({ visible, item, onClose }: Props) {
  if (!item) return null;

  const Row = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={TEXT_SECONDARY} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Detalhes do Carregamento</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={TEXT} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
            <Row label="ID" value={item.id} icon="information-circle-outline" />
            <Row label="Data/Hora" value={`${item.date} • ${item.time}`} icon="calendar-outline" />
            <Row label="Caminhão/Motorista" value={`${item.truck} • ${item.driver}`} icon="car-outline" />
            <Row label="Empresa/Campo" value={`${item.company} • ${item.field}`} icon="business-outline" />
            <Row label="Variedade" value={item.variety} icon="pricetag-outline" />
            <Row label="Entrega" value={item.deliveryLocation} icon="navigate-outline" />
          </ScrollView>
          <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: TEXT,
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  label: {
    color: TEXT_SECONDARY,
    fontSize: 12,
  },
  value: {
    color: TEXT,
    fontSize: 16,
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
