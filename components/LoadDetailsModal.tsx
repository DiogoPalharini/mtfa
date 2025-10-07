import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LoadItem } from './LoadCard';
import { useLanguage } from '../contexts/LanguageContext';
import { commonI18n } from '../i18n/common';

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
  const { language } = useLanguage();
  const t = commonI18n[language];
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

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'Data/hora não disponível';
    return `${date} às ${time}`;
  };

  const formatSyncDate = (dateString?: string) => {
    if (!dateString) return 'Não sincronizado';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.loadDetails}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={TEXT} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
            {/* Informações Básicas */}
            <Text style={styles.sectionTitle}>{t.basicInfo}</Text>
            <Row label={t.dateTime} value={formatDateTime(item.date, item.time)} icon="calendar-outline" />
            <Row label={t.status} value={item.status === 'sincronizado' ? t.synchronized : t.pending} icon={item.status === 'sincronizado' ? 'checkmark-circle' : 'time-outline'} />
            
            {/* Veículo e Motorista */}
            <Text style={styles.sectionTitle}>{t.vehicleDriver}</Text>
            <Row label={t.truck} value={item.truck} icon="car-outline" />
            {item.othertruck && <Row label={t.customTruck} value={item.othertruck} icon="car-sport-outline" />}
            <Row label={t.driver} value={item.driver} icon="person-outline" />
            {item.otherdriver && <Row label={t.customDriver} value={item.otherdriver} icon="person-add-outline" />}
            
            {/* Localização */}
            <Text style={styles.sectionTitle}>{t.location}</Text>
            <Row label={t.farm} value={item.company} icon="business-outline" />
            {item.otherfarm && <Row label={t.customFarm} value={item.otherfarm} icon="business-outline" />}
            <Row label={t.field} value={item.field} icon="leaf-outline" />
            {item.otherfield && <Row label={t.customField} value={item.otherfield} icon="leaf-outline" />}
            
            {/* Produto */}
            <Text style={styles.sectionTitle}>{t.product}</Text>
            <Row label={t.variety} value={item.variety} icon="pricetag-outline" />
            {item.othervariety && <Row label={t.customVariety} value={item.othervariety} icon="pricetag-outline" />}
            
            {/* Destino */}
            <Text style={styles.sectionTitle}>{t.destination}</Text>
            <Row label={t.deliveryLocation} value={item.deliveryLocation} icon="navigate-outline" />
            {item.otherdestination && <Row label={t.customDestination} value={item.otherdestination} icon="location-outline" />}
            
            {/* Acordo */}
            {item.agreement && (
              <>
                <Text style={styles.sectionTitle}>{t.agreement}</Text>
                <Row label={t.agreementType} value={item.agreement} icon="document-text-outline" />
                {item.otheragreement && <Row label={t.customAgreement} value={item.otheragreement} icon="document-outline" />}
              </>
            )}
            
            {/* Notas */}
            {item.notes && (
              <>
                <Text style={styles.sectionTitle}>{t.observations}</Text>
                <Row label={t.notes} value={item.notes} icon="chatbubble-outline" />
              </>
            )}
            
            {/* Informações de Sincronização */}
            <Text style={styles.sectionTitle}>{t.synchronization}</Text>
            <Row label={t.createdAt} value={item.created_at ? formatSyncDate(item.created_at) : t.notAvailable} icon="time-outline" />
            <Row label={t.syncedAt} value={formatSyncDate(item.synced_at)} icon="cloud-done-outline" />
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
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
});
