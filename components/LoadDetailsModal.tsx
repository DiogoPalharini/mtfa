import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Platform, SectionList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LoadItem } from './LoadCard';
import { useLanguage } from '../contexts/LanguageContext';
import { commonI18n } from '../i18n/common';

const SURFACE = '#FFFFFF';
const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';
const PRIMARY = '#0052CC';
const SHEET_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.85);

interface Props {
  visible: boolean;
  item?: LoadItem | null;
  onClose: () => void;
}

export default function LoadDetailsModal({ visible, item, onClose }: Props) {
  const { language } = useLanguage();
  const t = commonI18n[language];
  if (!item) return null;

  const noteValue = item.notes?.trim();

  type DetailItem = {
    key: string;
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
  };

  type DetailSection = {
    key: string;
    title: string;
    data: DetailItem[];
  };

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

  const sections: DetailSection[] = [];

  sections.push({
    key: 'basic',
    title: t.basicInfo,
    data: [
      {
        key: 'basic-dateTime',
        label: t.dateTime,
        value: formatDateTime(item.date, item.time),
        icon: 'calendar-outline',
      },
      {
        key: 'basic-status',
        label: t.status,
        value: item.status === 'sincronizado' ? t.synchronized : t.pending,
        icon: item.status === 'sincronizado' ? 'checkmark-circle' : 'time-outline',
      },
    ],
  });

  const vehicleData: DetailItem[] = [
    {
      key: 'vehicle-truck',
      label: t.truck,
      value: item.truck,
      icon: 'car-outline',
    },
  ];

  if (item.othertruck) {
    vehicleData.push({
      key: 'vehicle-othertruck',
      label: t.customTruck,
      value: item.othertruck,
      icon: 'car-sport-outline',
    });
  }

  vehicleData.push({
    key: 'vehicle-driver',
    label: t.driver,
    value: item.driver,
    icon: 'person-outline',
  });

  if (item.otherdriver) {
    vehicleData.push({
      key: 'vehicle-otherdriver',
      label: t.customDriver,
      value: item.otherdriver,
      icon: 'person-add-outline',
    });
  }

  sections.push({
    key: 'vehicle',
    title: t.vehicleDriver,
    data: vehicleData,
  });

  const locationData: DetailItem[] = [
    {
      key: 'location-farm',
      label: t.farm,
      value: item.company,
      icon: 'business-outline',
    },
  ];

  if (item.otherfarm) {
    locationData.push({
      key: 'location-otherfarm',
      label: t.customFarm,
      value: item.otherfarm,
      icon: 'business-outline',
    });
  }

  locationData.push({
    key: 'location-field',
    label: t.field,
    value: item.field,
    icon: 'leaf-outline',
  });

  if (item.otherfield) {
    locationData.push({
      key: 'location-otherfield',
      label: t.customField,
      value: item.otherfield,
      icon: 'leaf-outline',
    });
  }

  sections.push({
    key: 'location',
    title: t.location,
    data: locationData,
  });

  const productData: DetailItem[] = [
    {
      key: 'product-variety',
      label: t.variety,
      value: item.variety,
      icon: 'pricetag-outline',
    },
  ];

  if (item.othervariety) {
    productData.push({
      key: 'product-othervariety',
      label: t.customVariety,
      value: item.othervariety,
      icon: 'pricetag-outline',
    });
  }

  sections.push({
    key: 'product',
    title: t.product,
    data: productData,
  });

  const destinationData: DetailItem[] = [
    {
      key: 'destination-location',
      label: t.deliveryLocation,
      value: item.deliveryLocation,
      icon: 'navigate-outline',
    },
  ];

  if (item.otherdestination) {
    destinationData.push({
      key: 'destination-other',
      label: t.customDestination,
      value: item.otherdestination,
      icon: 'location-outline',
    });
  }

  sections.push({
    key: 'destination',
    title: t.destination,
    data: destinationData,
  });

  if (item.agreement || item.otheragreement) {
    const contractData: DetailItem[] = [];

    if (item.agreement) {
      contractData.push({
        key: 'contract-type',
        label: t.contractType,
        value: item.agreement,
        icon: 'document-text-outline',
      });
    }

    if (item.otheragreement) {
      contractData.push({
        key: 'contract-custom',
        label: t.customContract,
        value: item.otheragreement,
        icon: 'document-outline',
      });
    }

    sections.push({
      key: 'contract',
      title: t.contract,
      data: contractData,
    });
  }

  sections.push({
    key: 'observations',
    title: 'Nota Fiscal', // Sempre em português, nunca traduzir
    data: [
      {
        key: 'observations-note',
        label: 'Nota Fiscal', // Sempre em português, nunca traduzir
        value: noteValue || t.notAvailable,
        icon: 'document-text-outline',
      },
    ],
  });

  sections.push({
    key: 'sync',
    title: t.synchronization,
    data: [
      {
        key: 'sync-created',
        label: t.createdAt,
        value: item.created_at ? formatSyncDate(item.created_at) : t.notAvailable,
        icon: 'time-outline',
      },
      {
        key: 'sync-synced',
        label: t.syncedAt,
        value: formatSyncDate(item.synced_at),
        icon: 'cloud-done-outline',
      },
    ],
  });

  const renderSectionHeader = ({ section }: { section: DetailSection }) => (
    <Text
      style={[
        styles.sectionTitle,
        section.key === sections[0].key ? styles.firstSectionTitle : null,
      ]}
    >
      {section.title}
    </Text>
  );

  const renderItem = ({ item: detail }: { item: DetailItem }) => (
    <View style={styles.row}>
      <Ionicons name={detail.icon} size={18} color={TEXT_SECONDARY} />
      <View style={styles.rowTextContainer}>
        <Text style={styles.label}>{detail.label}</Text>
        <Text style={styles.value}>{detail.value}</Text>
      </View>
    </View>
  );

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
          <SectionList
            style={styles.list}
            sections={sections}
            keyExtractor={(detail) => detail.key}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            SectionSeparatorComponent={() => <View style={styles.sectionSpacing} />}
            ItemSeparatorComponent={() => <View style={styles.itemSpacing} />}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.listContent}
          />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
    maxHeight: SHEET_MAX_HEIGHT,
    flex: 1,
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
  label: {
    color: TEXT_SECONDARY,
    fontSize: 12,
  },
  value: {
    color: TEXT,
    fontSize: 15,
    marginTop: 4,
    flexShrink: 1,
    lineHeight: 20,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 4,
    marginLeft: 4,
  },
  firstSectionTitle: {
    marginTop: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Platform.OS === 'android' ? 48 : 32,
    paddingTop: 4,
  },
  sectionSpacing: {
    height: 12,
  },
  itemSpacing: {
    height: 12,
  },
});