import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { commonI18n } from '../i18n/common';

const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';
const SUCCESS = '#28A745';
const WARNING = '#FFC107';
const SURFACE = '#FFFFFF';
const PRIMARY = '#0052CC';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

export interface LoadItem {
  id: string;
  date: string;
  time: string;
  truck: string;
  othertruck?: string;
  driver: string;
  otherdriver?: string;
  company: string; // farm
  otherfarm?: string;
  field: string;
  otherfield?: string;
  variety: string;
  othervariety?: string;
  deliveryLocation: string; // destination
  otherdestination?: string;
  agreement?: string;
  otheragreement?: string;
  notes?: string; // dnote
  status: 'pendente' | 'sincronizado';
  created_at?: string;
  synced_at?: string;
}

interface Props {
  item: LoadItem;
  onPress: (item: LoadItem) => void;
}

export default function LoadCard({ item, onPress }: Props) {
  const { language } = useLanguage();
  const t = commonI18n[language];
  
  const scale = new Animated.Value(1);
  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  const statusColor = item.status === 'sincronizado' ? SUCCESS : WARNING;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => onPress(item)}
        style={styles.loadCard}
      >
        {/* Header com Status */}
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status === 'sincronizado' ? t.synchronized : t.pending}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color={TEXT_SECONDARY} />
            <Text style={styles.dateText}>{item.date}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>

        {/* Conteúdo Principal */}
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="car-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.labelText}>{t.vehicle}</Text>
              <Text style={styles.valueText}>{item.truck}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.labelText}>{t.driver}</Text>
              <Text style={styles.valueText}>{item.driver}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="business-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.labelText}>{t.location}</Text>
              <Text style={styles.valueText}>{item.company} • {item.field}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="leaf-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.labelText}>{t.product}</Text>
              <Text style={styles.valueText}>{item.variety}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="navigate-outline" size={14} color={PRIMARY} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.labelText}>{t.destination}</Text>
              <Text style={styles.valueText}>{item.deliveryLocation}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 2,
    ...CARD_SHADOW,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT,
    marginTop: 1,
  },
  timeText: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    marginTop: 1,
  },
  cardContent: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  labelText: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    fontWeight: '500',
    marginBottom: 1,
  },
  valueText: {
    fontSize: 12,
    color: TEXT,
    fontWeight: '500',
  },
});
