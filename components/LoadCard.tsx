import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TEXT = '#212529';
const TEXT_SECONDARY = '#6C757D';
const SUCCESS = '#28A745';
const WARNING = '#FFC107';
const SURFACE = '#FFFFFF';

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
  driver: string;
  company: string;
  field: string;
  variety: string;
  deliveryLocation: string;
  status: 'pendente' | 'sincronizado';
}

interface Props {
  item: LoadItem;
  onPress: (item: LoadItem) => void;
}

export default function LoadCard({ item, onPress }: Props) {
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
        <View style={styles.loadHeaderRow}>
          <Text style={styles.loadId}>{item.id}</Text>
          <View style={styles.statusPill}> 
            <Ionicons name={item.status === 'sincronizado' ? 'checkmark-circle' : 'time-outline'} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status === 'sincronizado' ? 'Sincronizado' : 'Pendente'}
            </Text>
          </View>
        </View>
        <View style={styles.loadRow}> 
          <Ionicons name="calendar-outline" size={16} color={TEXT_SECONDARY} />
          <Text style={styles.loadValue}>{item.date} • {item.time}</Text>
        </View>
        <View style={styles.loadRow}> 
          <Ionicons name="car-outline" size={16} color={TEXT_SECONDARY} />
          <Text style={styles.loadValue}>{item.truck} • {item.driver}</Text>
        </View>
        <View style={styles.loadRow}> 
          <Ionicons name="business-outline" size={16} color={TEXT_SECONDARY} />
          <Text style={styles.loadValue}>{item.company} • {item.field}</Text>
        </View>
        <View style={styles.loadRow}> 
          <Ionicons name="navigate-outline" size={16} color={TEXT_SECONDARY} />
          <Text style={styles.loadValue}>{item.variety} → {item.deliveryLocation}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    ...CARD_SHADOW,
  },
  loadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loadId: {
    color: TEXT,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F4F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  loadValue: {
    color: TEXT,
    fontSize: 14,
  },
});
